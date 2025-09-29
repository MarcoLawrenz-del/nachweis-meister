-- Fix DocumentUpload RLS policies for document creation and update
-- Allow demo access for documents on demo project

-- Update documents policies for create/update
DROP POLICY IF EXISTS "Users can create documents for their tenant" ON documents;
CREATE POLICY "Users can create documents for their tenant" ON documents
FOR INSERT WITH CHECK (
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

-- Update requirements policies for update 
DROP POLICY IF EXISTS "Users can update requirements for their tenant" ON requirements;
CREATE POLICY "Users can update requirements for their tenant" ON requirements
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_subs ps
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE ps.id = requirements.project_sub_id 
    AND u.id = auth.uid() 
    AND u.role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])
  )
  OR
  -- Allow demo access for demo project
  EXISTS (
    SELECT 1 FROM project_subs ps
    WHERE ps.id = requirements.project_sub_id
    AND ps.project_id = '00000000-0000-0000-0000-000000000001'
  )
);