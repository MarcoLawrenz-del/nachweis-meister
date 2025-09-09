-- Erweitere document_types Tabelle
ALTER TABLE document_types 
ADD COLUMN IF NOT EXISTS required_by_default boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Aktualisiere existing document_types mit sort_order
UPDATE document_types SET sort_order = 
  CASE code 
    WHEN 'FREISTELLUNG_48B' THEN 1
    WHEN 'GEWERBESCHEIN' THEN 2
    WHEN 'IHK_HWK_NACHWEIS' THEN 3
    WHEN 'BETRIEBSHAFTPFLICHT' THEN 4
    WHEN 'MITARBEITERLISTE' THEN 5
    WHEN 'AUSWEISABGLEICH' THEN 6
    WHEN 'UNBEDENKLICHKEIT_SOZIALVERS' THEN 7
    WHEN 'BG_MITGLIEDSCHAFT' THEN 8
    WHEN 'SOKA_NACHWEIS' THEN 9
    WHEN 'MINDESTLOHN_ERKLAERUNG' THEN 10
    WHEN 'A1_BESCHEINIGUNG' THEN 11
    WHEN 'GZD_MELDUNG' THEN 12
    WHEN 'AUFENTHALTSERLAUBNIS' THEN 13
    ELSE 99
  END;

-- Neue requirement_rules Tabelle
CREATE TABLE IF NOT EXISTS requirement_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_type text NOT NULL CHECK (company_type IN ('gmbh', 'ug', 'gbr', 'einzelunternehmen', 'baubetrieb', 'dienstleister')),
  requires_employees boolean NULL,
  has_non_eu_workers boolean NULL,  
  employees_not_employed_in_germany boolean NULL,
  document_type_id uuid NOT NULL REFERENCES document_types(id),
  validity_months integer NULL,
  frequency text NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'monthly', 'annual')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_type, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, document_type_id)
);

-- Neue email_logs Tabelle für Reminder-History
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  subcontractor_id uuid NOT NULL REFERENCES subcontractors(id),
  project_sub_id uuid NULL REFERENCES project_subs(id),
  requirement_id uuid NULL REFERENCES requirements(id),
  template_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'bounced', 'failed')),
  sent_at timestamptz NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  preview_snippet text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Neue reminder_jobs Tabelle
CREATE TABLE IF NOT EXISTS reminder_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES requirements(id),
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'paused', 'stopped', 'done')),
  next_run_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Requirements Status auf Enum einschränken
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_status_check;
ALTER TABLE requirements ADD CONSTRAINT requirements_status_check 
  CHECK (status IN ('missing', 'in_review', 'valid', 'expiring', 'expired'));

-- Erweitere subcontractors um neue Flags
ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS requires_employees boolean NULL,
ADD COLUMN IF NOT EXISTS has_non_eu_workers boolean NULL,
ADD COLUMN IF NOT EXISTS employees_not_employed_in_germany boolean NULL;

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_requirement_rules_company_type ON requirement_rules(company_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_subcontractor ON email_logs(tenant_id, subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_next_run ON reminder_jobs(next_run_at) WHERE state = 'active';
CREATE INDEX IF NOT EXISTS idx_requirements_status_due_date ON requirements(status, due_date);

-- RLS Policies für neue Tabellen
ALTER TABLE requirement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE reminder_jobs ENABLE ROW LEVEL SECURITY;

-- requirement_rules Policies (öffentlich lesbar für alle)
CREATE POLICY "Everyone can view requirement rules" 
ON requirement_rules FOR SELECT 
USING (true);

-- email_logs Policies
CREATE POLICY "Users can view email logs for their tenant" 
ON email_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.tenant_id = email_logs.tenant_id 
  AND users.id = auth.uid()
));

CREATE POLICY "Users can create email logs for their tenant" 
ON email_logs FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE users.tenant_id = email_logs.tenant_id 
  AND users.id = auth.uid() 
  AND users.role = ANY(ARRAY['owner', 'admin', 'staff'])
));

-- reminder_jobs Policies  
CREATE POLICY "Users can view reminder jobs for their tenant" 
ON reminder_jobs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM requirements r
  JOIN project_subs ps ON ps.id = r.project_sub_id
  JOIN projects p ON p.id = ps.project_id
  JOIN users u ON u.tenant_id = p.tenant_id
  WHERE r.id = reminder_jobs.requirement_id 
  AND u.id = auth.uid()
));

CREATE POLICY "Users can manage reminder jobs for their tenant" 
ON reminder_jobs FOR ALL
USING (EXISTS (
  SELECT 1 FROM requirements r
  JOIN project_subs ps ON ps.id = r.project_sub_id
  JOIN projects p ON p.id = ps.project_id
  JOIN users u ON u.tenant_id = p.tenant_id
  WHERE r.id = reminder_jobs.requirement_id 
  AND u.id = auth.uid()
  AND u.role = ANY(ARRAY['owner', 'admin', 'staff'])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM requirements r
  JOIN project_subs ps ON ps.id = r.project_sub_id
  JOIN projects p ON p.id = ps.project_id
  JOIN users u ON u.tenant_id = p.tenant_id
  WHERE r.id = reminder_jobs.requirement_id 
  AND u.id = auth.uid()
  AND u.role = ANY(ARRAY['owner', 'admin', 'staff'])
));

-- Trigger für reminder_jobs updated_at
CREATE OR REPLACE FUNCTION update_reminder_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reminder_jobs_updated_at
  BEFORE UPDATE ON reminder_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_jobs_updated_at();