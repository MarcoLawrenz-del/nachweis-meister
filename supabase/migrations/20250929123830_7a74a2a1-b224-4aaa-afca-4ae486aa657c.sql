-- Fix missing project_subs and requirements for subcontractor 3caadcee-1698-4b6f-a410-cb88ba10e300
DO $$
DECLARE
  project_sub_uuid uuid;
  demo_project_id uuid := '00000000-0000-0000-0000-000000000001';
  target_subcontractor_id uuid := '3caadcee-1698-4b6f-a410-cb88ba10e300';
BEGIN
  -- Check if project_sub already exists
  SELECT id INTO project_sub_uuid 
  FROM project_subs 
  WHERE subcontractor_id = target_subcontractor_id 
    AND project_id = demo_project_id;
  
  -- If not exists, create it
  IF project_sub_uuid IS NULL THEN
    INSERT INTO project_subs (
      project_id, 
      subcontractor_id, 
      status,
      overall_status,
      created_at
    ) VALUES (
      demo_project_id,
      target_subcontractor_id,
      'active',
      'pending', 
      now()
    ) RETURNING id INTO project_sub_uuid;
    
    RAISE NOTICE 'Created project_sub % for subcontractor %', project_sub_uuid, target_subcontractor_id;
  ELSE
    RAISE NOTICE 'Project_sub already exists: %', project_sub_uuid;
  END IF;
  
  -- Generate requirements using the compute function
  PERFORM public.compute_required_requirements(target_subcontractor_id, project_sub_uuid);
  
  RAISE NOTICE 'Generated requirements for subcontractor %', target_subcontractor_id;
END $$;