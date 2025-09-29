-- Fix RLS policy for subcontractors table to allow anonymous inserts for demo mode

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can create subcontractors for their tenant" ON public.subcontractors;

-- Create new policy that allows both authenticated users and anonymous demo mode
CREATE POLICY "Users can create subcontractors for their tenant" 
ON public.subcontractors 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous inserts for demo tenant
  (auth.uid() IS NULL AND tenant_id = '00000000-0000-0000-0000-000000000001'::uuid) 
  OR 
  -- Allow authenticated users for their tenant
  (EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff') 
    AND users.id = auth.uid()
  ))
);