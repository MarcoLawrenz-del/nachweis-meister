-- Fix RLS policies for demo mode subcontractor creation
-- The issue is that the current policy checks for user existence in tenant, but in demo mode there's no authenticated user

-- Drop and recreate the INSERT policy for subcontractors with proper demo mode support
DROP POLICY IF EXISTS "Users can create subcontractors for their tenant" ON subcontractors;

CREATE POLICY "Users can create subcontractors for their tenant"
ON subcontractors 
FOR INSERT 
WITH CHECK (
  -- Allow demo mode (when not authenticated) for specific demo tenant
  (auth.uid() IS NULL AND tenant_id = '00000000-0000-0000-0000-000000000001')
  OR
  -- Allow if user is authenticated and has proper role for their tenant
  (EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND users.id = auth.uid()
  ))
);