-- Remove overly permissive public access policy on invitations table
-- This policy exposes email addresses and sensitive data to unauthorized users
-- The get-invitation-data edge function handles legitimate token-based access using service role key

DROP POLICY IF EXISTS "Public access via token for document upload" ON public.invitations;

-- Add a comment to document why public access was removed
COMMENT ON TABLE public.invitations IS 'Access to invitations is restricted to authenticated users within tenants. Public access for document uploads is handled securely via the get-invitation-data edge function using service role credentials.';