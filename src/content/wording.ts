export const WORDING = {
  productName: "subfix",
  pitchOneLiner: "Nachunterlagen automatisch einsammeln – nur das, was wirklich Pflicht ist.",
  pitchSubline: "Nachunternehmer (Subunternehmer) per Link einladen. Die App fordert ausschließlich Pflichtnachweise an, erinnert automatisch und zeigt klar, was fehlt – einfach, zeitsparend und rechtssicher.",
  categoryLabel: "Nachweise-Manager für Nachunternehmer (Subunternehmer)",
  valuePillars: ["Einfachheit", "Zeitersparnis", "Rechtssicherheit", "Nur Pflichten"],
  
  // German/English i18n texts
  i18n: {
    de: {
      // Wizard texts
      uploadDocuments: "Nachweise hochladen für",
      onlyRequired: "Es werden ausschließlich Pflichtnachweise angefordert.",
      yourProgress: "Ihr Fortschritt",
      documentsUploaded: "Dokumente hochgeladen",
      completed: "Abgeschlossen",
      uploadNowButton: "Jetzt hochladen",
      finish: "Fertigstellen",
      
      // Upload process
      dragDropFiles: "Dateien hier ablegen oder klicken",
      fileSelected: "Datei ausgewählt",
      uploading: "Lade hoch...",
      uploadSuccess: "Upload erfolgreich",
      uploadError: "Upload fehlgeschlagen",
      
      // Validation
      checking: "Überprüfe Einladung...",
      invalidLink: "Ungültiger Link",
      invalidDescription: "Dieser Einladungslink ist ungültig oder abgelaufen.",
      contactSender: "Bitte wenden Sie sich an den Absender für einen neuen Link.",
      toHomepage: "Zur Startseite",
      
      // Email subjects
      inviteSubject: "Bitte Nachweise bereitstellen",
      approvalSubject: "Nachweis genehmigt",
      rejectionSubject: "Nachweis abgelehnt - Nachbesserung erforderlich",
      reminderSubject: "Erinnerung: Nachweise noch ausstehend",
      
      // Review actions
      startReview: "Prüfung starten",
      reviewStarted: "Prüfung gestartet",
      approved: "Genehmigt",
      rejected: "Abgelehnt",
      escalated: "Eskaliert"
    },
    en: {
      // Wizard texts
      uploadDocuments: "Upload documents for",
      onlyRequired: "Only required documents are requested.",
      yourProgress: "Your Progress",
      documentsUploaded: "documents uploaded",
      completed: "Completed",
      uploadNowButton: "Upload now",
      finish: "Finish",
      
      // Upload process
      dragDropFiles: "Drop files here or click to browse",
      fileSelected: "File selected",
      uploading: "Uploading...",
      uploadSuccess: "Upload successful",
      uploadError: "Upload failed",
      
      // Validation
      checking: "Verifying invitation...",
      invalidLink: "Invalid Link",
      invalidDescription: "This invitation link is invalid or expired.",
      contactSender: "Please contact the sender for a new link.",
      toHomepage: "To Homepage",
      
      // Email subjects
      inviteSubject: "Please provide required documents",
      approvalSubject: "Document approved",
      rejectionSubject: "Document rejected - correction required",
      reminderSubject: "Reminder: Documents still pending",
      
      // Review actions
      startReview: "Start Review",
      reviewStarted: "Review started",
      approved: "Approved",
      rejected: "Rejected", 
      escalated: "Escalated"
    }
  },
  
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

// Helper function to get localized text
export const getText = (key: string, locale: 'de' | 'en' = 'de', fallback?: string): string => {
  const keys = key.split('.');
  let value: any = WORDING.i18n[locale];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || fallback || key;
};