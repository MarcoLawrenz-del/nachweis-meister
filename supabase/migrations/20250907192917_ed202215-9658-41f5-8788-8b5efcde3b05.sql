-- Update existing tenant creation policy to be more permissive
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create tenants during signup" ON tenants;

-- Create a working policy for tenant creation
CREATE POLICY "Allow tenant creation for authenticated users" 
ON tenants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Ensure users can create their own profiles
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

CREATE POLICY "Allow profile creation for authenticated users" 
ON users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);