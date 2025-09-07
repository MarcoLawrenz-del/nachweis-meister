-- Fix RLS policy for tenant creation by authenticated users
DROP POLICY IF EXISTS "Users can create tenants during signup" ON tenants;

-- Create a more permissive policy for authenticated users to create tenants
CREATE POLICY "Authenticated users can create tenants" 
ON tenants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also allow authenticated users to insert into users table if not already allowed
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Create a policy that allows any authenticated user to create their profile
CREATE POLICY "Authenticated users can create profiles" 
ON users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);