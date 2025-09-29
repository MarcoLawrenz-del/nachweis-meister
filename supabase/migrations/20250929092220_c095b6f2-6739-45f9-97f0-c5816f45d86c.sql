-- Add missing revoked column to magic_links table
ALTER TABLE magic_links ADD COLUMN IF NOT EXISTS revoked boolean NOT NULL DEFAULT false;

-- Add index for better performance on revoked status
CREATE INDEX IF NOT EXISTS idx_magic_links_revoked ON magic_links(revoked);

-- Update existing edge function compatibility
COMMENT ON COLUMN magic_links.revoked IS 'Indicates if the magic link has been revoked and should no longer be usable';