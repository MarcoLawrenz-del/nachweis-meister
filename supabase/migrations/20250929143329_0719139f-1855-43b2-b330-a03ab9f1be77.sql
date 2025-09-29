-- Fix the tenants plan constraint and create demo data
-- First, let's check what plan values are allowed and fix the demo tenant

-- Create default demo tenant with correct plan value
INSERT INTO public.tenants (id, name, plan, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Tenant', 'free', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create a demo project for the demo tenant
INSERT INTO public.projects (id, name, code, address, tenant_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Projekt', 'DEMO-001', 'Demo Adresse 1, 12345 Demo Stadt', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Manually create profiles for any existing auth users who don't have profiles
INSERT INTO public.profiles (id, email, full_name, tenant_id, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  '00000000-0000-0000-0000-000000000001',
  'owner'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also create user records for team management
INSERT INTO public.users (id, name, email, tenant_id, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.email,
  '00000000-0000-0000-0000-000000000001',
  'owner'
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;