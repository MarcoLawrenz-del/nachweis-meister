-- Insert standard German construction document types
INSERT INTO public.document_types (code, name_de, description_de, required_by_default, sort_order) VALUES
('FREISTELLUNG', 'Freistellungsbescheinigung §48b EStG', 'Bescheinigung über die Freistellung von der Verpflichtung zum Steuerabzug', true, 1),
('UST_BESCHEIN', 'USt-Bescheinigung §13b UStG', 'Bescheinigung nach §13b Umsatzsteuergesetz', true, 2),
('SOKA_BAU', 'SOKA-BAU-Bescheinigung', 'Bescheinigung der Sozialkasse der Bauwirtschaft', true, 3),
('BG_BAU', 'BG BAU-Unbedenklichkeit', 'Unbedenklichkeitsbescheinigung der Berufsgenossenschaft Bau', true, 4),
('HANDWERKSROLLE', 'Handwerksrolle/Gewerbeschein', 'Eintrag in die Handwerksrolle oder Gewerbeschein', true, 5),
('A1_BESCHEIN', 'A1-Bescheinigung', 'A1-Bescheinigung bei Entsendung von Arbeitnehmern', false, 6),
('BETRIEBSHAFTPFLICHT', 'Betriebshaftpflichtversicherung', 'Nachweis der Betriebshaftpflichtversicherung', true, 7);