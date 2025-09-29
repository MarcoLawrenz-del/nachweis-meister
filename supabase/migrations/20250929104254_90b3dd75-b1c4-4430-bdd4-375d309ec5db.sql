-- Update subcontractors RLS policy to allow demo user access
DROP POLICY IF EXISTS "Users can create subcontractors for their tenant" ON subcontractors;

CREATE POLICY "Users can create subcontractors for their tenant"
ON subcontractors 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'demo@subfix.de')
    )
  )
);

-- Also update the other policies to allow demo mode
DROP POLICY IF EXISTS "Users can view their tenant subcontractors" ON subcontractors;

CREATE POLICY "Users can view their tenant subcontractors"
ON subcontractors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'demo@subfix.de')
    )
  )
);

DROP POLICY IF EXISTS "Users can update their tenant subcontractors" ON subcontractors;

CREATE POLICY "Users can update their tenant subcontractors"
ON subcontractors 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'demo@subfix.de')
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their tenant subcontractors" ON subcontractors;

CREATE POLICY "Users can delete their tenant subcontractors"
ON subcontractors 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin')
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'demo@subfix.de')
    )
  )
);