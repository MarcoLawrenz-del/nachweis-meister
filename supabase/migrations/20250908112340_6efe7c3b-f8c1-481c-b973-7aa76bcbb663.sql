-- Fix the trigger that's causing the upload error
-- The trigger is trying to access reviewed_by field that doesn't exist in requirements table
CREATE OR REPLACE FUNCTION public.track_review_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      auth.uid(), -- Use current user instead of non-existent reviewed_by field
      CASE 
        WHEN NEW.status = 'valid' THEN 'approved'
        WHEN NEW.status = 'missing' AND OLD.status = 'in_review' THEN 'rejected'
        ELSE 'updated'
      END,
      OLD.status,
      NEW.status
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
$function$;

-- Add missing document types as optional
INSERT INTO document_types (code, name_de, description_de, required_by_default, sort_order) VALUES 
('ISO_CERT', 'ISO Zertifizierung', 'ISO 9001 oder andere Qualitätszertifizierungen', false, 8),
('CE_KONFORM', 'CE-Konformitätserklärung', 'CE-Kennzeichnung für Bauprodukte', false, 9),
('FACHKUNDE', 'Fachkundenachweise', 'Spezielle Fachkundebescheinigungen für das Gewerk', false, 10),
('REFERENZEN', 'Referenzprojekte', 'Nachweis ähnlicher Projektdurchführungen', false, 11),
('DATENSCHUTZ', 'Datenschutzerklärung', 'DSGVO-konforme Datenschutzerklärung', false, 12)
ON CONFLICT (code) DO NOTHING;