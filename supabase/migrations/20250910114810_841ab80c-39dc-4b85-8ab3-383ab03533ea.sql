-- Update requirements to set proper valid_to dates for existing valid documents
UPDATE requirements 
SET valid_to = (
  SELECT d.valid_to 
  FROM documents d 
  WHERE d.requirement_id = requirements.id 
  ORDER BY d.uploaded_at DESC 
  LIMIT 1
)
WHERE status = 'valid' 
AND valid_to IS NULL 
AND EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.requirement_id = requirements.id 
  AND d.valid_to IS NOT NULL
);

-- Add valid_to column to requirements table if it doesn't exist
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS valid_to DATE;

-- Create function to handle automatic status transitions based on dates
CREATE OR REPLACE FUNCTION update_requirement_status_by_date()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update valid to expired if past expiry date
  UPDATE requirements 
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'valid'
    AND valid_to IS NOT NULL
    AND valid_to < CURRENT_DATE;
    
  -- Update valid to expiring if within 30 days of expiry
  UPDATE requirements 
  SET status = 'expiring',
      updated_at = now()
  WHERE status = 'valid'
    AND valid_to IS NOT NULL
    AND valid_to <= CURRENT_DATE + INTERVAL '30 days'
    AND valid_to >= CURRENT_DATE;
END;
$$;

-- Create function to get only active subcontractors with required documents
CREATE OR REPLACE FUNCTION get_active_required_warnings(tenant_id_param uuid DEFAULT NULL)
RETURNS TABLE (
  requirement_id uuid,
  subcontractor_id uuid,
  project_sub_id uuid,
  document_type_id uuid,
  status text,
  due_date date,
  company_name text,
  document_name text,
  is_required boolean,
  subcontractor_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as requirement_id,
    s.id as subcontractor_id,
    ps.id as project_sub_id,
    dt.id as document_type_id,
    r.status,
    r.due_date,
    s.company_name,
    dt.name_de as document_name,
    dt.required_by_default as is_required,
    (s.status = 'active') as subcontractor_active
  FROM requirements r
  JOIN project_subs ps ON ps.id = r.project_sub_id
  JOIN subcontractors s ON s.id = ps.subcontractor_id
  JOIN document_types dt ON dt.id = r.document_type_id
  JOIN projects p ON p.id = ps.project_id
  WHERE 
    -- Only active subcontractors
    s.status = 'active'
    -- Only required documents
    AND dt.required_by_default = true
    -- Only problematic statuses
    AND r.status IN ('missing', 'expiring', 'expired', 'rejected')
    -- Only active project engagements
    AND ps.status = 'active'
    AND (ps.end_at IS NULL OR ps.end_at > CURRENT_DATE)
    -- Tenant filter if provided
    AND (tenant_id_param IS NULL OR p.tenant_id = tenant_id_param);
END;
$$;