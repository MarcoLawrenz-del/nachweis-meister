-- STEP 1: Compliance Engine - Fixed Migration for Unified States

-- First create the new enum
CREATE TYPE public.requirement_status AS ENUM (
  'missing',
  'submitted', 
  'in_review',
  'valid',
  'rejected',
  'expiring',
  'expired'
);

-- Add a new column with the enum type
ALTER TABLE public.requirements ADD COLUMN status_new public.requirement_status;

-- Update the new column based on existing text values
UPDATE public.requirements SET status_new = 
  CASE 
    WHEN status = 'missing' THEN 'missing'::public.requirement_status
    WHEN status = 'in_review' THEN 'in_review'::public.requirement_status  
    WHEN status = 'valid' THEN 'valid'::public.requirement_status
    WHEN status = 'rejected' THEN 'rejected'::public.requirement_status
    WHEN status = 'expiring' THEN 'expiring'::public.requirement_status
    WHEN status = 'expired' THEN 'expired'::public.requirement_status
    ELSE 'missing'::public.requirement_status -- Default fallback
  END;

-- Set NOT NULL constraint and default
ALTER TABLE public.requirements 
  ALTER COLUMN status_new SET NOT NULL,
  ALTER COLUMN status_new SET DEFAULT 'missing'::public.requirement_status;

-- Drop old column and rename new one
ALTER TABLE public.requirements DROP COLUMN status;
ALTER TABLE public.requirements RENAME COLUMN status_new TO status;

-- Add missing columns to requirements table
ALTER TABLE public.requirements 
  ADD COLUMN IF NOT EXISTS valid_to DATE,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS valid_from DATE;

-- Add subcontractor flags if they don't exist
ALTER TABLE public.subcontractors 
  ADD COLUMN IF NOT EXISTS requires_employees BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_non_eu_workers BOOLEAN,
  ADD COLUMN IF NOT EXISTS employees_not_employed_in_germany BOOLEAN;

-- Create requirement_rules table for deterministic document derivation
CREATE TABLE IF NOT EXISTS public.requirement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_type TEXT NOT NULL CHECK (company_type IN ('einzelunternehmen', 'gbr', 'baubetrieb')),
  document_type_id UUID NOT NULL REFERENCES public.document_types(id),
  requires_employees BOOLEAN, -- NULL means "doesn't matter"
  has_non_eu_workers BOOLEAN, -- NULL means "doesn't matter" 
  employees_not_employed_in_germany BOOLEAN, -- NULL means "doesn't matter"
  frequency TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'annual', 'monthly')),
  validity_months INTEGER, -- How long document stays valid (NULL = permanent)
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on requirement_rules
ALTER TABLE public.requirement_rules ENABLE ROW LEVEL SECURITY;

-- Policy for requirement_rules (read-only for all authenticated users)
CREATE POLICY "Everyone can view requirement rules" 
ON public.requirement_rules 
FOR SELECT 
USING (true);

-- Create email_logs table for tracking email communications
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  subcontractor_id UUID NOT NULL,
  requirement_id UUID REFERENCES public.requirements(id),
  project_sub_id UUID REFERENCES public.project_subs(id),
  template_key TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_snippet TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policies for email_logs
CREATE POLICY "Users can view email logs for their tenant" 
ON public.email_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = email_logs.tenant_id 
    AND users.id = auth.uid()
  )
);

CREATE POLICY "Users can create email logs for their tenant" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = email_logs.tenant_id 
    AND users.id = auth.uid() 
    AND users.role IN ('owner', 'admin', 'staff')
  )
);

-- Create reminder_jobs table for automated reminders
CREATE TABLE IF NOT EXISTS public.reminder_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.requirements(id),
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'paused', 'completed', 'failed')),
  escalated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reminder_jobs
ALTER TABLE public.reminder_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for reminder_jobs
CREATE POLICY "Users can view reminder jobs for their tenant" 
ON public.reminder_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE r.id = reminder_jobs.requirement_id 
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Users can manage reminder jobs for their tenant" 
ON public.reminder_jobs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE r.id = reminder_jobs.requirement_id 
    AND u.id = auth.uid() 
    AND u.role IN ('owner', 'admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE r.id = reminder_jobs.requirement_id 
    AND u.id = auth.uid() 
    AND u.role IN ('owner', 'admin', 'staff')
  )
);

-- Add updated_at trigger for reminder_jobs
CREATE TRIGGER update_reminder_jobs_updated_at
  BEFORE UPDATE ON public.reminder_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reminder_jobs_updated_at();

-- Insert default requirement rules based on German construction compliance
INSERT INTO public.requirement_rules (company_type, document_type_id, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, frequency, validity_months) 
SELECT 
  company_type,
  dt.id,
  CASE 
    WHEN dt.code = 'BG_MITGLIEDSCHAFT' AND company_type = 'einzelunternehmen' THEN false  -- Solo contractors may not need BG
    WHEN dt.code IN ('LOHNNACHWEIS', 'SOZIALVERSICHERUNG') THEN true  -- Only if employees
    WHEN dt.code = 'A1_BESCHEINIGUNG' THEN null  -- Depends on worker origin
    WHEN dt.code = 'ARBEITSERLAUBNIS' THEN null  -- Only for non-EU workers
    ELSE null
  END as requires_employees,
  CASE 
    WHEN dt.code = 'ARBEITSERLAUBNIS' THEN true  -- Only for non-EU workers
    ELSE null
  END as has_non_eu_workers,
  CASE 
    WHEN dt.code = 'A1_BESCHEINIGUNG' THEN true  -- A1 for workers not employed in Germany
    ELSE null 
  END as employees_not_employed_in_germany,
  CASE 
    WHEN dt.code = 'LOHNNACHWEIS' THEN 'monthly'  -- Monthly payroll proof
    WHEN dt.code IN ('BG_MITGLIEDSCHAFT', 'SOZIALVERSICHERUNG', 'GEWERBEANMELDUNG') THEN 'annual'  -- Annual renewals
    ELSE 'once'  -- One-time documents
  END as frequency,
  CASE 
    WHEN dt.code = 'BG_MITGLIEDSCHAFT' THEN 12  -- Valid for 1 year
    WHEN dt.code = 'SOZIALVERSICHERUNG' THEN 12  -- Valid for 1 year
    WHEN dt.code = 'A1_BESCHEINIGUNG' THEN 24  -- Valid for 2 years typically
    WHEN dt.code = 'ARBEITSERLAUBNIS' THEN 12  -- Valid for 1 year typically
    WHEN dt.code = 'LOHNNACHWEIS' THEN 1  -- Valid for 1 month
    ELSE null  -- Permanent documents
  END as validity_months
FROM (VALUES ('einzelunternehmen'), ('gbr'), ('baubetrieb')) AS ct(company_type)
CROSS JOIN document_types dt
WHERE dt.required_by_default = true
ON CONFLICT DO NOTHING;