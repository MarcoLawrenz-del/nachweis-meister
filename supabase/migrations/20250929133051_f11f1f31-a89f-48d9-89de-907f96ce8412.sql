-- ============= Fix Security Issues =============
-- Enable RLS on all tables and fix search_path issues

-- Enable RLS on tables that might be missing it
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_requirements ENABLE ROW LEVEL SECURITY;

-- Fix search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;