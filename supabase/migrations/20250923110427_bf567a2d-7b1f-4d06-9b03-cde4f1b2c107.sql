-- Check if we need to synchronize localStorage with Supabase subcontractors table
-- First, let's see the current structure and add proper status handling

-- Ensure the subcontractors table has the correct status values
ALTER TABLE public.subcontractors 
ALTER COLUMN status SET DEFAULT 'inactive';

-- Add a constraint to ensure only valid status values
ALTER TABLE public.subcontractors 
ADD CONSTRAINT subcontractors_status_check 
CHECK (status IN ('active', 'inactive'));

-- Make sure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_subcontractors_status 
ON public.subcontractors(status);

CREATE INDEX IF NOT EXISTS idx_subcontractors_tenant_status 
ON public.subcontractors(tenant_id, status);