import { UseCasePage } from '@/components/UseCasePage';

export default function Freistellungsbescheinigung() {
  return (
    <UseCasePage
      title="§ 48b Freistellungsbescheinigung: immer gültig im Blick"
      intro="Nur relevante Pflichtnachweise. Automatische Frist-Überwachung. Export bei Kontrollen."
      metaTitle="§ 48b Freistellungsbescheinigung — immer gültig im Blick"
      metaDescription="Freistellungsbescheinigungen automatisch überwachen. Nur Pflichtnachweise, rechtzeitige Erinnerungen, keine abgelaufenen Bescheinigungen. 14 Tage kostenlos testen."
      
      steps={[
        {
          title: "Einladen",
          description: "Subunternehmer per Link einladen"
        },
        {
          title: "Hochladen", 
          description: "§ 48b Bescheinigungen hochladen"
        },
        {
          title: "Erinnern",
          description: "Vor Ablauf automatisch warnen"
        },
        {
          title: "Prüfen",
          description: "Gültigkeit kontrollieren"
        }
      ]}
      
      benefits={[
        {
          title: "Zeitersparnis",
          description: "Keine manuellen Fristen-Kontrollen. Automatische Überwachung aller Bescheinigungen.",
          icon: "clock"
        },
        {
          title: "Klarheit",
          description: "Dashboard zeigt sofort: Welche Bescheinigungen laufen wann ab?",
          icon: "check"
        },
        {
          title: "Rechtssicherheit", 
          description: "Keine abgelaufenen Freistellungen mehr. Vollständige Kontrolldokumentation.",
          icon: "shield"
        }
      ]}
      
      screenshot="/public/screenshots/sub-profile.png"
      screenshotCaption="Freistellungsbescheinigungen im Überblick"
      
      faq={[
        {
          question: "Werden alle Freistellungsarten erkannt?",
          answer: "Ja, sowohl befristete als auch unbefristete Freistellungsbescheinigungen werden korrekt verwaltet."
        },
        {
          question: "Wie früh wird vor Ablauf gewarnt?",
          answer: "Automatische Erinnerungen 30, 14 und 7 Tage vor Ablauf. Intervalle sind anpassbar."
        },
        {
          question: "Was bei fehlender Bescheinigung?",
          answer: "Sofortige Warnung im Dashboard. Automatische Erinnerung an den Subunternehmer."
        },
        {
          question: "Funktioniert das für alle Gewerke?",
          answer: "Ja, Freistellungsbescheinigungen werden gewerkeübergreifend überwacht."
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