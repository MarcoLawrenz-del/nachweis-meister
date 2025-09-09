-- Fix search_path security issue for magic link domain check function
CREATE OR REPLACE FUNCTION public.is_domain_allowed_for_magic_link(
  email_param TEXT,
  tenant_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    SELECT 1 FROM tenant_domain_allowlists 
    WHERE tenant_id = tenant_id_param
  ) INTO allowlist_exists;
  
  -- If no allowlist exists, allow all domains
  IF NOT allowlist_exists THEN
    RETURN TRUE;
  END IF;
  
  -- Check if domain is in allowlist
  RETURN EXISTS (
    SELECT 1 FROM tenant_domain_allowlists 
    WHERE tenant_id = tenant_id_param 
    AND domain = email_domain
  );
END;
$$;