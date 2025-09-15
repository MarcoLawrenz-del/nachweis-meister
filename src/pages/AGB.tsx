import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, CreditCard, AlertTriangle } from 'lucide-react';

export default function AGB() {
  return (
    <>
      <Helmet>
        <title>AGB - subfix</title>
        <meta name="description" content="Allgemeine Geschäftsbedingungen für subfix - Nachunternehmer-Compliance Management" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Allgemeine Geschäftsbedingungen</h1>
            <p className="text-muted-foreground">
              Nutzungsbedingungen für die subfix Compliance-Management-Plattform
            </p>
          </div>

          <div className="space-y-6">
            {/* Anbieter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  § 1 Anbieter und Geltungsbereich
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen der 
                    OK Beteiligungsgesellschaft mbH, Lindauer Str. 4-5, 10781 Berlin (nachfolgend "Anbieter") 
                    und dem Nutzer der subfix-Plattform.
                  </p>
                  <p><strong>MUST_FILL:</strong> Vollständige rechtliche Formulierung des Geltungsbereichs</p>
                </div>
              </CardContent>
            </Card>

            {/* Vertragsgegenstand */}
            <Card>
              <CardHeader>
                <CardTitle>§ 2 Vertragsgegenstand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    subfix ist eine Software-as-a-Service (SaaS) Plattform zur Verwaltung und Überwachung 
                    von Compliance-Nachweisen bei Nachunternehmern in Bauprojekten.
                  </p>
                  <p><strong>MUST_FILL:</strong> Detaillierte Leistungsbeschreibung und Abgrenzung</p>
                </div>
              </CardContent>
            </Card>

            {/* Nutzungsrechte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  § 3 Nutzungsrechte und Pflichten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <h4 className="font-medium text-foreground">Nutzungsrechte</h4>
                  <p><strong>MUST_FILL:</strong> Umfang der eingeräumten Nutzungsrechte</p>
                  
                  <h4 className="font-medium text-foreground mt-4">Nutzerpflichten</h4>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
                    <li>Sicherung der Zugangsdaten</li>
                    <li>Keine missbräuchliche Nutzung der Plattform</li>
                    <li><strong>MUST_FILL:</strong> Weitere spezifische Nutzerpflichten</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Preise und Zahlung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  § 4 Preise, Zahlungsbedingungen, Testphase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <h4 className="font-medium text-foreground">Testphase</h4>
                  <p>Neue Kunden erhalten eine kostenlose 14-tägige Testphase mit vollem Funktionsumfang.</p>
                  
                  <h4 className="font-medium text-foreground">Preise</h4>
                  <p>Die aktuellen Preise sind auf der Website einsehbar. Alle Preise verstehen sich zzgl. MwSt.</p>
                  
                  <h4 className="font-medium text-foreground">Zahlung</h4>
                  <p><strong>MUST_FILL:</strong> Zahlungsmodalitäten, Fälligkeit, Mahnverfahren</p>
                </div>
              </CardContent>
            </Card>

            {/* Laufzeit und Kündigung */}
            <Card>
              <CardHeader>
                <CardTitle>§ 5 Vertragslaufzeit und Kündigung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>MUST_FILL:</strong> Mindestlaufzeit und Kündigungsfristen</p>
                  <p><strong>MUST_FILL:</strong> Ordentliche und außerordentliche Kündigung</p>
                  <p><strong>MUST_FILL:</strong> Datenrückgabe nach Vertragsende</p>
                </div>
              </CardContent>
            </Card>

            {/* Verfügbarkeit */}
            <Card>
              <CardHeader>
                <CardTitle>§ 6 Verfügbarkeit und Wartung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>MUST_FILL:</strong> Service Level Agreement (SLA)</p>
                  <p><strong>MUST_FILL:</strong> Wartungsfenster und geplante Ausfallzeiten</p>
                </div>
              </CardContent>
            </Card>

            {/* Datenschutz */}
            <Card>
              <CardHeader>
                <CardTitle>§ 7 Datenschutz und Datensicherheit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Der Anbieter verpflichtet sich zur Einhaltung der geltenden Datenschutzbestimmungen, 
                    insbesondere der DSGVO.
                  </p>
                  <p><strong>MUST_FILL:</strong> Verweis auf Datenschutzerklärung und Auftragsverarbeitungsvertrag</p>
                </div>
              </CardContent>
            </Card>

            {/* Haftung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  § 8 Haftung und Haftungsbeschränkung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>MUST_FILL:</strong> Haftungsausschlüsse und -beschränkungen nach geltendem Recht</p>
                  <p><strong>MUST_FILL:</strong> Besondere Regelungen für Vermögensschäden</p>
                  <p><strong>MUST_FILL:</strong> Compliance-spezifische Haftungsregelungen</p>
                </div>
              </CardContent>
            </Card>

            {/* Änderungen */}
            <Card>
              <CardHeader>
                <CardTitle>§ 9 Änderung der AGB</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>MUST_FILL:</strong> Verfahren für AGB-Änderungen</p>
                  <p><strong>MUST_FILL:</strong> Widerspruchsrecht und Kündigungsmöglichkeit</p>
                </div>
              </CardContent>
            </Card>

            {/* Schlussbestimmungen */}
            <Card>
              <CardHeader>
                <CardTitle>§ 10 Schlussbestimmungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>Anwendbares Recht:</strong> Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.</p>
                  <p><strong>Gerichtsstand:</strong> MUST_FILL: Zuständiger Gerichtsstand</p>
                  <p><strong>Salvatorische Klausel:</strong> MUST_FILL: Unwirksamkeitsklausel</p>
                  <p className="mt-4"><strong>Stand:</strong> MUST_FILL: Datum der aktuellen Fassung</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}