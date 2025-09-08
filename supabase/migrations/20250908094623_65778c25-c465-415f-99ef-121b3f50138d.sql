-- Drop existing policy and recreate with correct syntax
DROP POLICY IF EXISTS "Enable tenant creation for authenticated users" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON public.tenants;

-- Create a working policy for tenant creation
CREATE POLICY "Allow authenticated users to create tenants" 
ON public.tenants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Ensure the users table also has the right policy
DROP POLICY IF EXISTS "Enable profile creation for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON public.users;

CREATE POLICY "Allow authenticated users to manage their profile" 
ON public.users 
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);