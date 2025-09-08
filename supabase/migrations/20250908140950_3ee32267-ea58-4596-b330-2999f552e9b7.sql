-- Update document types based on Bausicht.com requirements
-- Clear existing data to avoid conflicts
DELETE FROM document_types;

-- Insert documents based on Bausicht requirements
-- Phase 1: General requirements (vor Baubeginn und Ausführungsphase)
INSERT INTO document_types (code, name_de, description_de, required_by_default, sort_order) VALUES 
('MITARBEITERLISTE', 'Liste aller beteiligten Mitarbeitenden', 'Vollständige Liste mit Name und Vorname aller auf der Baustelle tätigen Mitarbeiter', true, 1),
('AUSWEISDOKUMENTE', 'Ausweisdokumente', 'Abgleich der Mitarbeiterliste mit Ausweisdokumenten (Personal- oder Reisepass)', true, 2),
('A1_ENTSENDENACHWEIS', 'A1-Entsendenachweis', 'Für Mitarbeiter, die nicht in Deutschland beschäftigt sind: A1-Bescheinigung', true, 3),
('GZD_MELDUNG_AENTG', 'Meldung GZD nach § 18 AEntG', 'Meldung an die Generalzolldirektion nach Arbeitnehmer-Entsendegesetz', true, 4),
('AUFENTHALTS_ARBEITSERLAUBNIS', 'Aufenthalts- und Arbeitserlaubnis', 'Für Beschäftigte aus nicht-EU-Staaten erforderlich', true, 5),
('MINDESTLOHN_ERKLAERUNGEN', 'Mindestlohnerklärungen', 'Monatliche Vorlage der Mindestlohnerklärungen aller Mitarbeitenden (Ausführungsphase)', true, 6),

-- Phase 2: Company-specific documents (alle Unternehmensformen)
('GEWERBESCHEIN', 'Gewerbeschein', 'Gewerbeanmeldung oder Gewerbeschein', true, 7),
('IHK_HWK_MITGLIEDSCHAFT', 'IHK/HWK Mitgliedschaft', 'Mitgliedschaft bei IHK oder Eintrag in Handwerksrolle bei HWK mit Handwerks- und Gewerbekarte', true, 8),
('FREISTELLUNG_48B_ESTG', 'Freistellungsbescheinigung § 48b EStG', 'Freistellungsbescheinigung des Finanzamts nach § 48b EStG (Bauabzugssteuer)', true, 9),
('BETRIEBSHAFTPFLICHT', 'Betriebshaftpflichtversicherung', 'Nachweis über Betriebshaftpflichtversicherung für die ausgeführte Tätigkeit', true, 10),

-- Phase 3: Employee-specific documents (je nach Unternehmensform)
('KRANKEN_UNFALLVERSICHERUNG', 'Kranken- und Unfallversicherung', 'Nachweis über bestehende Kranken- und Unfallversicherung für alle Baustellen-Mitarbeiter', true, 11),
('UB_KRANKENKASSE', 'Unbedenklichkeitsbescheinigung Krankenkasse', 'Qualifizierte Unbedenklichkeitsbescheinigung der Krankenkasse', true, 12),
('UB_BERUFSGENOSSENSCHAFT', 'Unbedenklichkeitsbescheinigung BG', 'Qualifizierte Unbedenklichkeitsbescheinigung der Berufsgenossenschaft', true, 13),
('UB_SOKA_ULAK', 'Unbedenklichkeitsbescheinigung SOKA-BAU/ULAK', 'Qualifizierte UB der SOKA-BAU oder Urlaubs- und Lohnausgleichskasse (ULAK)', true, 14),

-- Phase 4: Optional/recommended documents
('BG_MITGLIEDSCHAFT', 'Berufsgenossenschaft Mitgliedschaft', 'Mitgliedschaft in der Berufsgenossenschaft (empfohlen für Einzelunternehmen)', false, 15);

-- Add company type field to subcontractors to determine required documents
ALTER TABLE subcontractors 
ADD COLUMN company_type text DEFAULT 'baubetrieb' CHECK (company_type IN ('gbr', 'baubetrieb', 'einzelunternehmen'));

-- Update compliance calculation function to consider company type
CREATE OR REPLACE FUNCTION public.calculate_subcontractor_compliance_by_type(subcontractor_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_type_val text;
  mandatory_count integer;
  valid_mandatory_count integer;
  expiring_soon_count integer;
  result_status text;
BEGIN
  -- Get company type
  SELECT company_type INTO company_type_val
  FROM subcontractors 
  WHERE id = subcontractor_id_param;
  
  -- Count mandatory document types (all are mandatory for construction companies)
  SELECT COUNT(*) INTO mandatory_count
  FROM document_types 
  WHERE required_by_default = true;
  
  -- For Einzelunternehmen, BG membership is optional but others are mandatory
  -- For GbR and Baubetrieb, all employee-related documents are mandatory
  
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
  JOIN documents d ON d.requirement_id = r.id
  WHERE ps.subcontractor_id = subcontractor_id_param
    AND dt.required_by_default = true
    AND r.status = 'valid'
    AND d.valid_to <= CURRENT_DATE + INTERVAL '30 days';
  
  -- Determine status based on company type requirements
  IF company_type_val = 'einzelunternehmen' THEN
    -- For solo companies, BG membership is optional, so reduce required count by 1
    mandatory_count := mandatory_count - 1; -- Exclude BG_MITGLIEDSCHAFT
  END IF;
  
  IF valid_mandatory_count >= mandatory_count THEN
    IF expiring_soon_count > 0 THEN
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

-- Create automated reminder system
CREATE OR REPLACE FUNCTION public.send_compliance_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reminder_record RECORD;
BEGIN
  -- Find subcontractors with reminders due today or overdue
  FOR reminder_record IN
    SELECT 
      s.id,
      s.company_name,
      s.next_reminder_date,
      s.compliance_status,
      COUNT(CASE WHEN d.valid_to <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_docs
    FROM subcontractors s
    JOIN project_subs ps ON ps.subcontractor_id = s.id
    JOIN requirements r ON r.project_sub_id = ps.id
    JOIN documents d ON d.requirement_id = r.id
    JOIN document_types dt ON dt.id = r.document_type_id
    WHERE s.next_reminder_date <= CURRENT_DATE
      AND dt.required_by_default = true
      AND r.status = 'valid'
    GROUP BY s.id, s.company_name, s.next_reminder_date, s.compliance_status
  LOOP
    -- Here you would integrate with your notification system
    -- For now, we'll just log the reminder
    RAISE NOTICE 'Reminder due for subcontractor: % (%) - % expiring documents', 
                 reminder_record.company_name, 
                 reminder_record.id, 
                 reminder_record.expiring_docs;
    
    -- Update next reminder date (30 days from now)
    UPDATE subcontractors 
    SET next_reminder_date = CURRENT_DATE + INTERVAL '30 days'
    WHERE id = reminder_record.id;
  END LOOP;
END;
$$;

-- Project assignment validation function
CREATE OR REPLACE FUNCTION public.validate_subcontractor_for_project(subcontractor_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  missing_docs text[];
  result jsonb;
BEGIN
  -- Get subcontractor info
  SELECT 
    id, 
    company_name, 
    status, 
    compliance_status,
    company_type
  INTO sub_record
  FROM subcontractors 
  WHERE id = subcontractor_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Nachunternehmer nicht gefunden'
    );
  END IF;
  
  -- Check if subcontractor is active and compliant
  IF sub_record.status != 'active' OR sub_record.compliance_status != 'compliant' THEN
    -- Find missing mandatory documents
    SELECT array_agg(dt.name_de) INTO missing_docs
    FROM document_types dt
    WHERE dt.required_by_default = true
    AND dt.id NOT IN (
      SELECT DISTINCT r.document_type_id
      FROM requirements r
      JOIN project_subs ps ON ps.id = r.project_sub_id
      WHERE ps.subcontractor_id = subcontractor_id_param
      AND r.status = 'valid'
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'reason', format('Nachunternehmer ist nicht aktiv (%s). Fehlende Dokumente: %s', 
                      sub_record.compliance_status,
                      array_to_string(missing_docs, ', ')),
      'missing_documents', missing_docs,
      'compliance_status', sub_record.compliance_status
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Nachunternehmer ist rechtlich compliant und projektbereit',
    'compliance_status', sub_record.compliance_status
  );
END;
$$;