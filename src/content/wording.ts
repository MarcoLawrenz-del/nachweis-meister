export const WORDING = {
  productName: "subfix",
  pitchOneLiner: "Nachunterlagen automatisch einsammeln – nur das, was wirklich Pflicht ist.",
  pitchSubline: "Nachunternehmer (Subunternehmer) per Link einladen. Die App fordert ausschließlich Pflichtnachweise an, erinnert automatisch und zeigt klar, was fehlt – einfach, zeitsparend und rechtssicher.",
  categoryLabel: "Nachweise-Manager für Nachunternehmer (Subunternehmer)",
  valuePillars: ["Einfachheit", "Zeitersparnis", "Rechtssicherheit", "Nur Pflichten"],
  terms: {
    subcontractor: "Nachunternehmer (Subunternehmer)",
    requiredDoc: "Pflichtnachweis",
    engagement: "Engagement",
    inReview: "In Prüfung",
    validUntil: "Gültig bis",
    escalation: "Eskalation",
    statusGreen: "Vollständig",
    statusYellow: "Läuft bald ab",
    statusRed: "Fehlt/abgelaufen"
  },
  cta: {
    invite: "Einladen",
    upload: "Hochladen",
    review: "Prüfen",
    remind: "Erinnern",
    pause: "Pausieren",
    resume: "Fortsetzen",
    stop: "Stopp",
    viewDemo: "Live-Demo ansehen",
    startTrial: "14 Tage kostenlos testen"
  },
  trialBanner: "Testphase: 14 Tage verbleibend. Aktivieren Sie jetzt Ihren Plan, um nahtlos weiterzuarbeiten.",
  empty: {
    noDuties: "Für diesen Nachunternehmer (Subunternehmer) sind aktuell keine Pflichtnachweise erforderlich.",
    noInReview: "Keine Nachweise im Status \"In Prüfung\"."
  },
  info: {
    onlyRequiredWarn: "Nur Pflichtnachweise werden angefordert und als fehlend gewarnt.",
    globalActive: "Engagements sind optional – die Nachweisprüfung läuft auch global.",
    monthlyAuto: "Monatliche Pflichten werden automatisch angefordert und erinnert."
  },
  email: {
    inviteSubject: "Bitte Nachweise bereitstellen",
    inviteBody: "Guten Tag {{name}},\nfür den Auftrag {{projekt}} benötigen wir folgende Pflichtnachweise: {{liste}}.\nBitte laden Sie diese unter {{link}} hoch. Vielen Dank – subfix."
  }
} as const;