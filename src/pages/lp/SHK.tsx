import { UseCasePage } from '@/components/UseCasePage';

export default function SHK() {
  return (
    <UseCasePage
      title="Pflichtnachweise für SHK-Unternehmen automatisch einsammeln"
      intro="Nur relevante Pflichtnachweise. Automatische Erinnerungen. Branchen-spezifisch optimiert."
      metaTitle="SHK Pflichtnachweise — automatisch einsammeln für SHK-Unternehmen"
      metaDescription="Pflichtnachweise für SHK-Unternehmen automatisch verwalten. Nur relevante Nachweise, automatische Erinnerungen, rechtssicher. 14 Tage kostenlos testen."
      
      steps={[
        {
          title: "Einladen",
          description: "SHK-Unternehmen per Link einladen"
        },
        {
          title: "Hochladen", 
          description: "Branchenspezifische Nachweise"
        },
        {
          title: "Erinnern",
          description: "Automatische Fristen-Kontrolle"
        },
        {
          title: "Prüfen",
          description: "Compliance-Status prüfen"
        }
      ]}
      
      benefits={[
        {
          title: "Zeitersparnis",
          description: "Speziell für SHK optimiert. Keine unnötigen Nachfragen, nur relevante Dokumente.",
          icon: "clock"
        },
        {
          title: "Branchen-Know-how",
          description: "Kennt SHK-spezifische Anforderungen: Fachkunde, Zertifikate, Versicherungen.",
          icon: "check"
        },
        {
          title: "Rechtssicherheit", 
          description: "Vollständige Dokumentation für Kunden- und Behördenprüfungen.",
          icon: "shield"
        }
      ]}
      
      screenshot="/public/screenshots/sub-profile.png"
      screenshotCaption="SHK-Nachweise im Überblick"
      
      faq={[
        {
          question: "Welche SHK-Nachweise werden abgefragt?",
          answer: "Nur die tatsächlich erforderlichen: Handwerksausweis, Fachkunde-Nachweise, Versicherungen, A1-Bescheinigungen."
        },
        {
          question: "Sind Zertifikate wie VdS erfasst?",
          answer: "Ja, branchen-spezifische Zertifikate und Qualifikationen werden automatisch überwacht."
        },
        {
          question: "Funktioniert das auch für kleinere SHK-Unternehmen?",
          answer: "Ja, der Starter-Plan ist speziell für kleinere Unternehmen mit wenigen Subunternehmern."
        },
        {
          question: "Was bei Arbeiten an Gasanlagen?",
          answer: "Spezielle DVGW-Nachweise und Zertifikate werden automatisch mit überwacht."
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