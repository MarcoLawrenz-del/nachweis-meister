-- Make tenant_id nullable in users table temporarily to fix setup
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;