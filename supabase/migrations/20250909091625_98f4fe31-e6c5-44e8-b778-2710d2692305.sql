-- Seed requirement_rules mit Pflichtlogik
-- Zuerst alle alten Rules löschen falls vorhanden
DELETE FROM requirement_rules;

-- Für ALLE Rechtsformen obligatorisch (keine Bedingungen)
INSERT INTO requirement_rules (company_type, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, document_type_id, frequency, validity_months) 
SELECT 
  company_type.type,
  NULL, NULL, NULL,
  dt.id,
  'once',
  24
FROM (VALUES 
  ('gmbh'), ('ug'), ('gbr'), ('einzelunternehmen'), ('baubetrieb'), ('dienstleister')
) AS company_type(type)
CROSS JOIN document_types dt
WHERE dt.code IN ('MITARBEITERLISTE', 'AUSWEISABGLEICH');

-- Rechtsform-spezifische Dokumente (GBR, Einzelunternehmen, Baubetrieb, Dienstleister)
INSERT INTO requirement_rules (company_type, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, document_type_id, frequency, validity_months)
SELECT 
  company_type.type,
  NULL, NULL, NULL,
  dt.id,
  'once',
  CASE 
    WHEN dt.code = 'FREISTELLUNG_48B' THEN 12
    WHEN dt.code = 'BETRIEBSHAFTPFLICHT' THEN 12
    ELSE 24
  END
FROM (VALUES 
  ('gbr'), ('einzelunternehmen'), ('baubetrieb'), ('dienstleister')
) AS company_type(type)
CROSS JOIN document_types dt
WHERE dt.code IN ('GEWERBESCHEIN', 'IHK_HWK_NACHWEIS', 'FREISTELLUNG_48B', 'BETRIEBSHAFTPFLICHT');

-- Bei Mitarbeitenden: zusätzliche Nachweise für alle Rechtsformen mit Angestellten
INSERT INTO requirement_rules (company_type, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, document_type_id, frequency, validity_months)
SELECT 
  company_type.type,
  true, NULL, NULL,
  dt.id,
  'once',
  12
FROM (VALUES 
  ('gmbh'), ('ug'), ('gbr'), ('einzelunternehmen'), ('baubetrieb'), ('dienstleister')
) AS company_type(type)
CROSS JOIN document_types dt
WHERE dt.code IN ('UNBEDENKLICHKEIT_SOZIALVERS', 'BG_MITGLIEDSCHAFT', 'SOKA_NACHWEIS');

-- Monatliche Mindestlohnerklärung (alle Rechtsformen mit Angestellten)
INSERT INTO requirement_rules (company_type, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, document_type_id, frequency, validity_months)
SELECT 
  company_type.type,
  true, NULL, NULL,
  dt.id,
  'monthly',
  1
FROM (VALUES 
  ('gmbh'), ('ug'), ('gbr'), ('einzelunternehmen'), ('baubetrieb'), ('dienstleister')
) AS company_type(type)
CROSS JOIN document_types dt
WHERE dt.code = 'MINDESTLOHN_ERKLAERUNG';

-- A1 + GZD nur wenn employees_not_employed_in_germany = true
INSERT INTO requirement_rules (company_type, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, document_type_id, frequency, validity_months)
SELECT 
  company_type.type,
  NULL, NULL, true,
  dt.id,
  'once',
  6
FROM (VALUES 
  ('gmbh'), ('ug'), ('gbr'), ('einzelunternehmen'), ('baubetrieb'), ('dienstleister')
) AS company_type(type)
CROSS JOIN document_types dt
WHERE dt.code IN ('A1_BESCHEINIGUNG', 'GZD_MELDUNG');

-- Aufenthaltserlaubnis nur wenn has_non_eu_workers = true
INSERT INTO requirement_rules (company_type, requires_employees, has_non_eu_workers, employees_not_employed_in_germany, document_type_id, frequency, validity_months)
SELECT 
  company_type.type,
  NULL, true, NULL,
  dt.id,
  'once',
  12
FROM (VALUES 
  ('gmbh'), ('ug'), ('gbr'), ('einzelunternehmen'), ('baubetrieb'), ('dienstleister')
) AS company_type(type)
CROSS JOIN document_types dt
WHERE dt.code = 'AUFENTHALTSERLAUBNIS';

-- Compute Required Requirements Function
CREATE OR REPLACE FUNCTION compute_required_requirements(
  subcontractor_id_param uuid,
  project_sub_id_param uuid DEFAULT NULL
)
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
  tenant_id_val uuid;
BEGIN
  -- Subcontractor-Daten laden
  SELECT 
    s.*,
    -- Wenn project_sub_id gegeben, prüfe ob aktiv, sonst prüfe Subcontractor-Status
    CASE 
      WHEN project_sub_id_param IS NOT NULL THEN 
        (SELECT ps.overall_status = 'approved' FROM project_subs ps WHERE ps.id = project_sub_id_param)
      ELSE s.status = 'active'
    END as is_active_context
  INTO sub_record
  FROM subcontractors s
  WHERE s.id = subcontractor_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Subcontractor not found');
  END IF;
  
  tenant_id_val := sub_record.tenant_id;
  current_month := date_trunc('month', CURRENT_DATE)::date;
  
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
    -- Für monthly: pro Monat ein Requirement
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
      
      IF NOT FOUND THEN
        -- Erstelle monatliches Requirement
        IF project_sub_id_param IS NOT NULL THEN
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
    
    -- Für once/annual: ein Requirement pro Subcontractor
    ELSE
      SELECT r.* INTO requirement_record
      FROM requirements r
      JOIN project_subs ps ON ps.id = r.project_sub_id
      WHERE ps.subcontractor_id = subcontractor_id_param
      AND r.document_type_id = rule_record.document_type_id
      AND (project_sub_id_param IS NULL OR r.project_sub_id = project_sub_id_param)
      LIMIT 1;
      
      IF NOT FOUND AND project_sub_id_param IS NOT NULL THEN
        -- Erstelle einmaliges Requirement
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
  
  -- Status-Update basierend auf valid_to
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
  
  -- Nur Warnungen für aktive Contexts generieren
  IF sub_record.is_active_context THEN
    -- Sammle Warnungen
    FOR requirement_record IN
      SELECT 
        r.*,
        dt.name_de as document_name,
        dt.code as document_code
      FROM requirements r
      JOIN project_subs ps ON ps.id = r.project_sub_id
      JOIN document_types dt ON dt.id = r.document_type_id
      WHERE ps.subcontractor_id = subcontractor_id_param
      AND r.status IN ('missing', 'expiring', 'expired')
      AND (project_sub_id_param IS NULL OR r.project_sub_id = project_sub_id_param)
    LOOP
      warnings := warnings || jsonb_build_object(
        'requirement_id', requirement_record.id,
        'document_name', requirement_record.document_name,
        'document_code', requirement_record.document_code,
        'status', requirement_record.status,
        'due_date', requirement_record.due_date
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
    'subcontractor_active', sub_record.is_active_context,
    'company_type', sub_record.company_type,
    'flags', jsonb_build_object(
      'requires_employees', sub_record.requires_employees,
      'has_non_eu_workers', sub_record.has_non_eu_workers,
      'employees_not_employed_in_germany', sub_record.employees_not_employed_in_germany
    )
  );
END;
$$;