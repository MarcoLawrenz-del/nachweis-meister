-- Automatically create project_subs and requirements for ALL new subcontractors
-- This will catch any subcontractors created since our last migration

-- Create project_subs for any subcontractors without them
INSERT INTO project_subs (project_id, subcontractor_id, status, overall_status, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid as project_id,
  s.id as subcontractor_id,
  'active' as status,
  'pending' as overall_status,
  now() as created_at
FROM subcontractors s
WHERE s.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND s.id NOT IN (
    SELECT ps.subcontractor_id 
    FROM project_subs ps 
    WHERE ps.project_id = '00000000-0000-0000-0000-000000000001'
  );

-- Generate requirements for ALL subcontractors without requirements
DO $$
DECLARE
  sub_record RECORD;
  project_sub_uuid UUID;
  result JSONB;
BEGIN
  FOR sub_record IN
    SELECT s.id, s.company_name
    FROM subcontractors s
    WHERE s.tenant_id = '00000000-0000-0000-0000-000000000001'
      AND NOT EXISTS (
        SELECT 1 FROM requirements r
        JOIN project_subs ps ON ps.id = r.project_sub_id
        WHERE ps.subcontractor_id = s.id
      )
  LOOP
    -- Get the project_sub_id for this subcontractor
    SELECT ps.id INTO project_sub_uuid
    FROM project_subs ps
    WHERE ps.subcontractor_id = sub_record.id
      AND ps.project_id = '00000000-0000-0000-0000-000000000001'
    LIMIT 1;
    
    -- Generate requirements for this subcontractor
    IF project_sub_uuid IS NOT NULL THEN
      SELECT public.compute_required_requirements(sub_record.id, project_sub_uuid) INTO result;
      RAISE NOTICE 'Generated requirements for subcontractor % (%): %', sub_record.company_name, sub_record.id, result;
    END IF;
  END LOOP;
END $$;