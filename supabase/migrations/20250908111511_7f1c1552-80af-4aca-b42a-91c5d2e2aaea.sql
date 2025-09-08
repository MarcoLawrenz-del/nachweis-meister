-- Clean up duplicate document types and fix required_by_default logic
-- Only keep the newer, properly named document types and set A1 as optional for most cases

-- Remove old duplicated document types
DELETE FROM document_types WHERE code IN (
  'freistellungsbescheinigung',
  'umsatzsteuer', 
  'soka_bau',
  'bg_bau',
  'handwerksrolle',
  'a1_bescheinigung',
  'betriebshaftpflicht'
);

-- Update A1 requirement to be context-dependent (not required by default for domestic subcontractors)
UPDATE document_types 
SET required_by_default = false, 
    description_de = 'Nur erforderlich bei Entsendung von Arbeitnehmern aus dem EU-Ausland'
WHERE code = 'A1_BESCHEIN';