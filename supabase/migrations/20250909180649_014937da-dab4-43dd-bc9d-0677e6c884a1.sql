-- Update invitations table to support team invitations
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS role text;

-- Add constraint to ensure role is valid for team invitations
ALTER TABLE invitations 
ADD CONSTRAINT valid_team_role 
CHECK (
  invitation_type != 'team' OR role IN ('admin', 'staff')
);

-- Create index on invitation_type and status for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_type_status 
ON invitations(invitation_type, status);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at 
ON invitations(expires_at);

-- Update RLS policies for team invitations
DROP POLICY IF EXISTS "Users can create team invitations for their tenant" ON invitations;

CREATE POLICY "Users can create team invitations for their tenant"
ON invitations FOR INSERT
WITH CHECK (
  invitation_type = 'team' AND
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('owner', 'admin')
    AND u.tenant_id = (
      SELECT tenant_id FROM users 
      WHERE id = invitations.invited_by
    )
  )
);

DROP POLICY IF EXISTS "Users can view team invitations for their tenant" ON invitations;

CREATE POLICY "Users can view team invitations for their tenant"
ON invitations FOR SELECT
USING (
  invitation_type = 'team' AND
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('owner', 'admin')
    AND u.tenant_id = (
      SELECT tenant_id FROM users 
      WHERE id = invitations.invited_by
    )
  )
);

DROP POLICY IF EXISTS "Users can update team invitations for their tenant" ON invitations;

CREATE POLICY "Users can update team invitations for their tenant"
ON invitations FOR UPDATE
USING (
  invitation_type = 'team' AND
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('owner', 'admin')
    AND u.tenant_id = (
      SELECT tenant_id FROM users 
      WHERE id = invitations.invited_by
    )
  )
);