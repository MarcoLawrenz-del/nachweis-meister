-- Create function to create/sync local user with Supabase
CREATE OR REPLACE FUNCTION public.sync_local_user(
  local_user_id text,
  user_email text,
  user_name text,
  tenant_name text DEFAULT 'Demo Tenant'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_tenant_id uuid;
  target_user_id uuid;
BEGIN
  -- Check if tenant exists, create if not
  SELECT id INTO target_tenant_id 
  FROM tenants 
  WHERE name = tenant_name;
  
  IF target_tenant_id IS NULL THEN
    INSERT INTO tenants (name, plan, subscription_status)
    VALUES (tenant_name, 'demo', 'active')
    RETURNING id INTO target_tenant_id;
  END IF;
  
  -- Check if user already exists
  SELECT id INTO target_user_id
  FROM users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    -- Create new user
    INSERT INTO users (id, email, name, tenant_id, role)
    VALUES (gen_random_uuid(), user_email, user_name, target_tenant_id, 'owner')
    RETURNING id INTO target_user_id;
  ELSE
    -- Update existing user
    UPDATE users 
    SET name = user_name, tenant_id = target_tenant_id
    WHERE id = target_user_id;
  END IF;
  
  RETURN target_user_id;
END;
$$;

-- Create function to simulate auth.uid() for demo purposes
CREATE OR REPLACE FUNCTION public.set_demo_user_id(user_id uuid) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Store the demo user ID in a session variable
  PERFORM set_config('demo.user_id', user_id::text, false);
END;
$$;

-- Create function to get demo user ID
CREATE OR REPLACE FUNCTION public.get_demo_user_id() 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the demo user ID from session variable, fallback to first user
  RETURN COALESCE(
    current_setting('demo.user_id', true)::uuid,
    (SELECT id FROM users LIMIT 1)
  );
END;
$$;

-- Update RLS policies to support demo mode
DROP POLICY IF EXISTS "Users can view their tenant subcontractors" ON subcontractors;
CREATE POLICY "Users can view their tenant subcontractors" 
ON subcontractors FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND (
      users.id = auth.uid() 
      OR users.id = public.get_demo_user_id()
    )
  )
);

DROP POLICY IF EXISTS "Users can update their tenant subcontractors" ON subcontractors;
CREATE POLICY "Users can update their tenant subcontractors" 
ON subcontractors FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND (
      users.id = auth.uid() 
      OR users.id = public.get_demo_user_id()
    )
  )
);

DROP POLICY IF EXISTS "Users can create subcontractors for their tenant" ON subcontractors;
CREATE POLICY "Users can create subcontractors for their tenant" 
ON subcontractors FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin', 'staff')
    AND (
      users.id = auth.uid() 
      OR users.id = public.get_demo_user_id()
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their tenant subcontractors" ON subcontractors;
CREATE POLICY "Users can delete their tenant subcontractors" 
ON subcontractors FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subcontractors.tenant_id 
    AND users.role IN ('owner', 'admin')
    AND (
      users.id = auth.uid() 
      OR users.id = public.get_demo_user_id()
    )
  )
);