-- Temporarily remove foreign key constraint to allow setup
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;

-- Make tenant_id nullable if not already
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;