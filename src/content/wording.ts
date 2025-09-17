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
  pitchSubline: "Nachunternehmer (Subunternehmer) per Link einladen. Die App fordert ausschließlich Pflichtnachweise an, erinnert automatisch und zeigt klar, was fehlt – einfach, zeitsparend und rechtssicher.",
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
    monthlyAuto: "Monatliche Pflichten werden automatisch angefordert und erinnert."
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
  },
  
  // Legacy package wizard properties for backward compatibility
  packageWizard: {
    de: 'Dokumentenpaket wählen',
    en: 'Choose Document Package'
  },
  selectPackage: {
    de: 'Paket auswählen',
    en: 'Select Package'
  },
  customizeDocuments: {
    de: 'Dokumente anpassen',
    en: 'Customize Documents'
  },
  invitationSummary: {
    de: 'Zusammenfassung',
    en: 'Summary'
  },
  sendInvitation: {
    de: 'Einladung senden',
    en: 'Send Invitation'
  },
  fullControl: {
    de: 'Wählen Sie ein vorkonfiguriertes Paket oder passen Sie es individuell an',
    en: 'Choose a pre-configured package or customize it individually'
  },
  documentRequired: {
    de: 'Pflicht',
    en: 'Required'
  },
  documentOptional: {
    de: 'Optional',
    en: 'Optional'
  },
  requiredDocuments: {
    de: 'Pflichtdokumente',
    en: 'Required Documents'
  },
  optionalDocuments: {
    de: 'Optionale Dokumente',
    en: 'Optional Documents'
  }
} as const;