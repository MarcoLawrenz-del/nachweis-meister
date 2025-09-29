-- Temporär Demo-Mode für RLS-Policies aktivieren
-- Allow unauthenticated access for demo tenant

-- Update project_subs policies to allow demo access
DROP POLICY IF EXISTS "Users can view project_subs for their tenant" ON project_subs;
CREATE POLICY "Users can view project_subs for their tenant" ON project_subs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE p.id = project_subs.project_id 
    AND u.id = auth.uid()
  )
  OR 
  -- Allow demo access for demo project
  project_id = '00000000-0000-0000-0000-000000000001'
);

-- Update requirements policies to allow demo access
DROP POLICY IF EXISTS "Users can view requirements for their tenant" ON requirements;
CREATE POLICY "Users can view requirements for their tenant" ON requirements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_subs ps
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE ps.id = requirements.project_sub_id 
    AND u.id = auth.uid()
  )
  OR
  -- Allow demo access for demo project
  EXISTS (
    SELECT 1 FROM project_subs ps
    WHERE ps.id = requirements.project_sub_id
    AND ps.project_id = '00000000-0000-0000-0000-000000000001'
  )
);

-- Update documents policies to allow demo access  
DROP POLICY IF EXISTS "Users can view documents for their tenant" ON documents;
CREATE POLICY "Users can view documents for their tenant" ON documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE r.id = documents.requirement_id 
    AND u.id = auth.uid()
  )
  OR
  -- Allow demo access for demo project
  EXISTS (
    SELECT 1 FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    WHERE r.id = documents.requirement_id
    AND ps.project_id = '00000000-0000-0000-0000-000000000001'
  )
);