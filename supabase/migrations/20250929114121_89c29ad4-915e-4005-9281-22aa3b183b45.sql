-- Create default demo project if it doesn't exist
INSERT INTO projects (id, tenant_id, name, code) 
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Demo Projekt', 'DEMO')
ON CONFLICT (id) DO NOTHING;

-- Create project_subs for existing subcontractors in demo tenant
INSERT INTO project_subs (project_id, subcontractor_id, status)
SELECT 
  '00000000-0000-0000-0000-000000000001' as project_id,
  id as subcontractor_id,
  'active' as status
FROM subcontractors 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (project_id, subcontractor_id) DO NOTHING;

-- Create initial requirements for all demo subcontractors using the compute_required_requirements function
DO $$
DECLARE
    sub_record RECORD;
    project_sub_record RECORD;
BEGIN
    -- Loop through all demo subcontractors
    FOR sub_record IN 
        SELECT id FROM subcontractors WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    LOOP
        -- Get their project_sub ID
        SELECT id INTO project_sub_record
        FROM project_subs 
        WHERE subcontractor_id = sub_record.id;
        
        -- Create requirements using the existing function
        IF project_sub_record.id IS NOT NULL THEN
            PERFORM compute_required_requirements(sub_record.id, project_sub_record.id);
        END IF;
    END LOOP;
END $$;