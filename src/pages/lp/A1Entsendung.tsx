import { UseCasePage } from '@/components/UseCasePage';

export default function A1Entsendung() {
  return (
    <UseCasePage
      title="A1 & Entsendung: Pflichtnachweise automatisch anfordern"
      intro="Nur relevante Pflichtnachweise. Automatische Erinnerungen. Export bei Bedarf."
      metaTitle="A1 & Entsendung — Pflichtnachweise automatisch anfordern"
      metaDescription="Beauftragte Firmen per Link einladen. Nur Pflichtnachweise anfordern, automatisch erinnern, bei Bedarf exportieren. 14 Tage kostenlos testen."
      
      steps={[
        {
          title: "Einladen",
          description: "Firma per Link oder QR-Code einladen"
        },
        {
          title: "Hochladen", 
          description: "A1-Bescheinigung mobil hochladen"
        },
        {
          title: "Erinnern",
          description: "Automatische Benachrichtigungen"
        },
        {
          title: "Prüfen",
          description: "Freigabe und Export für Kontrollen"
        }
      ]}
      
      benefits={[
        {
          title: "Zeitersparnis",
          description: "Keine manuellen Nachfragen mehr. Automatische Erinnerungen sparen Stunden pro Woche.",
          icon: "clock"
        },
        {
          title: "Klarheit",
          description: "Dashboard zeigt sofort: Was fehlt? Was läuft ab? Was ist gültig?",
          icon: "check"
        },
        {
          title: "Rechtssicherheit", 
          description: "Vollständige Dokumentation für Zoll- und Arbeitsschutzkontrollen.",
          icon: "shield"
        }
      ]}
      
      screenshot="/public/screenshots/sub-profile.png"
      screenshotCaption="Pflichtnachweise mit nächstem Schritt"
      
      faq={[
        {
          question: "Brauchen beauftragte Firmen eine App?",
          answer: "Nein, der Link genügt. Upload funktioniert direkt im Browser, auch mobil per Kamera."
        },
        {
          question: "Was passiert, wenn niemand reagiert?",
          answer: "subfix erinnert automatisch und eskaliert nach festgelegten Intervallen."
        },
        {
          question: "Sind alle A1-Varianten abgedeckt?",
          answer: "Ja, sowohl deutsche A1-Bescheinigungen als auch ausländische Entsendebescheinigungen."
        },
        {
          question: "Kann ich die Nachweise exportieren?",
          answer: "Ja, jederzeit als PDF-Übersicht oder einzelne Dokumente für Kontrollen."
        }
      ]}
      
      ctas={[
        {
          label: "14 Tage kostenlos testen",
          href: "/register",
          variant: "primary"
        },
        {
          label: "Live-Demo ansehen",
          href: "/public-demo", 
          variant: "outline"
        }
      ]}
    />
  );
}