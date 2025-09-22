// Document validity rules configuration
export type DocValidityRule =
  | { mode: "none" }                       // läuft nicht ab
  | { mode: "fixedMonths"; months: number } // pauschal X Monate
  | { mode: "maxMonths"; months: number }   // „nicht älter als X Monate"
  | { mode: "custom"; note: string; defaultMonths: number }; // Sonderfälle

export const DOC_VALIDITY_DEFAULTS: Record<string, DocValidityRule> = {
  // Pflicht-Dokumente mit praxis-basierten Defaults
  "haftpflicht": { mode: "fixedMonths", months: 12 },
  "freistellungsbescheinigung": { mode: "fixedMonths", months: 12 },
  "gewerbeanmeldung": { mode: "none" },
  "unbedenklichkeitsbescheinigung": { mode: "fixedMonths", months: 3 }, // FA-UBB
  "handelsregisterauszug": { mode: "maxMonths", months: 3 },
  "bg_mitgliedschaft": { mode: "fixedMonths", months: 12 },
  "kk_unbedenklichkeit": { mode: "fixedMonths", months: 3 },
  "avv": { mode: "none" },
  "a1_bescheinigung": { 
    mode: "custom", 
    note: "Bis Ende der Entsendung, max. 24 Monate. Default 6 Monate, wenn unbekannt.",
    defaultMonths: 6
  },
  // Fallback für custom-Dokumente
  "custom:*": { mode: "fixedMonths", months: 12 }
};

export function getValidityRule(documentTypeId: string): DocValidityRule {
  return DOC_VALIDITY_DEFAULTS[documentTypeId] || 
         DOC_VALIDITY_DEFAULTS["custom:*"];
}

export function hasExpiry(documentTypeId: string): boolean {
  const rule = getValidityRule(documentTypeId);
  return rule.mode !== "none";
}