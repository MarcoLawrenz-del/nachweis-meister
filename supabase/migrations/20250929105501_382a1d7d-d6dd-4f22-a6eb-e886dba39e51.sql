-- Simplify approach: Allow demo mode to work without specific user
-- Update subcontractors RLS policies to allow unauthenticated demo operations

DROP POLICY IF EXISTS "Users can create subcontractors for their tenant" ON subcontractors;

CREATE POLICY "Users can create subcontractors for their tenant"
ON subcontractors 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and has proper role
  (EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND users.id = auth.uid()
  ))
  OR
  -- Allow demo mode (when not authenticated)
  (auth.uid() IS NULL)
);

DROP POLICY IF EXISTS "Users can view their tenant subcontractors" ON subcontractors;

CREATE POLICY "Users can view their tenant subcontractors"
ON subcontractors 
FOR SELECT 
USING (
  -- Allow if user is authenticated and belongs to tenant
  (EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.id = auth.uid()
  ))
  OR
  -- Allow demo mode (when not authenticated)
  (auth.uid() IS NULL)
);

DROP POLICY IF EXISTS "Users can update their tenant subcontractors" ON subcontractors;

CREATE POLICY "Users can update their tenant subcontractors"
ON subcontractors 
FOR UPDATE 
USING (
  -- Allow if user is authenticated and has proper role
  (EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND users.id = auth.uid()
  ))
  OR
  -- Allow demo mode (when not authenticated)
  (auth.uid() IS NULL)
);

DROP POLICY IF EXISTS "Users can delete their tenant subcontractors" ON subcontractors;

CREATE POLICY "Users can delete their tenant subcontractors"
ON subcontractors 
FOR DELETE 
USING (
  -- Allow if user is authenticated and has proper role
  (EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin')
    AND users.id = auth.uid()
  ))
  OR
  -- Allow demo mode (when not authenticated)
  (auth.uid() IS NULL)
);