-- Fix RLS policies for demo mode by updating the subcontractors policies
-- Remove the problematic demo user session variable approach and use a simpler fallback

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their tenant subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can create subcontractors for their tenant" ON subcontractors;
DROP POLICY IF EXISTS "Users can update their tenant subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can delete their tenant subcontractors" ON subcontractors;

-- Create new policies with proper demo mode support
CREATE POLICY "Users can view their tenant subcontractors" 
ON subcontractors FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'mlawrenz@warm0.de') -- Demo fallback
    )
  )
);

CREATE POLICY "Users can create subcontractors for their tenant" 
ON subcontractors FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'mlawrenz@warm0.de') -- Demo fallback
    )
  )
);

CREATE POLICY "Users can update their tenant subcontractors" 
ON subcontractors FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'mlawrenz@warm0.de') -- Demo fallback
    )
  )
);

CREATE POLICY "Users can delete their tenant subcontractors" 
ON subcontractors FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin')
    AND (
      users.id = auth.uid() 
      OR (auth.uid() IS NULL AND users.email = 'mlawrenz@warm0.de') -- Demo fallback
    )
  )
);

-- Drop the session-based functions as they don't work reliably
DROP FUNCTION IF EXISTS set_demo_user_id(uuid);
DROP FUNCTION IF EXISTS get_demo_user_id();