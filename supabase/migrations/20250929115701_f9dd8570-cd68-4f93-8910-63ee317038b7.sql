-- Create project_subs for the newest subcontractor and generate requirements automatically
INSERT INTO project_subs (project_id, subcontractor_id, status, overall_status, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid as project_id,
  s.id as subcontractor_id,
  'active' as status,
  'pending' as overall_status,
  now() as created_at
FROM subcontractors s
WHERE s.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND s.id = '68cc7b2e-1051-4e1e-89c0-e77af37f9034'
  AND s.id NOT IN (
    SELECT ps.subcontractor_id 
    FROM project_subs ps 
    WHERE ps.project_id = '00000000-0000-0000-0000-000000000001'
  );

-- Generate requirements for this specific subcontractor
DO $$
DECLARE
  project_sub_uuid UUID;
  result JSONB;
BEGIN
  -- Get the project_sub_id for this subcontractor
  SELECT ps.id INTO project_sub_uuid
  FROM project_subs ps
  WHERE ps.subcontractor_id = '68cc7b2e-1051-4e1e-89c0-e77af37f9034'
    AND ps.project_id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1;
  
  -- Generate requirements for this subcontractor
  IF project_sub_uuid IS NOT NULL THEN
    SELECT public.compute_required_requirements('68cc7b2e-1051-4e1e-89c0-e77af37f9034'::uuid, project_sub_uuid) INTO result;
    RAISE NOTICE 'Generated requirements for new subcontractor: %', result;
  END IF;
END $$;