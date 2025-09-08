-- Create invitations table for document upload invites
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_sub_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'expired')),
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Users can create invitations for their tenant" 
ON public.invitations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM project_subs ps
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE ps.id = invitations.project_sub_id 
      AND u.id = auth.uid() 
      AND u.role IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Users can view invitations for their tenant" 
ON public.invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM project_subs ps
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE ps.id = invitations.project_sub_id 
      AND u.id = auth.uid()
  )
);

CREATE POLICY "Public access via token for document upload" 
ON public.invitations 
FOR SELECT 
USING (status = 'sent' AND expires_at > now());

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();