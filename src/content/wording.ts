export const WORDING = {
  de: {
    package: {
      title: "Dokumentenpaket wählen",
      ctaOpen: "Dokumentenpaket wählen",
      ctaRequest: "Dokumente anfordern",
      required: "Pflichtdokumente",
      optional: "Optionale Dokumente",
      summaryTitle: "Zusammenfassung",
      summaryDesc: "Diese Dokumente werden angefordert:",
      sendInvites: "Einladungen senden",
      saved: "Anforderungen gespeichert",
    },
    documents: {
      emptyTitle: "Keine Dokumente angefordert",
      emptyDesc: "Wählen Sie ein Dokumentenpaket und fordern Sie Nachweise an.",
      ctaRequest: "Dokumente anfordern",
      type: "Nachweis",
      requiredLabel: "Pflicht/Optional",
      status: "Status",
      validUntil: "Gültig bis",
      action: "Aktion",
    },
    overview: {
      headerCta: "Dokumentenpaket wählen",
      missing: "Fehlend",
      expiring: "Läuft ab",
      inReview: "In Prüfung",
      valid: "Gültig",
      progress: "Compliance-Fortschritt",
      allGood: "Alles vollständig!",
      noRequirements: "Für diese Firma sind aktuell keine Pflichtnachweise erforderlich.",
    },
    settings: {
      advanced: "Erweitert (optional)",
    },
    common: {
      back: "Zurück",
      next: "Weiter",
      save: "Speichern",
      cancel: "Abbrechen",
    },
  },
  en: {
    package: {
      title: "Choose document package",
      ctaOpen: "Choose document package",
      ctaRequest: "Request documents",
      required: "Required documents",
      optional: "Optional documents",
      summaryTitle: "Summary",
      summaryDesc: "These documents will be requested:",
      sendInvites: "Send invitations",
      saved: "Requests saved",
    },
    documents: {
      emptyTitle: "No documents requested",
      emptyDesc: "Choose a package and request proofs.",
      ctaRequest: "Request documents",
      type: "Document",
      requiredLabel: "Required/Optional",
      status: "Status",
      validUntil: "Valid until",
      action: "Action",
    },
    overview: {
      headerCta: "Choose document package",
      missing: "Missing",
      expiring: "Expiring",
      inReview: "In review",
      valid: "Valid",
      progress: "Compliance progress",
      allGood: "All complete!",
      noRequirements: "No required proofs for this contractor at the moment.",
    },
    settings: {
      advanced: "Advanced (optional)",
    },
    common: {
      back: "Back",
      next: "Next",
      save: "Save",
      cancel: "Cancel",
    },
  },
  
  // Legacy properties for backward compatibility
  productName: "subfix",
  pitchOneLiner: "Nachunterlagen automatisch einsammeln – nur das, was wirklich Pflicht ist.",
  pitchSubline: "Nachunternehmer (Subunternehmer) per Link einladen. Die App fordert ausschließlich Pflichtnachweise an und zeigt klar, was fehlt – einfach, zeitsparend und rechtssicher.",
  categoryLabel: "Nachweise-Manager für Nachunternehmer (Subunternehmer)",
  valuePillars: ["Einfachheit", "Zeitersparnis", "Rechtssicherheit", "Nur Pflichten"],
  
  complianceStatus: {
    compliant: "Compliant",
    non_compliant: "Nicht Compliant",
    expiring_soon: "Läuft bald ab"
  },
  
  info: {
    onlyRequiredWarn: "Nur Pflichtnachweise werden angefordert und als fehlend gewarnt.",
    globalActive: "Engagements sind optional – die Nachweisprüfung läuft auch global.",
    monthlyAuto: "Monatliche Pflichten werden automatisch angefordert."
  },
  
  email: {
    inviteSubject: "Bitte Nachweise bereitstellen",
    inviteBody: "Guten Tag {{name}},\nfür den Auftrag {{projekt}} benötigen wir folgende Pflichtnachweise: {{liste}}.\nBitte laden Sie diese unter {{link}} hoch. Vielen Dank – subfix."
  },
  
  // Legacy terms for compatibility with existing code
  terms: {
    subcontractors: "Nachunternehmer",
    subcontractor: "Nachunternehmer", 
    projects: "Projekte",
    documents: "Dokumente",
    inReview: "In Prüfung",
    requiredDoc: "Pflichtdokument"
  },
  
  cta: {
    getStarted: "Jetzt starten",
    startTrial: "Kostenlos testen"
  }
} as const;