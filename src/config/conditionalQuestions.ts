export type CondAnswer = "yes" | "no" | "unknown";

export interface ConditionalAnswers {
  hasEmployees?: CondAnswer;          // Q1
  doesConstructionWork?: CondAnswer;  // Q2
  sokaBauSubject?: CondAnswer;        // Q2a (nur sichtbar wenn Q2=yes)
  sendsAbroad?: CondAnswer;           // Q3
  processesPersonalData?: CondAnswer; // Q4
}

export interface ConditionalQuestion {
  id: keyof ConditionalAnswers;
  label: string;        // Frage (Kurzzeile)
  sublabel?: string;    // Unterzeile (grau)
  info?: string;        // Text für "i"-Tooltip
  options: Array<{ value: CondAnswer; label: string }>;
  visibleIf?: (a: ConditionalAnswers) => boolean; // für Q2a
}

export const CONDITIONAL_QUESTIONS: ConditionalQuestion[] = [
  {
    id: "hasEmployees",
    label: "Hat der Nachunternehmer Mitarbeitende?",
    sublabel: "Auch Minijob, Azubi oder Leiharbeit zählt – nicht nur der Inhaber.",
    info: "Mitarbeitende meint alle Personen außer der Inhaber*in: Voll-/Teilzeit, Minijob, Azubis, Praktikanten, Leiharbeit. Solo-Selbstständige ohne Personal → Nein.",
    options: [
      { value: "yes", label: "Ja" },
      { value: "no", label: "Nein" },
      { value: "unknown", label: "Weiß ich nicht" },
    ],
  },
  {
    id: "doesConstructionWork",
    label: "Arbeitet der Nachunternehmer auf Baustellen am Bau mit?",
    sublabel: "Beispiele: Maurer-/Trockenbau, Dach, Elektro, Sanitär/Heizung, Fenster/Türen, Montage, Abbruch.",
    info: "Bauleistungen sind Arbeiten am Bauwerk oder an baulichen Anlagen (Herstellung, Instandsetzung, Änderung, Beseitigung). Nur Lieferung ohne Montage ist keine Bauleistung.",
    options: [
      { value: "yes", label: "Ja" },
      { value: "no", label: "Nein" },
      { value: "unknown", label: "Weiß ich nicht" },
    ],
  },
  {
    id: "sokaBauSubject",
    label: "Fällt der Betrieb unter SOKA-BAU?",
    sublabel: "Gilt für überwiegend baugewerbliche Tätigkeiten.",
    info: "SOKA-BAU gilt, wenn der Betrieb überwiegend baugewerbliche Arbeiten ausführt (z. B. Roh-/Ausbau, Dach, Straßen-/Tiefbau). Unsicher? Weiß ich nicht – wir zeigen den Nachweis zunächst optional an.",
    options: [
      { value: "yes", label: "Ja" },
      { value: "no", label: "Nein" },
      { value: "unknown", label: "Weiß ich nicht" },
    ],
    visibleIf: (a) => a.doesConstructionWork === "yes",
  },
  {
    id: "sendsAbroad",
    label: "Werden Mitarbeitende vorübergehend im Ausland eingesetzt (EU/EWR/Schweiz)?",
    sublabel: "Kurzzeitige Einsätze/Montagen zählen auch. Reine Materiallieferung ohne Arbeit vor Ort: nein.",
    info: "Bei Entsendung von Mitarbeitenden ins EU/EWR/CH braucht es pro Einsatz eine A1-Bescheinigung. Dienstreise ohne Arbeit am Bau ist i. d. R. nicht betroffen.",
    options: [
      { value: "yes", label: "Ja" },
      { value: "no", label: "Nein" },
      { value: "unknown", label: "Weiß ich nicht" },
    ],
  },
  {
    id: "processesPersonalData",
    label: "Verarbeitet der Nachunternehmer personenbezogene Daten im Auftrag Ihres Unternehmens?",
    sublabel: "Beispiele: Kundendaten, Termine, Fotos von Wohnungen, Kontaktdaten von Mitarbeitenden.",
    info: "Wenn der Nachunternehmer Daten für Ihr Unternehmen verarbeitet (CRM, Rechnungen, Termin-/Service-Apps, Fotos beim Einsatz), braucht es einen Auftragsverarbeitungsvertrag (AVV). Reine Baustellenarbeit ohne Daten → meist nein.",
    options: [
      { value: "yes", label: "Ja" },
      { value: "no", label: "Nein" },
      { value: "unknown", label: "Weiß ich nicht" },
    ],
  },
];

// Standardantworten für neue Nachunternehmer
export const DEFAULT_CONDITIONAL_ANSWERS: ConditionalAnswers = {
  hasEmployees: undefined,
  doesConstructionWork: undefined,
  sokaBauSubject: undefined,
  sendsAbroad: undefined,
  processesPersonalData: undefined,
};