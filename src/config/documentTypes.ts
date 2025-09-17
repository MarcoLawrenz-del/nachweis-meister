export type ValidityStrategy =
  | { kind: "none" }
  | { kind: "fixed_days"; days: number }
  | { kind: "end_of_year" };

export type DocumentType = {
  id: string;
  label: string;
  defaultRequirement: "required" | "optional" | "hidden";
  validity: ValidityStrategy;
};

export const DOCUMENT_TYPES: DocumentType[] = [
  { 
    id: "haftpflicht", 
    label: "Betriebshaftpflicht", 
    defaultRequirement: "required", 
    validity: { kind: "fixed_days", days: 365 } 
  },
  { 
    id: "freistellungsbescheinigung", 
    label: "Freistellungsbescheinigung", 
    defaultRequirement: "required", 
    validity: { kind: "end_of_year" } 
  },
  { 
    id: "gewerbeanmeldung", 
    label: "Gewerbeanmeldung", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "unbedenklichkeitsbescheinigung", 
    label: "Unbedenklichkeitsbescheinigung", 
    defaultRequirement: "optional", 
    validity: { kind: "fixed_days", days: 180 } 
  },
  { 
    id: "handelsregisterauszug", 
    label: "Handelsregisterauszug", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "bg_mitgliedschaft", 
    label: "Berufsgenossenschaft – Mitgliedschaft", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "kk_unbedenklichkeit", 
    label: "Unbedenklichkeitsbescheinigung – Krankenkasse", 
    defaultRequirement: "optional", 
    validity: { kind: "fixed_days", days: 365 } 
  },
  { 
    id: "avv", 
    label: "Auftragsverarbeitungsvertrag (AVV)", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "a1_bescheinigung", 
    label: "A1-Bescheinigung (bei Entsendung)", 
    defaultRequirement: "hidden", 
    validity: { kind: "fixed_days", days: 180 } 
  },
];