-- Fix the tenant creation policy to properly allow authenticated users to create tenants
DROP POLICY IF EXISTS "Enable tenant creation for authenticated users" ON public.tenants;

-- Create a new policy that properly checks for authenticated users
CREATE POLICY "Authenticated users can create tenants" 
ON public.tenants 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure users can create their own profile
DROP POLICY IF EXISTS "Enable profile creation for authenticated users" ON public.users;

CREATE POLICY "Authenticated users can create their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);