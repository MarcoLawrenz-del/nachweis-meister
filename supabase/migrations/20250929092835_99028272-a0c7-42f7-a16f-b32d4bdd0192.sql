-- Fix magic_links table email constraint
ALTER TABLE magic_links ALTER COLUMN email DROP NOT NULL;

-- Ensure the table structure supports all magic link scenarios
COMMENT ON COLUMN magic_links.email IS 'Email can be null for contractor-specific magic links';