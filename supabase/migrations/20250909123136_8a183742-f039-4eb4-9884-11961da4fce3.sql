-- Fix remaining function security warnings by setting search_path

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_reminder_jobs_updated_at function
CREATE OR REPLACE FUNCTION public.update_reminder_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix other compliance functions with search_path
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
  
  -- Determine status
  IF valid_mandatory_count >= mandatory_count THEN
    IF expiring_soon_count > valid_mandatory_count THEN
      result_status := 'expiring_soon';
    ELSE
      result_status := 'compliant';
    END IF;
  ELSE
    result_status := 'non_compliant';
  END IF;
  
  -- Update subcontractor record
  UPDATE subcontractors 
  SET 
    compliance_status = result_status,
    last_compliance_check = now(),
    status = CASE 
      WHEN result_status = 'compliant' THEN 'active'
      ELSE 'inactive'
    END,
    activation_date = CASE 
      WHEN result_status = 'compliant' AND status = 'inactive' THEN now()
      WHEN result_status != 'compliant' THEN null
      ELSE activation_date
    END
  WHERE id = subcontractor_id_param;
  
  RETURN result_status;
END;
$$;

-- Fix all other functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.calculate_next_reminder_date(subcontractor_id_param uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  earliest_expiry date;
  reminder_date date;
BEGIN
  -- Find the earliest expiry date among valid documents
  SELECT MIN(d.valid_to) INTO earliest_expiry
  FROM documents d
  JOIN requirements r ON r.id = d.requirement_id
  JOIN project_subs ps ON ps.id = r.project_sub_id
  JOIN document_types dt ON dt.id = r.document_type_id
  WHERE ps.subcontractor_id = subcontractor_id_param
    AND dt.required_by_default = true
    AND r.status = 'valid'
    AND d.valid_to > CURRENT_DATE;
  
  -- Set reminder date to 30 days before expiry
  IF earliest_expiry IS NOT NULL THEN
    reminder_date := earliest_expiry - INTERVAL '30 days';
    IF reminder_date <= CURRENT_DATE THEN
      reminder_date := CURRENT_DATE + 1; -- Tomorrow if already passed
    END IF;
  END IF;
  
  -- Update the subcontractor record
  UPDATE subcontractors 
  SET next_reminder_date = reminder_date
  WHERE id = subcontractor_id_param;
  
  RETURN reminder_date;
END;
$$;