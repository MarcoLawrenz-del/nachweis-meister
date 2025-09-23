import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ShieldCheck, 
  FileCheck2, 
  Building2, 
  UserRound, 
  FileUp, 
  SearchCheck, 
  CheckCircle2,
  Search,
  Filter,
  ExternalLink,
  HelpCircle,
  FileText,
  Clock,
  Users,
  Shield
} from 'lucide-react';
import { DOCS, getValidityText, PACKAGE_NAMES, REQUIREMENT_LABELS, type DocInfo } from '@/config/docsCatalog';

export default function DocumentsGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');

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

  const getRequirementBadge = (requirement: string, note?: string) => {
    const variants = {
      pflicht: 'destructive',
      optional: 'secondary', 
      konditional: 'outline'
    } as const;

    const variant = variants[requirement as keyof typeof variants] || 'secondary';
    const label = REQUIREMENT_LABELS[requirement as keyof typeof REQUIREMENT_LABELS] || requirement;

    return (
      <Badge variant={variant} className="text-xs">
        {label}{note && ` (${note})`}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Nachweise einfach erklärt</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Welche Unterlagen wir anfordern, wozu sie dienen und wie Sie sie schnell bereitstellen.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => handleCTAClick('documents-selection')}
            className="px-8"
          >
            <FileText className="mr-2 h-5 w-5" />
            Dokumente zusammenstellen
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => handleCTAClick('documents-overview')}
            className="px-8"
          >
            <Users className="mr-2 h-5 w-5" />
            Zur Dokumentenübersicht
          </Button>
        </div>
      </section>

      {/* Why Section */}
      <section className="mb-12" id="warum">
        <h2 className="text-3xl font-bold text-center mb-8">Warum diese Nachweise?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Sicherheit & Haftung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Versicherungsschutz und Haftungsklärung schützen alle Beteiligten vor finanziellen Risiken.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileCheck2 className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Gesetzliche Pflichten</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Steuer-, Sozialversicherungs- und Arbeitsschutzrecht erfordern bestimmte Nachweise.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Reibungslose Abrechnung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Vollständige Unterlagen ermöglichen schnelle Freigaben und pünktliche Zahlungen.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Process Section */}
      <section className="mb-12" id="prozess">
        <h2 className="text-3xl font-bold text-center mb-8">So funktioniert's in subfix</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <UserRound className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">1. Nachweise auswählen</h3>
            <p className="text-sm text-muted-foreground">
              Wir zeigen nur die für Sie relevanten Dokumente basierend auf Ihrer Tätigkeit.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">2. Upload per Link/Kamera</h3>
            <p className="text-sm text-muted-foreground">
              Einfacher Upload über sicheren Link oder direkt per Smartphone-Kamera.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <SearchCheck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">3. Prüfung/Feedback</h3>
            <p className="text-sm text-muted-foreground">
              Unsere Experten prüfen die Unterlagen und geben bei Bedarf konstruktives Feedback.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">4. Freigabe & Erinnerungen</h3>
            <p className="text-sm text-muted-foreground">
              Nach erfolgreicher Prüfung erhalten Sie rechtzeitige Erinnerungen vor Ablauf.
            </p>
          </div>
        </div>
      </section>

      {/* Documents Overview Section */}
      <section className="mb-12" id="dokumente">
        <h2 className="text-3xl font-bold mb-8">Dokumente im Überblick</h2>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            <SelectContent>
              <SelectItem value="all">Alle Pakete</SelectItem>
              <SelectItem value="handwerk_basis">Handwerk – Basis</SelectItem>
              <SelectItem value="bau_standard">Bau – Standard</SelectItem>
              <SelectItem value="ausland_plus">Einsatz im Ausland – Plus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table/Accordion */}
        <div className="border rounded-lg overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4 p-4 bg-muted/50 border-b">
            <div className="font-semibold">Dokument</div>
            <div className="font-semibold">Wer braucht's?</div>
            <div className="font-semibold">Gültigkeit</div>
            <div className="font-semibold">Pakete</div>
          </div>

          {/* Documents */}
          <Accordion type="multiple" className="w-full">
            {filteredDocs.map((doc, index) => (
              <AccordionItem key={doc.slug} value={doc.slug} className="border-b last:border-b-0">
                <AccordionTrigger className="p-4 hover:bg-muted/30">
                  {/* Mobile/Tablet Layout */}
                  <div className="lg:hidden flex flex-col items-start text-left w-full">
                    <div className="font-semibold text-base mb-2">{doc.title}</div>
                    <div className="text-sm text-muted-foreground mb-2">{doc.short}</div>
                    <div className="flex flex-wrap gap-1">
                      {doc.packages.map((pkg, i) => (
                        <div key={i} className="text-xs">
                          <Badge variant="outline" className="mr-1">
                            {PACKAGE_NAMES[pkg.pkg]}
                          </Badge>
                          {getRequirementBadge(pkg.requirement, pkg.note)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-4 gap-4 w-full text-left">
                    <div>
                      <div className="font-semibold">{doc.title}</div>
                      <div className="text-sm text-muted-foreground">{doc.short}</div>
                    </div>
                    <div className="text-sm">{doc.whoNeedsIt}</div>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getValidityText(doc.validity)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {doc.packages.map((pkg, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {PACKAGE_NAMES[pkg.pkg]}
                          </Badge>
                          {getRequirementBadge(pkg.requirement, pkg.note)}
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="p-4 pt-0">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Wann Pflicht?
                      </h4>
                      <p className="text-sm mb-4">{doc.whenRequired}</p>

                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        So erhalten Sie den Nachweis
                      </h4>
                      <ul className="space-y-1 mb-4">
                        {doc.howToGet.map((source, i) => (
                          <li key={i}>
                            <a 
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                              onClick={() => console.info('[analytics] docs-guide-external-link', { doc: doc.slug, url: source.url })}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {source.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileUp className="h-4 w-4" />
                        Tipps für den Upload
                      </h4>
                      <ul className="text-sm space-y-1 mb-4 list-disc list-inside">
                        {doc.uploadTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>

                      {doc.legalRefs && doc.legalRefs.length > 0 && (
                        <>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Rechtsgrundlagen
                          </h4>
                          <ul className="space-y-1">
                            {doc.legalRefs.map((ref, i) => (
                              <li key={i}>
                                <a 
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                  onClick={() => console.info('[analytics] docs-guide-legal-ref', { doc: doc.slug, url: ref.url })}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {ref.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredDocs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>Keine Dokumente gefunden. Versuchen Sie einen anderen Suchbegriff oder Filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* Validity & Reminders Section */}
      <section className="mb-12" id="gueltigkeit">
        <h2 className="text-3xl font-bold mb-6">Gültigkeit & Erinnerungen</h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Unsere Gültigkeits-Logik
                </h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li><strong>„Gültigkeit unbekannt"</strong> ist zulässig – Sie können es so wählen</li>
                  <li>Wir setzen praxistaugliche Defaults basierend auf üblichen Laufzeiten</li>
                  <li>Admins können Gültigkeitsdaten jederzeit korrigieren oder überschreiben</li>
                  <li>Automatische Erinnerungen erfolgen rechtzeitig vor Ablauf</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Datenschutz (Kurz-Info)
                </h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li><strong>Zweckbindung:</strong> Daten nur für Compliance-Prüfung</li>
                  <li><strong>Zugriff:</strong> Nur für beteiligte Projektpartner</li>
                  <li><strong>DSGVO-AVV:</strong> Auftragsverarbeitungsvertrag vorhanden</li>
                  <li><strong>Speicherung:</strong> Nach legitimen Geschäftsinteressen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="mb-12" id="faq">
        <h2 className="text-3xl font-bold mb-6">Häufige Fragen</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="faq-1">
            <AccordionTrigger>Ich finde die Freistellungsbescheinigung nicht – was tun?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Die Freistellungsbescheinigung erhalten Sie beim Bundeszentralamt für Steuern (BZSt). Falls Sie noch keine haben:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Beantragen Sie diese online über das BZSt-Portal</li>
                <li>Als Alternative können Sie zunächst eine „Bescheinigung in Steuersachen" vom örtlichen Finanzamt vorlegen</li>
                <li>Wir helfen gerne bei der korrekten Zuordnung</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger>Welche Dateiformate werden akzeptiert?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Wir akzeptieren gängige Formate:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>PDF:</strong> Bevorzugt für offizielle Dokumente</li>
                <li><strong>Bilder:</strong> JPG, PNG (z.B. Smartphone-Fotos)</li>
                <li><strong>Maximale Dateigröße:</strong> 10 MB pro Datei</li>
                <li><strong>Tipp:</strong> Mehrere Seiten am besten als eine PDF-Datei zusammenfassen</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger>Was ist, wenn der Auszug nur per Post kommt?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Kein Problem! Sie haben mehrere Optionen:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Scannen oder fotografieren Sie das Dokument nach Erhalt</li>
                <li>Laden Sie es über den Upload-Link oder direkt in der App hoch</li>
                <li>Bei Zeitdruck: Informieren Sie uns vorab, damit wir den Termin entsprechend planen</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4">
            <AccordionTrigger>Wie sicher sind meine Dokumente bei subfix?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Ihre Daten sind bei uns sicher:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Verschlüsselung:</strong> Alle Uploads sind SSL-verschlüsselt</li>
                <li><strong>Zugriff:</strong> Nur autorisierte Projektbeteiligte können Ihre Dokumente einsehen</li>
                <li><strong>Speicherort:</strong> Deutsche/EU-Server mit DSGVO-Compliance</li>
                <li><strong>Löschung:</strong> Dokumente werden nach Projektende ordnungsgemäß gelöscht</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-5">
            <AccordionTrigger>Kann ich Dokumente nachträglich austauschen?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Ja, das ist jederzeit möglich:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Loggen Sie sich in Ihr Profil ein oder nutzen Sie den Upload-Link</li>
                <li>Wählen Sie das entsprechende Dokument aus und laden Sie die neue Version hoch</li>
                <li>Die alte Version wird automatisch ersetzt</li>
                <li>Bei Fragen wenden Sie sich gerne an den Projektverantwortlichen</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-6">
            <AccordionTrigger>Warum brauche ich als Einzelunternehmer eine BG-Mitgliedschaft?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Die BG-Mitgliedschaft hängt von Ihrer Situation ab:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Mit Mitarbeitern:</strong> Gesetzliche Pflicht zur Unfallversicherung</li>
                <li><strong>Ohne Mitarbeiter:</strong> Meist nicht erforderlich, außer in bestimmten Gewerken</li>
                <li><strong>Baustellen:</strong> Oft vom Bauherrn oder Generalunternehmer gefordert</li>
                <li><strong>Unser System:</strong> Zeigt nur die für Sie relevanten Anforderungen an</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Footer CTA */}
      <section className="text-center bg-muted/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Bereit für den nächsten Schritt?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Nutzen Sie unser System, um Ihre Dokumente systematisch zusammenzustellen und hochzuladen.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => handleCTAClick('footer-documents-selection')}
            className="px-8"
          >
            <FileText className="mr-2 h-5 w-5" />
            Dokumente zusammenstellen
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            disabled
            title="Upload-Link kommt per E-Mail"
            className="px-8"
          >
            <FileUp className="mr-2 h-5 w-5" />
            Unterlagen hochladen
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Upload-Links erhalten Sie direkt per E-Mail vom Projektverantwortlichen.
        </p>
      </section>
    </div>
  );
}