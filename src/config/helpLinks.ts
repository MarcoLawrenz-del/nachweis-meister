// Help Links Configuration for Document Types
export const helpLinks = {
  // A1 Bescheinigung
  A1: {
    title: "A1 Bescheinigung - Hilfe",
    content: "Die A1-Bescheinigung bestätigt, dass Sie weiterhin den Sozialversicherungsgesetzen Ihres Herkunftslandes unterliegen, wenn Sie vorübergehend in einem anderen EU-Land arbeiten.",
    url: "https://www.deutsche-verbindungsstelle-krankenversicherung-ausland.de/buerger/faq_a1"
  },
  
  // GZD Meldung
  GZD: {
    title: "GZD-Meldung - Hilfe", 
    content: "Die Meldung bei der Generalzolldirektion (GZD) ist für alle Dienstleister aus dem Ausland verpflichtend, die in Deutschland arbeiten möchten.",
    url: "https://www.zoll.de/DE/Fachthemen/Arbeit/Mindestlohn/Anmeldung-Dienstleistung/anmeldung-dienstleistung_node.html"
  },
  
  // Aufenthalts-/Arbeitserlaubnis
  RESIDENCE: {
    title: "Aufenthalts-/Arbeitserlaubnis - Hilfe",
    content: "Staatsangehörige aus Nicht-EU-Ländern benötigen eine Aufenthalts- und Arbeitserlaubnis für Deutschland. Diese wird von der zuständigen Ausländerbehörde ausgestellt.",
    url: "https://www.make-it-in-germany.com/de/visum-aufenthalt/arten/arbeit"
  },
  
  // Gewerbeschein
  BUSINESS_LICENSE: {
    title: "Gewerbeschein - Hilfe",
    content: "Der Gewerbeschein (Gewerbeanmeldung) ist für die meisten selbstständigen Tätigkeiten in Deutschland erforderlich und wird beim örtlichen Gewerbeamt beantragt.",
    url: "https://www.bundesregierung.de/breg-de/themen/buerokratieabbau/gewerbeanmeldung-384746"
  },
  
  // Handwerkerkarte
  CRAFTSMAN_CARD: {
    title: "Handwerkerkarte - Hilfe",
    content: "Die Handwerkerkarte berechtigt zur Ausübung handwerklicher Tätigkeiten und wird von der Handwerkskammer ausgestellt.",
    url: "https://www.hwk.de/"
  },
  
  // Default fallback
  DEFAULT: {
    title: "Dokumenten-Hilfe",
    content: "Bei Fragen zu den erforderlichen Dokumenten wenden Sie sich bitte an Ihren Projektverantwortlichen.",
    url: null
  }
} as const;

// Helper function to get help info by document type code
export const getHelpInfo = (documentTypeCode: string) => {
  const code = documentTypeCode.toUpperCase();
  
  if (code.includes('A1')) return helpLinks.A1;
  if (code.includes('GZD')) return helpLinks.GZD;
  if (code.includes('RESIDENCE') || code.includes('AUFENTHALT') || code.includes('ARBEITSERLAUBNIS')) return helpLinks.RESIDENCE;
  if (code.includes('GEWERBE') || code.includes('BUSINESS')) return helpLinks.BUSINESS_LICENSE;
  if (code.includes('HANDWERK') || code.includes('CRAFTSMAN')) return helpLinks.CRAFTSMAN_CARD;
  
  return helpLinks.DEFAULT;
};