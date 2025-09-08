-- Clean up all conflicting policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users; 
DROP POLICY IF EXISTS "Allow authenticated users to manage their profile" ON public.users;
DROP POLICY IF EXISTS "Enable profile creation for authenticated users" ON public.users;

-- Create one clean policy for users
CREATE POLICY "Users can manage their own data" 
ON public.users 
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also ensure tenants policy is correct
DROP POLICY IF EXISTS "Allow authenticated users to create tenants" ON public.tenants;

CREATE POLICY "Authenticated users can create tenants" 
ON public.tenants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add a simple SELECT policy for tenants
CREATE POLICY "Users can view their tenant" 
ON public.tenants 
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.tenant_id = tenants.id 
  AND users.id = auth.uid()
));