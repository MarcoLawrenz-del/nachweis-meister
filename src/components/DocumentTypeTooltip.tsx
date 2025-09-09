import { HelpCircle, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface DocumentTypeTooltipProps {
  code: string;
  className?: string;
}

// Document type help content with external links
const DOCUMENT_HELP: Record<string, {
  title: string;
  description: string;
  tips: string[];
  links?: { label: string; url: string }[];
}> = {
  A1_BESCHEINIGUNG: {
    title: 'A1-Bescheinigung',
    description: 'Nachweis über die Sozialversicherung bei Entsendung von Arbeitnehmern',
    tips: [
      'Muss vor Arbeitsbeginn beantragt werden',
      'Gültigkeitsdauer beachten',
      'Original oder beglaubigte Kopie erforderlich'
    ],
    links: [
      { label: 'A1-Bescheinigung beantragen (DRV)', url: 'https://www.deutsche-rentenversicherung.de/DRV/DE/Experten/Arbeitgeber-und-Steuerberater/Arbeitgeber/Meldungen-und-Beitraege/Entsendung/entsendung_node.html' }
    ]
  },
  GZD_MELDUNG: {
    title: 'GZD-Meldung',
    description: 'Meldung bei der Generalzolldirektion für entsandte Arbeitnehmer',
    tips: [
      'Spätestens bei Arbeitsbeginn erforderlich',
      'Online über ELAN-K2 Portal',
      'Bestätigung ausdrucken und aufbewahren'
    ],
    links: [
      { label: 'ELAN-K2 Portal', url: 'https://www.zoll.de/DE/Fachthemen/Arbeitsrecht/Mindestlohn/Meldeverfahren/meldeverfahren_node.html' }
    ]
  },
  AUFENTHALTSERLAUBNIS: {
    title: 'Aufenthalts-/Arbeitserlaubnis',
    description: 'Nachweis der Berechtigung zur Ausübung einer Erwerbstätigkeit',
    tips: [
      'Für Nicht-EU-Bürger erforderlich',
      'Gültigkeitsdauer prüfen',
      'Arbeitserlaubnis-Vermerk beachten'
    ],
    links: [
      { label: 'Ausländerrecht Info (BAMF)', url: 'https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/integrationskurse-node.html' }
    ]
  },
  MINDESTLOHN_ERKLAERUNG: {
    title: 'Mindestlohnerklärung',
    description: 'Monatliche Erklärung zur Einhaltung des Mindestlohns',
    tips: [
      'Jeden Monat bis zum 15. des Folgemonats',
      'Alle Arbeitnehmer aufführen',
      'Stunden und Löhne detailliert angeben'
    ]
  },
  GEWERBESCHEIN: {
    title: 'Gewerbeschein',
    description: 'Berechtigung zur Ausübung eines Gewerbes',
    tips: [
      'Aktueller Gewerbeschein erforderlich',
      'Bei Änderungen neu beantragen',
      'Tätigkeitsbeschreibung muss passen'
    ]
  },
  HANDWERKSROLLE: {
    title: 'Handwerksrolle / IHK-Mitgliedschaft',
    description: 'Eintragung in die Handwerksrolle oder IHK-Mitgliedschaft',
    tips: [
      'Je nach Tätigkeit erforderlich',
      'Eintragungsbestätigung vorlegen',
      'Bei Änderungen aktualisieren'
    ]
  },
  FREISTELLUNGSBESCHEINIGUNG: {
    title: 'Freistellungsbescheinigung § 48b EStG',
    description: 'Bescheinigung über Freistellung von der Bausozialabgabe',
    tips: [
      'Für Bautätigkeiten erforderlich',
      'Jährlich neu beantragen',
      'Bei SOKA-BAU oder zuständiger Kasse'
    ]
  },
  BETRIEBSHAFTPFLICHT: {
    title: 'Betriebshaftpflichtversicherung',
    description: 'Nachweis über ausreichenden Versicherungsschutz',
    tips: [
      'Mindestdeckungssumme beachten',
      'Gültigkeitsdauer prüfen',
      'Tätigkeitsbereich muss abgedeckt sein'
    ]
  },
  MITARBEITERLISTE: {
    title: 'Mitarbeiterliste mit Ausweisabgleich',
    description: 'Vollständige Liste aller eingesetzten Mitarbeiter',
    tips: [
      'Alle Mitarbeiter aufführen',
      'Ausweiskopien beifügen',
      'Bei Änderungen aktualisieren'
    ]
  }
};

export function DocumentTypeTooltip({ code, className }: DocumentTypeTooltipProps) {
  const help = DOCUMENT_HELP[code];
  
  if (!help) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-4 w-4 ${className}`}>
              <HelpCircle className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Keine Hilfe verfügbar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={`h-4 w-4 text-muted-foreground hover:text-primary ${className}`}>
            <HelpCircle className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm">{help.title}</h4>
              <p className="text-xs text-muted-foreground">{help.description}</p>
            </div>
            
            {help.tips.length > 0 && (
              <div>
                <h5 className="font-medium text-xs mb-1">Wichtige Hinweise:</h5>
                <ul className="text-xs space-y-1">
                  {help.tips.map((tip, idx) => (
                    <li key={idx} className="text-muted-foreground">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {help.links && help.links.length > 0 && (
              <div className="space-y-1">
                <h5 className="font-medium text-xs">Weitere Informationen:</h5>
                {help.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}