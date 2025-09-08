-- Update document types with Bausicht-specific requirements
DELETE FROM document_types;

-- Insert mandatory documents (Chargenpflichtige Dokumente)
INSERT INTO document_types (code, name_de, description_de, required_by_default, sort_order) VALUES
  ('MITARBEITERLISTE', 'Mitarbeitendenliste inkl. Abgleich mit Ausweis', 'Vollständige Liste aller Mitarbeitenden mit Personalausweisabgleich zur Identitätsprüfung', true, 1),
  ('A1_ENTSENDUNG', 'A1-Entsende-Nachweis + GZD-Meldung', 'A1-Bescheinigung für entsandte Arbeitnehmer gemäß § 18 AEntG und GZD-Meldung', true, 2),
  ('AUFENTHALTSERLAUBNIS', 'Aufenthalts-/Arbeitserlaubnis', 'Aufenthalts- und Arbeitserlaubnis für Nicht-EU Mitarbeitende', true, 3),
  ('MINDESTLOHN_ERKLAERUNG', 'Monatliche Mindestlohnerklärung', 'Monatliche Erklärung zur Einhaltung des Mindestlohns während der Bauausführung', true, 4),
  ('GEWERBESCHEIN', 'Gewerbeschein', 'Gültiger Gewerbeschein als Nachweis der Gewerbeanmeldung', true, 5),
  ('IHK_HWK_NACHWEIS', 'IHK-Mitgliedschaft / HWK-Handwerksrolle', 'Nachweis zur IHK-Mitgliedschaft oder Eintrag in die HWK-Handwerksrolle', true, 6),
  ('FREISTELLUNGSBESCHEINIGUNG', 'Freistellungsbescheinigung (§ 48b EStG)', 'Freistellungsbescheinigung nach § 48b EStG zur Vermeidung der Bauabzugssteuer', true, 7),
  ('BETRIEBSHAFTPFLICHT', 'Betriebshaftpflichtversicherung', 'Nachweis einer gültigen Betriebshaftpflichtversicherung', true, 8);

-- Insert optional/recommended documents
INSERT INTO document_types (code, name_de, description_de, required_by_default, sort_order) VALUES
  ('UNBEDENKLICHKEIT_BG', 'Unbedenklichkeitsbescheinigung BG BAU', 'Unbedenklichkeitsbescheinigung der Berufsgenossenschaft BAU und Sozialkassen', false, 9),
  ('ARBEITSZEIT_NACHWEISE', 'Arbeitszeitnachweise / Mindestlohn-Protokolle', 'Dokumentation der Arbeitszeiten und Mindestlohn-Protokolle für Transparenz und Absicherung', false, 10);

-- Update compliance calculation function to properly handle mandatory documents
CREATE OR REPLACE FUNCTION public.calculate_subcontractor_compliance_bausicht(subcontractor_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mandatory_count integer;
  valid_mandatory_count integer;
  expiring_soon_count integer;
  result_status text;
BEGIN
  -- Count mandatory document types (Chargenpflichtige Dokumente)
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
  
  -- Determine status based on Bausicht requirements
  IF valid_mandatory_count >= mandatory_count THEN
    IF expiring_soon_count > 0 THEN
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

-- Update the trigger to use the new function
CREATE OR REPLACE FUNCTION public.update_subcontractor_compliance_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sub_id uuid;
BEGIN
  -- Get subcontractor ID from the requirement
  SELECT ps.subcontractor_id INTO sub_id
  FROM project_subs ps
  WHERE ps.id = COALESCE(NEW.project_sub_id, OLD.project_sub_id);
  
  -- Recalculate compliance status using Bausicht logic
  IF sub_id IS NOT NULL THEN
    PERFORM public.calculate_subcontractor_compliance_bausicht(sub_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;