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
  Shield,
  ArrowRight
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
      pflicht: 'dutyRequired',
      optional: 'dutyOptional', 
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
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-muted">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section - Kompakter */}
        <section className="text-center mb-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-semibold text-text mb-3">
              Nachweise einfach erklärt
            </h1>
            <p className="text-text-muted mb-6 leading-relaxed">
              Welche Unterlagen wir anfordern, wozu sie dienen und wie Sie sie schnell bereitstellen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => handleCTAClick('documents-selection')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Dokumente zusammenstellen
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleCTAClick('documents-overview')}
              >
                <Users className="mr-2 h-4 w-4" />
                Zur Dokumentenübersicht
              </Button>
            </div>
          </div>
        </section>

        {/* Why Section - Kompakter */}
        <section className="mb-8" id="warum">
          <h2 className="text-xl font-semibold text-center mb-6">Warum diese Nachweise?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="text-center border-0 bg-tint-blue-50">
              <CardContent className="p-4">
                <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-info-600" />
                <h3 className="font-medium mb-2">Sicherheit & Haftung</h3>
                <p className="text-sm text-text-muted">
                  Versicherungsschutz und Haftungsklärung schützen alle Beteiligten vor finanziellen Risiken.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-tint-sand-50">
              <CardContent className="p-4">
                <FileCheck2 className="h-8 w-8 mx-auto mb-3 text-warn-600" />
                <h3 className="font-medium mb-2">Gesetzliche Pflichten</h3>
                <p className="text-sm text-text-muted">
                  Steuer-, Sozialversicherungs- und Arbeitsschutzrecht erfordern bestimmte Nachweise.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-tint-mint-50">
              <CardContent className="p-4">
                <Building2 className="h-8 w-8 mx-auto mb-3 text-success-600" />
                <h3 className="font-medium mb-2">Reibungslose Abrechnung</h3>
                <p className="text-sm text-text-muted">
                  Vollständige Unterlagen ermöglichen schnelle Freigaben und pünktliche Zahlungen.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Process Section - Kompakter */}
        <section className="mb-8" id="prozess">
          <h2 className="text-xl font-semibold text-center mb-6">So funktioniert's in subfix</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: UserRound,
                title: "1. Nachweise auswählen",
                desc: "Wir zeigen nur die für Sie relevanten Dokumente."
              },
              {
                icon: FileUp,
                title: "2. Upload per Link",
                desc: "Einfacher Upload über sicheren Link oder App."
              },
              {
                icon: SearchCheck,
                title: "3. Prüfung",
                desc: "Experten prüfen und geben konstruktives Feedback."
              },
              {
                icon: CheckCircle2,
                title: "4. Freigabe",
                desc: "Rechtzeitige Erinnerungen vor Ablauf."
              }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="bg-brand-50 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <step.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-medium text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Documents Section - Überarbeitet */}
        <section className="mb-8" id="dokumente">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Dokumente im Überblick</h2>
            <Badge variant="outline" className="text-xs">
              {filteredDocs.length} Dokumente
            </Badge>
          </div>
          
          {/* Search and Filter - Kompakter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Dokument suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="w-full sm:w-56 h-9">
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

          {/* Documents List - Überarbeitet für bessere UX */}
          <div className="space-y-2">
            {filteredDocs.map((doc, index) => (
              <Card key={doc.slug} className="border border-border hover:shadow-sm transition-shadow">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value={doc.slug} className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-start justify-between w-full text-left">
                        <div className="flex-1 pr-4">
                          <h3 className="font-medium text-sm mb-1">{doc.title}</h3>
                          <p className="text-xs text-text-muted mb-2">{doc.short}</p>
                          <div className="flex flex-wrap gap-1">
                            {doc.packages.map((pkg, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs h-5 px-2">
                                  {PACKAGE_NAMES[pkg.pkg]}
                                </Badge>
                                {getRequirementBadge(pkg.requirement, pkg.note)}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {getValidityText(doc.validity)}
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4">
                      <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-info-600" />
                              Wann Pflicht?
                            </h4>
                            <p className="text-sm text-text-muted">{doc.whenRequired}</p>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <ExternalLink className="h-4 w-4 text-info-600" />
                              So erhalten Sie den Nachweis
                            </h4>
                            <div className="space-y-1">
                              {doc.howToGet.map((source, i) => (
                                <a 
                                  key={i}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
                                  onClick={() => console.info('[analytics] docs-guide-external-link', { doc: doc.slug, url: source.url })}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                  {source.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <FileUp className="h-4 w-4 text-success-600" />
                              Tipps für den Upload
                            </h4>
                            <ul className="text-sm space-y-1 text-text-muted">
                              {doc.uploadTips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-success-600 mt-1">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {doc.legalRefs && doc.legalRefs.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-warn-600" />
                                Rechtsgrundlagen
                              </h4>
                              <div className="space-y-1">
                                {doc.legalRefs.map((ref, i) => (
                                  <a 
                                    key={i}
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
                                    onClick={() => console.info('[analytics] docs-guide-legal-ref', { doc: doc.slug, url: ref.url })}
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                    {ref.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            ))}

            {filteredDocs.length === 0 && (
              <Card className="border border-border">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-text-muted" />
                  <p className="text-text-muted">Keine Dokumente gefunden. Versuchen Sie einen anderen Suchbegriff oder Filter.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Validity & Reminders Section - Kompakter */}
        <section className="mb-8" id="gueltigkeit">
          <h2 className="text-xl font-semibold mb-4">Gültigkeit & Erinnerungen</h2>
          <Card className="border-0 bg-surface-muted">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-info-600" />
                    Unsere Gültigkeits-Logik
                  </h3>
                  <ul className="text-sm space-y-2 text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-info-600 mt-1">•</span>
                      <span><strong>„Gültigkeit unbekannt"</strong> ist zulässig – Sie können es so wählen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-info-600 mt-1">•</span>
                      <span>Wir setzen praxistaugliche Defaults basierend auf üblichen Laufzeiten</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-info-600 mt-1">•</span>
                      <span>Admins können Gültigkeitsdaten jederzeit korrigieren</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-info-600 mt-1">•</span>
                      <span>Automatische Erinnerungen erfolgen rechtzeitig vor Ablauf</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-success-600" />
                    Datenschutz (Kurz-Info)
                  </h3>
                  <ul className="text-sm space-y-2 text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-success-600 mt-1">•</span>
                      <span><strong>Zweckbindung:</strong> Daten nur für Compliance-Prüfung</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success-600 mt-1">•</span>
                      <span><strong>Zugriff:</strong> Nur für beteiligte Projektpartner</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success-600 mt-1">•</span>
                      <span><strong>DSGVO-AVV:</strong> Auftragsverarbeitungsvertrag vorhanden</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success-600 mt-1">•</span>
                      <span><strong>Speicherung:</strong> Nach legitimen Geschäftsinteressen</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section - Kompakter */}
        <section className="mb-8" id="faq">
          <h2 className="text-xl font-semibold mb-4">Häufige Fragen</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="faq-1" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Ich finde die Freistellungsbescheinigung nicht – was tun?
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-sm text-text-muted">Die Freistellungsbescheinigung erhalten Sie beim Bundeszentralamt für Steuern (BZSt). Falls Sie noch keine haben:</p>
                <ul className="text-sm space-y-1 text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Beantragen Sie diese online über das BZSt-Portal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Als Alternative: „Bescheinigung in Steuersachen" vom örtlichen Finanzamt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Wir helfen gerne bei der korrekten Zuordnung</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Welche Dateiformate werden akzeptiert?
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-sm text-text-muted">Wir akzeptieren gängige Formate:</p>
                <ul className="text-sm space-y-1 text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>PDF:</strong> Bevorzugt für offizielle Dokumente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Bilder:</strong> JPG, PNG (z.B. Smartphone-Fotos)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Maximale Dateigröße:</strong> 10 MB pro Datei</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Tipp:</strong> Mehrere Seiten als eine PDF-Datei zusammenfassen</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Was ist, wenn der Auszug nur per Post kommt?
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-sm text-text-muted">Kein Problem! Sie haben mehrere Optionen:</p>
                <ul className="text-sm space-y-1 text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Scannen oder fotografieren Sie das Dokument nach Erhalt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Upload über den Upload-Link oder direkt in der App</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Bei Zeitdruck: Informieren Sie uns vorab</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Wie sicher sind meine Dokumente bei subfix?
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-sm text-text-muted">Ihre Daten sind bei uns sicher:</p>
                <ul className="text-sm space-y-1 text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Verschlüsselung:</strong> Alle Uploads sind SSL-verschlüsselt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>nur autorisierte Projektbeteiligte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Speicherort:</strong> Deutsche/EU-Server mit DSGVO-Compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Löschung:</strong> Dokumente werden nach Projektende gelöscht</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Kann ich Dokumente nachträglich austauschen?
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-sm text-text-muted">Ja, das ist jederzeit möglich:</p>
                <ul className="text-sm space-y-1 text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Loggen Sie sich in Ihr Profil ein oder nutzen Sie den Upload-Link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Wählen Sie das Dokument aus und laden Sie die neue Version hoch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Die alte Version wird automatisch ersetzt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Bei Fragen wenden Sie sich an den Projektverantwortlichen</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-6" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Warum brauche ich als Einzelunternehmer eine BG-Mitgliedschaft?
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-sm text-text-muted">Die BG-Mitgliedschaft hängt von Ihrer Situation ab:</p>
                <ul className="text-sm space-y-1 text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Mit Mitarbeitern:</strong> Gesetzliche Pflicht zur Unfallversicherung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Ohne Mitarbeiter:</strong> Meist nicht erforderlich, außer in bestimmten Gewerken</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Baustellen:</strong> Oft vom Bauherrn oder Generalunternehmer gefordert</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span><strong>Unser System:</strong> Zeigt nur die für Sie relevanten Anforderungen</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Footer CTA - Kompakter */}
        <section className="text-center bg-gradient-to-r from-brand-50 to-tint-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Bereit für den nächsten Schritt?</h2>
          <p className="text-text-muted mb-4 text-sm">
            Nutzen Sie unser System für eine systematische Dokumentenverwaltung.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => handleCTAClick('footer-documents-selection')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Dokumente zusammenstellen
            </Button>
            <Button 
              variant="outline"
              disabled
              title="Upload-Link kommt per E-Mail"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Unterlagen hochladen
            </Button>
          </div>
          
          <p className="text-xs text-text-muted mt-3">
            Upload-Links erhalten Sie direkt per E-Mail vom Projektverantwortlichen.
          </p>
        </section>
      </div>
    </div>
  );
}