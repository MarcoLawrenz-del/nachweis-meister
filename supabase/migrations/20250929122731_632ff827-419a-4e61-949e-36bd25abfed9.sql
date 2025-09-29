-- Fix missing project_subs and requirements for subcontractor c700faff-cae6-4936-a685-b9b5dfabe5a8

-- Create project_sub for this specific subcontractor
INSERT INTO project_subs (project_id, subcontractor_id, status, overall_status, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid as project_id,
  'c700faff-cae6-4936-a685-b9b5dfabe5a8'::uuid as subcontractor_id,
  'active' as status,
  'pending' as overall_status,
  now() as created_at
WHERE NOT EXISTS (
  SELECT 1 FROM project_subs 
  WHERE subcontractor_id = 'c700faff-cae6-4936-a685-b9b5dfabe5a8'
    AND project_id = '00000000-0000-0000-0000-000000000001'
);

-- Generate requirements for this subcontractor
DO $$
DECLARE
  project_sub_uuid UUID;
  result JSONB;
BEGIN
  -- Get the project_sub_id for this subcontractor
  SELECT ps.id INTO project_sub_uuid
  FROM project_subs ps
  WHERE ps.subcontractor_id = 'c700faff-cae6-4936-a685-b9b5dfabe5a8'
    AND ps.project_id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1;
  
  -- Generate requirements
  IF project_sub_uuid IS NOT NULL THEN
    SELECT public.compute_required_requirements('c700faff-cae6-4936-a685-b9b5dfabe5a8'::uuid, project_sub_uuid) INTO result;
    RAISE NOTICE 'Generated requirements for subcontractor c700faff-cae6-4936-a685-b9b5dfabe5a8: %', result;
  ELSE
    RAISE NOTICE 'No project_sub found for subcontractor c700faff-cae6-4936-a685-b9b5dfabe5a8';
  END IF;
END $$;