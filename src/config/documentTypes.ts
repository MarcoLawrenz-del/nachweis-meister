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
    id: "trade_registration", 
    label: "Gewerbeanmeldung", 
    defaultRequirement: "required", 
    validity: { kind: "none" } 
  },
  { 
    id: "commercial_register_extract", 
    label: "Handelsregisterauszug (nur GmbH/UG/AG)", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "craft_register", 
    label: "Eintragung in der Handwerksrolle (falls zulassungspflichtig)", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "withholding_certificate_48b", 
    label: "Freistellungsbescheinigung § 48b EStG (Bauleistungen)", 
    defaultRequirement: "optional", 
    validity: { kind: "end_of_year" } 
  },
  { 
    id: "bg_membership", 
    label: "Berufsgenossenschaft – Mitgliedschaft", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "health_fund_clearance", 
    label: "Unbedenklichkeitsbescheinigung – Krankenkasse", 
    defaultRequirement: "optional", 
    validity: { kind: "fixed_days", days: 365 } 
  },
  { 
    id: "soka_bau", 
    label: "SOKA-BAU Teilnahme/Unbedenklichkeit (falls SOKA-pflichtig)", 
    defaultRequirement: "optional", 
    validity: { kind: "fixed_days", days: 180 } 
  },
  { 
    id: "tax_clearance", 
    label: "Bescheinigung in Steuersachen (Finanzamt)", 
    defaultRequirement: "optional", 
    validity: { kind: "fixed_days", days: 365 } 
  },
  { 
    id: "liability_insurance", 
    label: "Betriebshaftpflichtversicherung", 
    defaultRequirement: "optional", 
    validity: { kind: "fixed_days", days: 365 } 
  },
  { 
    id: "a1_certificate", 
    label: "A1-Bescheinigung (bei Entsendung EU/EWR/CH)", 
    defaultRequirement: "hidden", 
    validity: { kind: "fixed_days", days: 180 } 
  },
  { 
    id: "dpa_gdpr", 
    label: "Auftragsverarbeitungsvertrag (DSGVO Art. 28)", 
    defaultRequirement: "optional", 
    validity: { kind: "none" } 
  },
  { 
    id: "safety_instruction", 
    label: "Sicherheitsunterweisung (DGUV)", 
    defaultRequirement: "optional", 
    validity: { kind: "fixed_days", days: 365 } 
  },
];