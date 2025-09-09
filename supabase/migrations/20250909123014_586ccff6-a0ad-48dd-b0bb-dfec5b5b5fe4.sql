-- Create trigger function for automatic requirement computation
CREATE OR REPLACE FUNCTION public.trigger_compute_requirements()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for subcontractor changes
DROP TRIGGER IF EXISTS subcontractor_compute_requirements_trigger ON public.subcontractors;
CREATE TRIGGER subcontractor_compute_requirements_trigger
  AFTER INSERT OR UPDATE ON public.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_compute_requirements();

-- Create trigger function for project_sub activation
CREATE OR REPLACE FUNCTION public.trigger_project_sub_requirements()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for project_sub changes
DROP TRIGGER IF EXISTS project_sub_compute_requirements_trigger ON public.project_subs;
CREATE TRIGGER project_sub_compute_requirements_trigger
  AFTER INSERT OR UPDATE ON public.project_subs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_project_sub_requirements();

-- Update status tracking trigger to handle new enum
CREATE OR REPLACE FUNCTION public.track_review_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.review_history (
      requirement_id,
      reviewer_id,
      action,
      old_status,
      new_status
    ) VALUES (
      NEW.id,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'valid' THEN 'approved'
        WHEN NEW.status = 'rejected' AND OLD.status = 'in_review' THEN 'rejected'
        WHEN NEW.status = 'submitted' THEN 'submitted'
        ELSE 'updated'
      END,
      OLD.status::text,
      NEW.status::text
    );
  END IF;
  
  -- Track reviewer assignment
  IF OLD.assigned_reviewer_id IS DISTINCT FROM NEW.assigned_reviewer_id AND NEW.assigned_reviewer_id IS NOT NULL THEN
    INSERT INTO public.review_history (
      requirement_id,
      reviewer_id,
      action
    ) VALUES (
      NEW.id,
      NEW.assigned_reviewer_id,
      'assigned'
    );
  END IF;
  
  -- Track escalation
  IF OLD.escalated IS DISTINCT FROM NEW.escalated AND NEW.escalated = true THEN
    INSERT INTO public.review_history (
      requirement_id,
      reviewer_id,
      action,
      comment
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.assigned_reviewer_id),
      'escalated',
      NEW.escalation_reason
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the compliance calculation functions to handle new status enum  
CREATE OR REPLACE FUNCTION public.calculate_subcontractor_compliance_bausicht(subcontractor_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mandatory_count integer;
  valid_mandatory_count integer;
  expiring_soon_count integer;
  result_status text;
BEGIN
  -- Count mandatory document types
  SELECT COUNT(*) INTO mandatory_count
  FROM document_types 
  WHERE required_by_default = true;
  
  -- Count valid mandatory documents for this subcontractor
  SELECT COUNT(DISTINCT dt.id) INTO valid_mandatory_count
  FROM document_types dt
  JOIN requirements r ON r.document_type_id = dt.id
  JOIN project_subs ps ON ps.id = r.project_sub_id
  WHERE ps.subcontractor_id = subcontractor_id_param
    AND dt.required_by_default = true
    AND r.status = 'valid';
  
  -- Count documents expiring within 30 days
  SELECT COUNT(DISTINCT dt.id) INTO expiring_soon_count
  FROM document_types dt
  JOIN requirements r ON r.document_type_id = dt.id
  JOIN project_subs ps ON ps.id = r.project_sub_id
  WHERE ps.subcontractor_id = subcontractor_id_param
    AND dt.required_by_default = true
    AND r.status IN ('valid', 'expiring');
  
  -- Determine status based on Bausicht requirements
  IF valid_mandatory_count >= mandatory_count THEN
    IF expiring_soon_count > valid_mandatory_count THEN
      result_status := 'expiring_soon';
    ELSE
      result_status := 'compliant';
    END IF;
  ELSE
    result_status := 'non_compliant';
  END IF;
  
  -- Update subcontractor record with automatic activation
  UPDATE subcontractors 
  SET 
    compliance_status = result_status,
    last_compliance_check = now(),
    status = CASE 
      WHEN result_status = 'compliant' THEN 'active'
      ELSE status -- Don't auto-deactivate, keep current status
    END,
    activation_date = CASE 
      WHEN result_status = 'compliant' AND status = 'inactive' THEN now()
      ELSE activation_date
    END
  WHERE id = subcontractor_id_param;
  
  RETURN result_status;
END;
$$;