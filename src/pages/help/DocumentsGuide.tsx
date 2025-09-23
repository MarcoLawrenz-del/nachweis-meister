// ============= Documents Help Guide =============
// Redesigned for better spacing, scanability, and user experience

import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShieldCheck, 
  FileCheck2, 
  Building2, 
  UserCheck, 
  FileUp, 
  SearchCheck, 
  CheckCircle2,
  Search,
  Filter,
  FileText,
  Clock,
  Shield,
  Users,
  HelpCircle
} from 'lucide-react';
import { DOCS, PACKAGE_NAMES, type DocInfo } from '@/config/docsCatalog';
import { Section } from '@/components/Section';
import { SubnavAnchors } from '@/components/SubnavAnchors';
import { DocRow } from '@/components/DocRow';

const navItems = [
  { id: 'warum', label: 'Warum' },
  { id: 'ablauf', label: 'Ablauf' },
  { id: 'dokumente', label: 'Dokumente' },
  { id: 'gueltigkeit', label: 'Gültigkeit' },
  { id: 'faq', label: 'FAQ' }
];

export default function DocumentsGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [openDocumentIndex, setOpenDocumentIndex] = useState<number | null>(null);

  // Filtered documents based on search and package filter
  const filteredDocs = useMemo(() => {
    return DOCS.filter(doc => {
      const matchesSearch = searchTerm === '' || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.whoNeedsIt.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPackage = selectedPackage === 'all' || 
        doc.packages.some(pkg => pkg.pkg === selectedPackage);

      return matchesSearch && matchesPackage;
    });
  }, [searchTerm, selectedPackage]);

  const handleCTAClick = (target: string) => {
    console.info('[analytics] docs-guide-cta', { target });
  };

  const handleDocumentToggle = (index: number) => {
    setOpenDocumentIndex(openDocumentIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Nachweise erklärt - Dokumente für Subunternehmer | subfix</title>
        <meta 
          name="description" 
          content="Welche Dokumente benötigen Subunternehmer? Freistellungsbescheinigung, Gewerbeanmeldung, Versicherungsnachweis - alles erklärt mit Download-Links und Upload-Tipps." 
        />
        <meta name="keywords" content="Nachweise, Dokumente, Subunternehmer, Freistellungsbescheinigung, Gewerbeanmeldung, Compliance" />
        <meta property="og:title" content="Nachweise für Subunternehmer - Dokumente erklärt" />
        <meta property="og:description" content="Übersichtliche Erklärung aller wichtigen Dokumente für Subunternehmer. Mit praktischen Tipps und offiziellen Quellen." />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="/hilfe/dokumente" />
      </Helmet>

      {/* Sticky Sub-Navigation */}
      <SubnavAnchors items={navItems} />

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-20">
        {/* Hero Section */}
        <Section className="text-center pt-8 md:pt-12 pb-6 md:pb-8">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
                Nachweise einfach erklärt
              </h1>
              <p className="text-base md:text-[17px] leading-7 text-muted-foreground">
                Welche Unterlagen wir anfordern und wie Sie sie schnell bereitstellen.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => handleCTAClick('documents-selection')}
              >
                <FileText className="mr-2 h-5 w-5" />
                Dokumente zusammenstellen
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => handleCTAClick('documents-overview')}
              >
                <Users className="mr-2 h-5 w-5" />
                Zur Dokumentenübersicht
              </Button>
            </div>
          </div>
        </Section>

        {/* Why Section */}
        <Section id="warum">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              Warum diese Nachweise?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Sicherheit & Haftung",
                description: "Versicherungsschutz und Haftungsklärung schützen alle Beteiligten."
              },
              {
                icon: FileCheck2,
                title: "Gesetzliche Pflichten", 
                description: "Steuer-, Sozialversicherungs- und Arbeitsschutzrecht erfordern Nachweise."
              },
              {
                icon: Building2,
                title: "Reibungslose Abrechnung",
                description: "Vollständige Unterlagen ermöglichen schnelle Freigaben und Zahlungen."
              }
            ].map((item, i) => (
              <Card key={i} className="text-center border-0 bg-muted/30">
                <CardContent className="p-5 md:p-6 space-y-3 md:space-y-4">
                  <item.icon className="h-6 w-6 mx-auto text-primary" />
                  <h3 className="text-lg md:text-xl font-medium">{item.title}</h3>
                  <p className="text-base md:text-[17px] leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Process Section */}
        <Section id="ablauf">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              So funktioniert's in subfix
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: UserCheck,
                title: "Nachweise auswählen",
                description: "Nur relevante Dokumente für Sie."
              },
              {
                icon: FileUp,
                title: "Upload per Link",
                description: "Einfacher Upload über sicheren Link."
              },
              {
                icon: SearchCheck,
                title: "Prüfung",
                description: "Experten prüfen und geben Feedback."
              },
              {
                icon: CheckCircle2,
                title: "Freigabe",
                description: "Rechtzeitige Erinnerungen vor Ablauf."
              }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="bg-primary/10 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2">{step.title}</h3>
                <p className="text-base md:text-[17px] leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Documents Section */}
        <Section id="dokumente">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold">
              Dokumente im Überblick
            </h2>
            <Badge variant="outline" className="text-xs px-3 py-1">
              {filteredDocs.length} Dokumente
            </Badge>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 md:mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Dokument suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="w-full sm:w-64">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Paket filtern" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="all">Alle Pakete</SelectItem>
                <SelectItem value="handwerk_basis">Handwerk – Basis</SelectItem>
                <SelectItem value="bau_standard">Bau – Standard</SelectItem>
                <SelectItem value="ausland_plus">Ausland – Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {filteredDocs.map((doc, index) => (
              <DocRow
                key={doc.slug}
                doc={doc}
                isOpen={openDocumentIndex === index}
                onToggle={() => handleDocumentToggle(index)}
              />
            ))}

            {filteredDocs.length === 0 && (
              <Card className="border border-border">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-base md:text-[17px] leading-7 text-muted-foreground">
                    Keine Dokumente gefunden. Versuchen Sie einen anderen Suchbegriff.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </Section>

        {/* Validity Section */}
        <Section id="gueltigkeit">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              Gültigkeit & Erinnerungen
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: HelpCircle,
                title: "Gültigkeit unbekannt",
                description: "Ist zunächst in Ordnung. Wir setzen praxisnahe Defaults."
              },
              {
                icon: Shield,
                title: "Admin kann korrigieren", 
                description: "Gültigkeitsdaten können jederzeit angepasst werden."
              },
              {
                icon: Clock,
                title: "Automatische Erinnerungen",
                description: "Rechtzeitige Benachrichtigungen vor Ablauf der Dokumente."
              }
            ].map((item, i) => (
              <Card key={i} className="border-0 bg-muted/30">
                <CardContent className="p-5 md:p-6 space-y-3 md:space-y-4">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg md:text-xl font-medium">{item.title}</h3>
                  <p className="text-base md:text-[17px] leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* FAQ Section */}
        <Section id="faq" className="pb-16 md:pb-20">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              Häufige Fragen
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  question: "Was passiert, wenn ein Dokument fehlt?",
                  answer: "Fehlende Dokumente werden automatisch nachgefordert. Sie erhalten eine E-Mail mit einem Upload-Link."
                },
                {
                  question: "Kann ich Dokumente später nachreichen?",
                  answer: "Ja, Sie können jederzeit über den Upload-Link weitere Dokumente hochladen oder bestehende aktualisieren."
                },
                {
                  question: "Wer prüft die Dokumente?",
                  answer: "Qualifizierte Experten prüfen alle eingereichten Dokumente auf Vollständigkeit und Gültigkeit."
                },
                {
                  question: "Wie sicher sind meine Daten?",
                  answer: "Alle Daten werden verschlüsselt übertragen und DSGVO-konform gespeichert. Zugriff nur für berechtigte Personen."
                },
                {
                  question: "Was kostet die Dokumentenprüfung?",
                  answer: "Die Kosten richten sich nach dem gewählten Paket. Details finden Sie in unserer Preisübersicht."
                },
                {
                  question: "Gibt es mobile Apps?",
                  answer: "Der Upload funktioniert über jeden modernen Browser. Eine spezielle App ist nicht erforderlich."
                }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-base font-medium text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base md:text-[17px] leading-7 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Section>
      </div>
    </div>
  );
}