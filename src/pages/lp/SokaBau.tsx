import { UseCasePage } from '@/components/UseCasePage';

export default function SokaBau() {
  return (
    <UseCasePage
      title="SOKA-BAU: Nachweise vollständig, ohne Nachlaufen"
      intro="Nur relevante Pflichtnachweise. Automatische Erinnerungen. Klarer Status."
      metaTitle="SOKA-BAU Nachweise — vollständig ohne Nachlaufen"
      metaDescription="SOKA-BAU Nachweise automatisch einsammeln. Nur Pflichtnachweise anfordern, automatisch erinnern, Status im Blick. 14 Tage kostenlos testen."
      
      steps={[
        {
          title: "Einladen",
          description: "Nachunternehmer per Link einladen"
        },
        {
          title: "Hochladen", 
          description: "SOKA-BAU Bescheinigungen hochladen"
        },
        {
          title: "Erinnern",
          description: "Automatische Frist-Erinnerungen"
        },
        {
          title: "Prüfen",
          description: "Vollständigkeit kontrollieren"
        }
      ]}
      
      benefits={[
        {
          title: "Zeitersparnis",
          description: "Kein manuelles Nachfragen nach SOKA-BAU Unterlagen mehr.",
          icon: "clock"
        },
        {
          title: "Klarheit",
          description: "Sofortiger Überblick: Welche Nachweise fehlen noch?",
          icon: "check"
        },
        {
          title: "Rechtssicherheit", 
          description: "Vollständige SOKA-BAU Dokumentation für alle Prüfungen.",
          icon: "shield"
        }
      ]}
      
      screenshot="/public/screenshots/sub-profile.png"
      screenshotCaption="SOKA-BAU Nachweise im Überblick"
      
      faq={[
        {
          question: "Welche SOKA-BAU Nachweise werden abgefragt?",
          answer: "Nur die tatsächlich erforderlichen: Bescheinigungen, Freistellungen und Nachweise je nach Gewerk."
        },
        {
          question: "Was, wenn Nachweise ablaufen?",
          answer: "Automatische Erinnerungen rechtzeitig vor Ablauf. Keine abgelaufenen Bescheinigungen mehr."
        },
        {
          question: "Funktioniert das auch mobil?",
          answer: "Ja, Upload per Smartphone-Kamera direkt auf der Baustelle möglich."
        },
        {
          question: "Wie erkenne ich fehlende Nachweise?",
          answer: "Dashboard zeigt klar: Was fehlt, was läuft ab, was ist vollständig."
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