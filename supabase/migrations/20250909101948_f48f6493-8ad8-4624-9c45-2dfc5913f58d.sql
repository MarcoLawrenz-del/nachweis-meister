-- Create table for tenant domain allowlists (optional feature)
CREATE TABLE public.tenant_domain_allowlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, domain)
);

-- Enable RLS
ALTER TABLE public.tenant_domain_allowlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage domain allowlists for their tenant"
ON public.tenant_domain_allowlists 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.tenant_id = tenant_domain_allowlists.tenant_id 
    AND users.id = auth.uid()
    AND users.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.tenant_id = tenant_domain_allowlists.tenant_id 
    AND users.id = auth.uid()
    AND users.role IN ('owner', 'admin')
  )
);

-- Create function to check if email domain is allowed for magic link
CREATE OR REPLACE FUNCTION public.is_domain_allowed_for_magic_link(
  email_param TEXT,
  tenant_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_domain TEXT;
  allowlist_exists BOOLEAN;
BEGIN
  -- Extract domain from email
  email_domain := split_part(email_param, '@', 2);
  
  -- If no tenant specified, allow all domains (global magic links)
  IF tenant_id_param IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if tenant has any domain allowlist entries
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_domain_allowlists 
    WHERE tenant_id = tenant_id_param
  ) INTO allowlist_exists;
  
  -- If no allowlist exists, allow all domains
  IF NOT allowlist_exists THEN
    RETURN TRUE;
  END IF;
  
  -- Check if domain is in allowlist
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_domain_allowlists 
    WHERE tenant_id = tenant_id_param 
    AND domain = email_domain
  );
END;
$$;