-- Completely drop and recreate the tenant creation policy
DROP POLICY IF EXISTS "Allow tenant creation for authenticated users" ON tenants;

-- Create a proper policy that allows ANY authenticated user to create tenants
CREATE POLICY "Enable tenant creation for authenticated users" 
ON tenants 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Also make sure users table allows profile creation
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON users;

CREATE POLICY "Enable profile creation for authenticated users" 
ON users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);