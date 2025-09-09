-- Remove Bausicht-specific function references and use generic compliance function
-- This migration replaces Bausicht-specific compliance calculation with generic one

-- Update trigger function to use generic compliance calculation
CREATE OR REPLACE FUNCTION public.trigger_compliance_recalculation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_id uuid;
BEGIN
  -- Get subcontractor ID from the requirement
  SELECT ps.subcontractor_id INTO sub_id
  FROM project_subs ps
  WHERE ps.id = COALESCE(NEW.project_sub_id, OLD.project_sub_id);
  
  -- Recalculate compliance status using generic logic
  IF sub_id IS NOT NULL THEN
    PERFORM public.calculate_subcontractor_compliance(sub_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Ensure the generic compliance calculation function exists and works properly
-- This function calculates compliance status for any subcontractor regardless of standards
CREATE OR REPLACE FUNCTION public.calculate_subcontractor_compliance(subcontractor_id_param uuid)
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
  -- Count total mandatory documents
  SELECT COUNT(DISTINCT dt.id) INTO mandatory_count
  FROM document_types dt
  WHERE dt.required_by_default = true;

  -- Count valid mandatory documents for this subcontractor
  SELECT COUNT(DISTINCT r.document_type_id) INTO valid_mandatory_count
  FROM requirements r
  JOIN project_subs ps ON r.project_sub_id = ps.id
  JOIN document_types dt ON r.document_type_id = dt.id
  WHERE ps.subcontractor_id = subcontractor_id_param
    AND dt.required_by_default = true
    AND r.status IN ('valid', 'expiring_soon');

  -- Count expiring soon mandatory documents
  SELECT COUNT(DISTINCT r.document_type_id) INTO expiring_soon_count
  FROM requirements r
  JOIN project_subs ps ON r.project_sub_id = ps.id
  JOIN document_types dt ON r.document_type_id = dt.id
  WHERE ps.subcontractor_id = subcontractor_id_param
    AND dt.required_by_default = true
    AND r.status = 'expiring_soon';

  -- Determine compliance status
  IF valid_mandatory_count >= mandatory_count THEN
    IF expiring_soon_count > 0 THEN
      result_status := 'expiring_soon';
    ELSE
      result_status := 'compliant';
    END IF;
  ELSE
    result_status := 'non_compliant';
  END IF;

  -- Update subcontractor compliance status
  UPDATE subcontractors
  SET 
    compliance_status = result_status::subcontractor_compliance_status,
    updated_at = now()
  WHERE id = subcontractor_id_param;

  RETURN result_status;
END;
$$;