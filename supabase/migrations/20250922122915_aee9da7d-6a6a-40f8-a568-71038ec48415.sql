-- Create magic_links table for secure token management
CREATE TABLE public.magic_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  contractor_id TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Create policies for magic_links
CREATE POLICY "Admin users can create magic links" 
ON public.magic_links 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('owner', 'admin', 'staff')
));

CREATE POLICY "Admin users can view magic links for their tenant" 
ON public.magic_links 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('owner', 'admin', 'staff')
));

CREATE POLICY "Admin users can update magic links for their tenant" 
ON public.magic_links 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('owner', 'admin', 'staff')
));

-- Create index for fast token lookups
CREATE INDEX idx_magic_links_token ON public.magic_links(token);
CREATE INDEX idx_magic_links_expires_at ON public.magic_links(expires_at);

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_magic_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.magic_links 
  WHERE expires_at < now();
END;
$$;