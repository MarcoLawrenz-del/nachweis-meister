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
];