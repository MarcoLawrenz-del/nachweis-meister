-- Fix search path security issue for the function we just created
DROP FUNCTION IF EXISTS update_updated_at_subscribers();

CREATE OR REPLACE FUNCTION public.update_updated_at_subscribers()
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