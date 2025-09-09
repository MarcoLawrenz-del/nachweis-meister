-- Update compliance calculation functions to respect subcontractor active status
-- Inactive subcontractors should not trigger compliance warnings or reminders

-- Update the generic compliance calculation function to check active status
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
  sub_status text;
BEGIN
  -- Check if subcontractor is active
  SELECT status INTO sub_status
  FROM subcontractors 
  WHERE id = subcontractor_id_param;
  
  -- If subcontractor is inactive, return current status without changes
  IF sub_status != 'active' THEN
    SELECT compliance_status INTO result_status
    FROM subcontractors 
    WHERE id = subcontractor_id_param;
    RETURN result_status;
  END IF;

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

-- Update compute_required_requirements to respect active status for warnings
CREATE OR REPLACE FUNCTION public.compute_required_requirements(subcontractor_id_param uuid, project_sub_id_param uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  rule_record RECORD;
  requirement_record RECORD;
  created_count integer := 0;
  updated_count integer := 0;
  warning_count integer := 0;
  warnings jsonb := '[]'::jsonb;
  current_month date;
  should_generate_warnings boolean := false;
BEGIN
  -- Subcontractor-Daten laden
  SELECT * INTO sub_record
  FROM subcontractors s
  WHERE s.id = subcontractor_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Subcontractor not found');
  END IF;
  
  current_month := date_trunc('month', CURRENT_DATE)::date;
  
  -- Bestimme ob Warnungen generiert werden sollen
  -- Regel: Warnungen nur wenn global aktiv UND aktives Engagement existiert
  IF sub_record.status = 'active' THEN
    IF project_sub_id_param IS NOT NULL THEN
      -- Prüfe ob das spezifische Engagement aktiv ist
      SELECT EXISTS (
        SELECT 1 FROM project_subs ps 
        WHERE ps.id = project_sub_id_param 
        AND ps.status = 'active'
        AND (ps.end_at IS NULL OR ps.end_at > CURRENT_DATE)
      ) INTO should_generate_warnings;
    ELSE
      -- Prüfe ob irgendein aktives Engagement existiert
      SELECT EXISTS (
        SELECT 1 FROM project_subs ps 
        WHERE ps.subcontractor_id = subcontractor_id_param 
        AND ps.status = 'active'
        AND (ps.end_at IS NULL OR ps.end_at > CURRENT_DATE)
      ) INTO should_generate_warnings;
    END IF;
  ELSE
    -- Inaktive Subcontractors: keine Warnungen
    should_generate_warnings := false;
  END IF;
  
  -- ... [keep existing requirement generation logic unchanged] ...
  -- Durchlaufe alle passenden Rules
  FOR rule_record IN
    SELECT rr.*
    FROM requirement_rules rr
    WHERE rr.active = true
    AND rr.company_type = sub_record.company_type
    AND (rr.requires_employees IS NULL OR rr.requires_employees = sub_record.requires_employees)
    AND (rr.has_non_eu_workers IS NULL OR rr.has_non_eu_workers = sub_record.has_non_eu_workers)
    AND (rr.employees_not_employed_in_germany IS NULL OR rr.employees_not_employed_in_germany = sub_record.employees_not_employed_in_germany)
    ORDER BY rr.frequency DESC -- monthly zuerst
  LOOP
    -- ... [keep existing logic for creating requirements] ...
    -- Für monthly: pro Monat ein Requirement (nur bei aktiven Engagements)
    IF rule_record.frequency = 'monthly' THEN
      -- Prüfe ob für aktuellen Monat bereits vorhanden
      SELECT r.* INTO requirement_record
      FROM requirements r
      JOIN project_subs ps ON ps.id = r.project_sub_id
      WHERE ps.subcontractor_id = subcontractor_id_param
      AND r.document_type_id = rule_record.document_type_id
      AND r.due_date >= current_month
      AND r.due_date < current_month + INTERVAL '1 month'
      AND (project_sub_id_param IS NULL OR r.project_sub_id = project_sub_id_param)
      LIMIT 1;
      
      IF NOT FOUND AND project_sub_id_param IS NOT NULL THEN
        -- Erstelle monatliches Requirement nur für aktive Engagements und aktive Subcontractors
        SELECT ps.status INTO requirement_record
        FROM project_subs ps 
        WHERE ps.id = project_sub_id_param;
        
        IF requirement_record.status = 'active' AND sub_record.status = 'active' THEN
          INSERT INTO requirements (
            project_sub_id,
            document_type_id, 
            status,
            due_date
          ) VALUES (
            project_sub_id_param,
            rule_record.document_type_id,
            'missing',
            current_month + INTERVAL '1 month' - INTERVAL '1 day'
          );
          created_count := created_count + 1;
        END IF;
      ELSE
        updated_count := updated_count + 1;
      END IF;
    
    -- Für once/annual: ein globales Requirement (über erstes/beliebiges project_sub)
    ELSE
      SELECT r.* INTO requirement_record
      FROM requirements r
      JOIN project_subs ps ON ps.id = r.project_sub_id
      WHERE ps.subcontractor_id = subcontractor_id_param
      AND r.document_type_id = rule_record.document_type_id
      AND (project_sub_id_param IS NULL OR r.project_sub_id = project_sub_id_param)
      LIMIT 1;
      
      IF NOT FOUND AND project_sub_id_param IS NOT NULL THEN
        -- Erstelle einmaliges Requirement (auch für inaktive, aber ohne Warnungen)
        INSERT INTO requirements (
          project_sub_id,
          document_type_id,
          status,
          due_date
        ) VALUES (
          project_sub_id_param,
          rule_record.document_type_id,
          'missing',
          CURRENT_DATE + INTERVAL '30 days'
        );
        created_count := created_count + 1;
      ELSE
        updated_count := updated_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  -- ... [keep existing status update logic unchanged] ...
  -- Status-Update basierend auf valid_to (für alle Requirements des Subcontractors)
  UPDATE requirements SET
    status = CASE
      WHEN status = 'valid' AND EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.requirement_id = requirements.id 
        AND d.valid_to IS NOT NULL
        AND d.valid_to <= CURRENT_DATE
      ) THEN 'expired'
      WHEN status = 'valid' AND EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.requirement_id = requirements.id 
        AND d.valid_to IS NOT NULL
        AND d.valid_to <= CURRENT_DATE + INTERVAL '30 days'
        AND d.valid_to > CURRENT_DATE
      ) THEN 'expiring'
      ELSE status
    END
  WHERE id IN (
    SELECT r.id 
    FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    WHERE ps.subcontractor_id = subcontractor_id_param
  );
  
  -- Sammle Warnungen NUR wenn should_generate_warnings = true (aktiver Status)
  IF should_generate_warnings THEN
    FOR requirement_record IN
      SELECT 
        r.*,
        dt.name_de as document_name,
        dt.code as document_code,
        ps.status as engagement_status
      FROM requirements r
      JOIN project_subs ps ON ps.id = r.project_sub_id
      JOIN document_types dt ON dt.id = r.document_type_id
      WHERE ps.subcontractor_id = subcontractor_id_param
      AND r.status IN ('missing', 'expiring', 'expired')
      AND (
        -- Global aktiv, UND aktives Engagement
        sub_record.status = 'active' 
        AND (ps.status = 'active' AND (ps.end_at IS NULL OR ps.end_at > CURRENT_DATE))
      )
      AND (project_sub_id_param IS NULL OR r.project_sub_id = project_sub_id_param)
    LOOP
      warnings := warnings || jsonb_build_object(
        'requirement_id', requirement_record.id,
        'document_name', requirement_record.document_name,
        'document_code', requirement_record.document_code,
        'status', requirement_record.status,
        'due_date', requirement_record.due_date,
        'engagement_status', requirement_record.engagement_status
      );
      warning_count := warning_count + 1;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'created_requirements', created_count,
    'updated_requirements', updated_count,
    'warning_count', warning_count,
    'warnings', warnings,
    'subcontractor_global_active', sub_record.status = 'active',
    'should_generate_warnings', should_generate_warnings,
    'company_type', sub_record.company_type,
    'flags', jsonb_build_object(
      'requires_employees', sub_record.requires_employees,
      'has_non_eu_workers', sub_record.has_non_eu_workers,
      'employees_not_employed_in_germany', sub_record.employees_not_employed_in_germany
    )
  );
END;
$$;