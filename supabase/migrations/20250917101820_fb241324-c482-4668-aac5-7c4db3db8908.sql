-- Create packages table
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create package_items table (many-to-many between packages and document_types)
CREATE TABLE public.package_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.document_types(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_id, document_type_id)
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for packages (read-only for all authenticated users)
CREATE POLICY "Everyone can view packages" 
ON public.packages 
FOR SELECT 
USING (true);

-- RLS policies for package_items (read-only for all authenticated users)
CREATE POLICY "Everyone can view package items" 
ON public.package_items 
FOR SELECT 
USING (true);

-- Insert package data
INSERT INTO public.packages (code, name_de, name_en, description_de, description_en, sort_order) VALUES
('STANDARD', 'Standard Paket', 'Standard Package', 'Vollständige Dokumentation für deutsche Bauprojekte', 'Complete documentation for German construction projects', 1),
('LIGHT', 'Light Paket', 'Light Package', 'Grundlegende Dokumentation', 'Basic documentation requirements', 2),
('AUSLAND', 'Ausland Paket', 'International Package', 'Dokumentation für ausländische Subunternehmer', 'Documentation for international subcontractors', 3);

-- Insert package items for STANDARD package
INSERT INTO public.package_items (package_id, document_type_id, is_required, sort_order)
SELECT 
  p.id as package_id,
  dt.id as document_type_id,
  CASE 
    WHEN dt.code IN ('FREISTELLUNGSBESCHEINIGUNG', 'BG_MITGLIEDSCHAFT', 'GEWERBEANMELDUNG', 'BETRIEBSHAFTPFLICHT') THEN true
    ELSE false
  END as is_required,
  CASE dt.code
    WHEN 'FREISTELLUNGSBESCHEINIGUNG' THEN 1
    WHEN 'BG_MITGLIEDSCHAFT' THEN 2
    WHEN 'GEWERBEANMELDUNG' THEN 3
    WHEN 'BETRIEBSHAFTPFLICHT' THEN 4
    ELSE dt.sort_order + 10
  END as sort_order
FROM public.packages p
CROSS JOIN public.document_types dt
WHERE p.code = 'STANDARD';

-- Insert package items for LIGHT package
INSERT INTO public.package_items (package_id, document_type_id, is_required, sort_order)
SELECT 
  p.id as package_id,
  dt.id as document_type_id,
  CASE 
    WHEN dt.code IN ('FREISTELLUNGSBESCHEINIGUNG', 'BG_MITGLIEDSCHAFT') THEN true
    ELSE false
  END as is_required,
  CASE dt.code
    WHEN 'FREISTELLUNGSBESCHEINIGUNG' THEN 1
    WHEN 'BG_MITGLIEDSCHAFT' THEN 2
    ELSE dt.sort_order + 10
  END as sort_order
FROM public.packages p
CROSS JOIN public.document_types dt
WHERE p.code = 'LIGHT'
AND dt.code IN ('FREISTELLUNGSBESCHEINIGUNG', 'BG_MITGLIEDSCHAFT');

-- Insert package items for AUSLAND package  
INSERT INTO public.package_items (package_id, document_type_id, is_required, sort_order)
SELECT 
  p.id as package_id,
  dt.id as document_type_id,
  CASE 
    WHEN dt.code = 'A1_ENTSENDUNG' THEN true
    ELSE false
  END as is_required,
  CASE dt.code
    WHEN 'A1_ENTSENDUNG' THEN 1
    ELSE dt.sort_order + 10
  END as sort_order
FROM public.packages p
CROSS JOIN public.document_types dt
WHERE p.code = 'AUSLAND';