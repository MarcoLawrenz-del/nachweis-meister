-- Add subcontractor status and compliance tracking
ALTER TABLE subcontractors 
ADD COLUMN status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
ADD COLUMN compliance_status text DEFAULT 'non_compliant' CHECK (compliance_status IN ('compliant', 'non_compliant', 'expiring_soon')),
ADD COLUMN last_compliance_check timestamp with time zone DEFAULT now(),
ADD COLUMN activation_date timestamp with time zone,
ADD COLUMN next_reminder_date date;

-- Update document types to match German legal requirements
-- First, clear existing data to avoid conflicts
DELETE FROM document_types;

-- Insert mandatory documents (rechtlich notwendig)
INSERT INTO document_types (code, name_de, description_de, required_by_default, sort_order) VALUES 
('GEWERBEANMELDUNG', 'Gewerbeanmeldung/Handwerkskarte', 'Gewerbeanmeldung oder Handwerkskarte je nach Unternehmensform', true, 1),
('FREISTELLUNG_48B', 'Freistellungsbescheinigung §48b EStG', 'Bauabzugssteuer-Freistellung (außer bei Kleinstaufträgen < 5.000€ jährlich)', true, 2),
('BETRIEBSHAFTPFLICHT', 'Betriebshaftpflichtversicherung', 'Nachweis einer gültigen Betriebshaftpflichtversicherung', true, 3),
('IHK_HWK_MITGLIED', 'Mitgliedsbescheinigung IHK/HWK', 'Mitgliedschaftsnachweis bei der zuständigen Kammer', true, 4),
('SOKA_BAU', 'SOKA-BAU Unbedenklichkeit', 'Unbedenklichkeitsbescheinigung der Sozialkasse der Bauwirtschaft', true, 5),
('ULAK_BESCHEINIGUNG', 'ULAK Unbedenklichkeit', 'Unbedenklichkeitsbescheinigung der Urlaubs- und Lohnausgleichskasse', true, 6),
('KRANKENKASSE_UNBEDENKLICH', 'Krankenkasse Unbedenklichkeit', 'Unbedenklichkeitsbescheinigung der Krankenkasse', true, 7),
('BG_BAU_UNBEDENKLICH', 'BG BAU Unbedenklichkeit', 'Unbedenklichkeitsbescheinigung der Berufsgenossenschaft Bau', true, 8),
('A1_ENTSENDUNG', 'A1-Entsendebescheinigung', 'A1-Bescheinigung für entsandtes Personal aus EU-Ländern', true, 9),
('AENTG_ZOLLMELDUNG', 'Zollmeldung §18 AEntG', 'Meldung nach Arbeitnehmer-Entsendegesetz bei der Zollverwaltung', true, 10),
('PERSONALAUSWEISE', 'Personalausweise', 'Personal- oder Reisepass des eingesetzten Personals', true, 11),
('ARBEITSZEIT_MINDESTLOHN', 'Arbeitszeitnachweise/Mindestlohn', 'Nachweis gem. Mindestlohngesetz §18 AEntG', true, 12),

-- Insert optional documents (empfohlen, aber rechtlich nicht zwingend)
('MINDESTARBEITSBEDINGUNGEN', 'Zusicherung Mindestarbeitsbedingungen', 'Schriftliche Zusicherung zur Einhaltung von Mindestarbeitsbedingungen', false, 13),
('GEFAEHRDUNGSANALYSE', 'Gefährdungsanalyse ArbSchG', 'Gefährdungs-/Belastungsanalyse gem. Arbeitsschutzgesetz §5', false, 14),
('ISO_QUALITAET', 'Qualitätsmanagement-Zertifikat', 'DQS, ISO oder andere Qualitätszertifizierungen', false, 15),
('CE_KONFORMITAET', 'CE-Konformitätserklärung', 'CE-Kennzeichnung für Bauprodukte', false, 16),
('BETRIEBSSICHERHEITSVO', 'Nachweis BetriebsSicherheitsVO', 'Dokumentation nach Betriebssicherheitsverordnung', false, 17);

-- Create function to calculate subcontractor compliance status
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
  JOIN documents d ON d.requirement_id = r.id
  WHERE ps.subcontractor_id = subcontractor_id_param
    AND dt.required_by_default = true
    AND r.status = 'valid'
    AND d.valid_to <= CURRENT_DATE + INTERVAL '30 days';
  
  -- Determine status
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

-- Create trigger to auto-update compliance status when requirements change
CREATE OR REPLACE FUNCTION public.update_subcontractor_compliance_trigger()
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
  
  -- Recalculate compliance status
  IF sub_id IS NOT NULL THEN
    PERFORM public.calculate_subcontractor_compliance(sub_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger to requirements table
DROP TRIGGER IF EXISTS update_compliance_on_requirement_change ON requirements;
CREATE TRIGGER update_compliance_on_requirement_change
  AFTER INSERT OR UPDATE OR DELETE ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subcontractor_compliance_trigger();

-- Create compliance reminder function
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