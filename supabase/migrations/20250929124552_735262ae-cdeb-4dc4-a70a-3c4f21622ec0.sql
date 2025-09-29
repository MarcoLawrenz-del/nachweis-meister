-- Fix subcontractors update policy for status toggle
-- Allow demo access for subcontractor updates

DROP POLICY IF EXISTS "Users can update their tenant subcontractors" ON subcontractors;
CREATE POLICY "Users can update their tenant subcontractors" ON subcontractors
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text]) 
    AND users.id = auth.uid()
  )
  OR 
  -- Allow demo access for demo tenant
  tenant_id = '00000000-0000-0000-0000-000000000001'
  OR
  auth.uid() IS NULL  -- Allow unauthenticated access for demo
);