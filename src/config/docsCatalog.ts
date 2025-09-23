// Single Source of Truth für alle Dokumente in der Hilfeseite
export type DocInfo = {
  slug: string;
  title: string;
  short: string;
  whoNeedsIt: string;
  whenRequired: string;
  howToGet: Array<{ label: string; url: string }>;
  validity: { 
    type: "fixed" | "does_not_expire" | "unknown_ok"; 
    defaultMonths?: number; 
    note?: string;
  };
  uploadTips: string[];
  legalRefs?: Array<{ label: string; url: string }>;
  packages: Array<{ 
    pkg: "handwerk_basis" | "bau_standard" | "ausland_plus"; 
    requirement: "pflicht" | "optional" | "konditional"; 
    note?: string;
  }>;
};

export const DOCS: DocInfo[] = [
  {
    slug: "withholding_certificate_48b",
    title: "Freistellungsbescheinigung (§ 48b EStG)",
    short: "Bescheinigt, dass Ihr Betrieb von der Bauabzugssteuer befreit ist.",
    whoNeedsIt: "Unternehmen, die Bauleistungen erbringen/vergüten (oft Bau/Gewerke auf Baustellen).",
    whenRequired: "Pflicht, wenn Bauleistungen i. S. d. § 48 EStG erbracht/vergütet werden.",
    howToGet: [
      { label: "BZSt – Informationen", url: "https://www.bzst.de" },
      { label: "§ 48b EStG (Gesetze im Internet)", url: "https://www.gesetze-im-internet.de/estg/__48b.html" }
    ],
    validity: { type: "fixed", defaultMonths: 12, note: "i. d. R. befristet ausgestellt" },
    uploadTips: [
      "Nur gültige Original-PDFs oder vollständiges Foto",
      "Name, Steuernummer, Gültigkeit gut lesbar"
    ],
    legalRefs: [
      { label: "§ 48/§ 48b EStG", url: "https://www.gesetze-im-internet.de/estg/" }
    ],
    packages: [
      { pkg: "bau_standard", requirement: "pflicht" },
      { pkg: "handwerk_basis", requirement: "konditional", note: "wenn Bauleistung" }
    ]
  },
  {
    slug: "trade_registration",
    title: "Gewerbeanmeldung",
    short: "Nachweis, dass Ihr Gewerbe angemeldet ist.",
    whoNeedsIt: "Alle gewerblichen Betriebe (außer reine Freiberufler).",
    whenRequired: "Grundnachweis für die Zusammenarbeit; immer Pflicht.",
    howToGet: [
      { label: "Verwaltungsportal – Gewerbe anmelden", url: "https://www.verwaltung.bund.de" },
      { label: "§ 14 GewO (Gesetze im Internet)", url: "https://www.gesetze-im-internet.de/gewo/__14.html" }
    ],
    validity: { type: "does_not_expire", note: "keine Ablauffrist; Änderungen neu anzeigen" },
    uploadTips: [
      "Amtlichen Bescheid vollständig fotografieren oder als PDF beilegen"
    ],
    packages: [
      { pkg: "handwerk_basis", requirement: "pflicht" },
      { pkg: "bau_standard", requirement: "pflicht" }
    ]
  },
  {
    slug: "commercial_register_extract",
    title: "Handelsregisterauszug",
    short: "Aktueller Auszug über Firma, Sitz, Vertretung.",
    whoNeedsIt: "Kapital- und bestimmte Personengesellschaften; nicht bei reinen Einzelunternehmern ohne HR.",
    whenRequired: "Pflicht bei HR-pflichtigen Unternehmen oder auf Nachfrage.",
    howToGet: [
      { label: "Handelsregister (Justizportal Bund/Länder)", url: "https://www.handelsregister.de" }
    ],
    validity: { type: "fixed", defaultMonths: 6, note: "Praxis: 'aktuell' = ≤ 6 Monate" },
    uploadTips: [
      "Vollständiger Auszug (alle Seiten)",
      "PDF bevorzugt"
    ],
    packages: [
      { pkg: "handwerk_basis", requirement: "konditional", note: "nur HR-Pflichtige" },
      { pkg: "bau_standard", requirement: "konditional" }
    ]
  },
  {
    slug: "craft_register",
    title: "Eintragung in die Handwerksrolle (bei zulassungspflichtigen Handwerken)",
    short: "Nachweis der Berechtigung zur Ausübung zulassungspflichtiger Handwerke.",
    whoNeedsIt: "Zulassungspflichtige Handwerke (Anlage A HwO).",
    whenRequired: "Pflicht, wenn Ihr Gewerk zulassungspflichtig ist.",
    howToGet: [
      { label: "Handwerksordnung – Anlage A", url: "https://www.gesetze-im-internet.de/hwo/" },
      { label: "Ihre Handwerkskammer", url: "https://www.handwerkskammer.de" }
    ],
    validity: { type: "does_not_expire" },
    uploadTips: [
      "Eintragungs- oder Meisternachweis beilegen"
    ],
    packages: [
      { pkg: "handwerk_basis", requirement: "konditional", note: "bei Anlage A" }
    ]
  },
  {
    slug: "liability_insurance",
    title: "Betriebshaftpflichtversicherung",
    short: "Weist Versicherungsschutz für Personen-/Sachschäden nach.",
    whoNeedsIt: "Empfohlen für alle; oft vertraglich gefordert.",
    whenRequired: "Pflicht, wenn vertraglich vereinbart oder vom Auftraggeber vorgegeben.",
    howToGet: [
      { label: "Informationen Ihrer Handwerkskammer", url: "https://www.handwerkskammer.de" }
    ],
    validity: { type: "fixed", defaultMonths: 12, note: "jährliche Police/Bestätigung" },
    uploadTips: [
      "Police oder aktuelle Deckungsbestätigung",
      "Deckungssummen sichtbar"
    ],
    packages: [
      { pkg: "handwerk_basis", requirement: "pflicht" },
      { pkg: "bau_standard", requirement: "pflicht" }
    ]
  },
  {
    slug: "tax_clearance",
    title: "Bescheinigung in Steuersachen (Unbedenklichkeit)",
    short: "Finanzamt bestätigt steuerliche Zuverlässigkeit.",
    whoNeedsIt: "Häufig bei öffentlichen/größeren Aufträgen; Nachweis der Zuverlässigkeit.",
    whenRequired: "Pflicht je nach Auftraggeber; sonst optional.",
    howToGet: [
      { label: "Verwaltungsportal – Bescheinigung in Steuersachen", url: "https://www.verwaltung.bund.de" }
    ],
    validity: { type: "fixed", defaultMonths: 12 },
    uploadTips: [
      "Alle Seiten, Stempel/QR sichtbar"
    ],
    packages: [
      { pkg: "handwerk_basis", requirement: "optional" },
      { pkg: "bau_standard", requirement: "konditional" }
    ]
  },
  {
    slug: "bg_membership",
    title: "Mitgliedschaft in der Berufsgenossenschaft",
    short: "Nachweis gesetzlicher Unfallversicherung.",
    whoNeedsIt: "Unternehmen mit Beschäftigten (Pflicht gem. SGB VII).",
    whenRequired: "Pflicht, sobald Arbeitnehmer beschäftigt werden.",
    howToGet: [
      { label: "DGUV – Informationen", url: "https://www.dguv.de" },
      { label: "BG BAU – Zuständigkeit Bau", url: "https://www.bgbau.de" }
    ],
    validity: { type: "does_not_expire" },
    uploadTips: [
      "Mitgliedsbestätigung oder Kontoauszug Beitrag",
      "Name/BG erkennbar"
    ],
    packages: [
      { pkg: "bau_standard", requirement: "pflicht" },
      { pkg: "handwerk_basis", requirement: "konditional", note: "bei Beschäftigten" }
    ]
  },
  {
    slug: "health_fund_clearance",
    title: "Unbedenklichkeitsbescheinigung der Krankenkasse (Sozialversicherung)",
    short: "Bestätigt ordnungsgemäße Abführung von Beiträgen.",
    whoNeedsIt: "Arbeitgeber mit Beschäftigten.",
    whenRequired: "Pflicht je nach Auftraggeber, üblich im Bauumfeld.",
    howToGet: [
      { label: "Ihre Krankenkasse (Arbeitgeberservice)", url: "https://www.gkv-spitzenverband.de" }
    ],
    validity: { type: "fixed", defaultMonths: 12 },
    uploadTips: [
      "Aktuelle Bescheinigung anfordern (Datum prüfen)"
    ],
    packages: [
      { pkg: "bau_standard", requirement: "konditional", note: "bei Beschäftigten" }
    ]
  },
  {
    slug: "soka_bau",
    title: "SOKA-BAU – Sozialkassenverfahren Bau",
    short: "Nachweis der Teilnahme/Unbedenklichkeit bei Bautätigkeit.",
    whoNeedsIt: "Bauunternehmen mit meldepflichtigen Tätigkeiten.",
    whenRequired: "Pflicht, wenn Tätigkeiten unter SOKA-BAU fallen.",
    howToGet: [
      { label: "SOKA-BAU – Informationen", url: "https://www.soka-bau.de" }
    ],
    validity: { type: "fixed", defaultMonths: 12 },
    uploadTips: [
      "Unbedenklichkeitsbescheinigung als PDF hochladen"
    ],
    packages: [
      { pkg: "bau_standard", requirement: "konditional" }
    ]
  },
  {
    slug: "a1_certificate",
    title: "A1-Bescheinigung (bei Entsendung ins Ausland)",
    short: "Weist anwendbares Sozialversicherungsrecht nach (EU/EWR/CH).",
    whoNeedsIt: "Bei vorübergehender Tätigkeit von Mitarbeitenden im Ausland.",
    whenRequired: "Pflicht bei Entsendung.",
    howToGet: [
      { label: "DVKA – A1 Bescheinigung", url: "https://www.dvka.de" }
    ],
    validity: { type: "fixed", defaultMonths: 6, note: "je Einsatz/Zeitraum" },
    uploadTips: [
      "Pro Einsatzzeitraum eigener Antrag/Scan"
    ],
    packages: [
      { pkg: "ausland_plus", requirement: "pflicht" }
    ]
  },
  {
    slug: "dpa_gdpr",
    title: "Auftragsverarbeitungsvertrag (AVV, Art. 28 DSGVO)",
    short: "Regelt die Datenverarbeitung im Auftrag (z. B. mit Subunternehmern).",
    whoNeedsIt: "Wenn personenbezogene Daten im Auftrag verarbeitet werden.",
    whenRequired: "Pflicht bei Auftragsverarbeitung i. S. d. DSGVO.",
    howToGet: [
      { label: "BfDI – Auftragsverarbeitung", url: "https://www.bfdi.bund.de" }
    ],
    validity: { type: "does_not_expire", note: "gilt bis Änderung/Kündigung" },
    uploadTips: [
      "Vollständiger, unterschriebener Vertrag, Seiten zusammenführen"
    ],
    legalRefs: [
      { label: "Art. 28 DSGVO (EUR-Lex)", url: "https://eur-lex.europa.eu" }
    ],
    packages: [
      { pkg: "handwerk_basis", requirement: "konditional", note: "wenn personenbezogene Daten im Auftrag" }
    ]
  },
  {
    slug: "safety_instruction",
    title: "Sicherheitsunterweisung (jährlich)",
    short: "Nachweis, dass Mitarbeitende zu Arbeitssicherheit unterwiesen wurden.",
    whoNeedsIt: "Arbeitgeber mit Beschäftigten; besonders auf Baustellen.",
    whenRequired: "Pflicht aus Arbeitsschutzrecht/DGUV-Vorschriften.",
    howToGet: [
      { label: "DGUV – Vorschrift/Regelwerk", url: "https://www.dguv.de" }
    ],
    validity: { type: "fixed", defaultMonths: 12 },
    uploadTips: [
      "Letzte Unterweisungsliste (Datum/Unterschriften)"
    ],
    legalRefs: [
      { label: "DGUV Vorschrift 1 / Regel 100-001", url: "https://www.dguv.de" }
    ],
    packages: [
      { pkg: "bau_standard", requirement: "konditional", note: "bei Beschäftigten" }
    ]
  }
];

// UI-Mapping für Gültigkeitstexte
export function getValidityText(validity: DocInfo['validity']): string {
  switch (validity.type) {
    case "fixed":
      return `Gültig bis: Praxis-Richtwert ${validity.defaultMonths} Monate. Wenn das genaue Datum fehlt, erinnert subfix rechtzeitig.`;
    case "does_not_expire":
      return "Läuft nicht ab. Bitte bei Änderungen neu hochladen.";
    case "unknown_ok":
      return "Gültigkeit kann zunächst unbekannt sein. Wir setzen praxisnahe Defaults und erinnern bei Bedarf.";
    default:
      return "Gültigkeit wird individuell geprüft.";
  }
}

// Package-Namen für UI
export const PACKAGE_NAMES = {
  handwerk_basis: "Handwerk – Basis",
  bau_standard: "Bau – Standard", 
  ausland_plus: "Einsatz im Ausland – Plus"
} as const;

// Requirement-Labels für UI
export const REQUIREMENT_LABELS = {
  pflicht: "Pflicht",
  optional: "Optional",
  konditional: "Konditional"
} as const;