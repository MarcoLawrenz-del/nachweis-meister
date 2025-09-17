import { UseCasePage } from '@/components/UseCasePage';

export default function Elektro() {
  return (
    <UseCasePage
      title="Pflichtnachweise für Elektro-Unternehmen automatisch einsammeln"
      intro="Nur relevante Pflichtnachweise. Automatische Erinnerungen. Elektro-spezifisch optimiert."
      metaTitle="Elektro Pflichtnachweise — automatisch einsammeln für Elektro-Unternehmen"
      metaDescription="Pflichtnachweise für Elektro-Unternehmen automatisch verwalten. Nur relevante Nachweise, automatische Erinnerungen, rechtssicher. 14 Tage kostenlos testen."
      
      steps={[
        {
          title: "Einladen",
          description: "Elektro-Unternehmen per Link einladen"
        },
        {
          title: "Hochladen", 
          description: "Elektro-spezifische Nachweise"
        },
        {
          title: "Erinnern",
          description: "Automatische Qualifikations-Kontrolle"
        },
        {
          title: "Prüfen",
          description: "Elektro-Compliance prüfen"
        }
      ]}
      
      benefits={[
        {
          title: "Zeitersparnis",
          description: "Speziell für Elektro-Gewerk optimiert. Nur relevante Qualifikationen und Nachweise.",
          icon: "clock"
        },
        {
          title: "Fachkunde-Kontrolle",
          description: "Elektro-spezifische Qualifikationen: EFK, VDE-Normen, Meisterbriefe automatisch überwacht.",
          icon: "check"
        },
        {
          title: "Rechtssicherheit", 
          description: "Vollständige Dokumentation für VDE, Berufsgenossenschaft und Kundenprüfungen.",
          icon: "shield"
        }
      ]}
      
      screenshot="/public/screenshots/sub-profile.png"
      screenshotCaption="Elektro-Nachweise im Überblick"
      
      faq={[
        {
          question: "Welche Elektro-Nachweise werden überwacht?",
          answer: "Nur die erforderlichen: EFK-Nachweise, Meisterbriefe, VDE-Zertifikate, Versicherungen, A1-Bescheinigungen."
        },
        {
          question: "Sind VDE-Normen und -Schulungen erfasst?",
          answer: "Ja, alle elektro-relevanten Qualifikationen und wiederkehrenden Schulungen werden automatisch überwacht."
        },
        {
          question: "Was bei speziellen Arbeiten wie PV-Anlagen?",
          answer: "Spezielle Qualifikationen für PV, Blitzschutz etc. werden entsprechend dem Projektumfang abgefragt."
        },
        {
          question: "Funktioniert das auch für kleinere Elektro-Unternehmen?",
          answer: "Ja, der Starter-Plan ist ideal für kleinere Unternehmen mit wenigen Subunternehmern."
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