-- Fix security warnings: Set search_path for functions

-- Fix trigger functions to set search_path
CREATE OR REPLACE FUNCTION public.trigger_compute_requirements()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trigger requirement computation when subcontractor flags or status change
  IF (TG_OP = 'UPDATE' AND (
    OLD.requires_employees IS DISTINCT FROM NEW.requires_employees OR
    OLD.has_non_eu_workers IS DISTINCT FROM NEW.has_non_eu_workers OR
    OLD.employees_not_employed_in_germany IS DISTINCT FROM NEW.employees_not_employed_in_germany OR
    OLD.status IS DISTINCT FROM NEW.status
  )) OR TG_OP = 'INSERT' THEN
    
    -- Use pg_notify to trigger async processing
    PERFORM pg_notify('compute_requirements', NEW.id::text);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix project_sub trigger function
CREATE OR REPLACE FUNCTION public.trigger_project_sub_requirements()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trigger when project_sub becomes active
  IF (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active') OR
     (TG_OP = 'INSERT' AND NEW.status = 'active') THEN
    
    -- Use pg_notify to trigger async processing with project_sub context
    PERFORM pg_notify('compute_requirements', json_build_object(
      'subcontractor_id', NEW.subcontractor_id,
      'project_sub_id', NEW.id
    )::text);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;