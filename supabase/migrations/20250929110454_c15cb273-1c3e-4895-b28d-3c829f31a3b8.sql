-- Create demo tenant for development and testing with correct plan
INSERT INTO tenants (id, name, plan, subscription_status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Tenant', 'free', 'active')
ON CONFLICT (id) DO NOTHING;