import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database } from 'lucide-react';

export default function Datenschutz() {
  return (
    <>
      <Helmet>
        <title>Datenschutz - subfix</title>
        <meta name="description" content="Datenschutzerklärung für subfix - Nachunternehmer-Compliance Management" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Datenschutzerklärung</h1>
            <p className="text-muted-foreground">
              Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer personenbezogenen Daten
            </p>
          </div>

          <div className="space-y-6">
            {/* Verantwortlicher */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verantwortlicher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">OK Beteiligungsgesellschaft mbH</p>
                  <p className="text-muted-foreground">Lindauer Str. 4-5, 10781 Berlin</p>
                  <p className="text-muted-foreground">
                    E-Mail: <strong>MUST_FILL:</strong> datenschutz@subfix.de
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Datenverarbeitung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Art der verarbeiteten Daten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Personenbezogene Daten</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Name und Kontaktdaten (E-Mail, Telefon, Adresse)</li>
                      <li>Unternehmensdaten (Firmenname, Rechtsform, USt-ID)</li>
                      <li>Compliance-Dokumente und Nachweise</li>
                      <li>Nutzungsdaten der Plattform</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Zweck der Verarbeitung</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Bereitstellung der Compliance-Management-Dienste</li>
                      <li>Überwachung von Pflichtnachweisen</li>
                      <li>Automatische Erinnerungen und Benachrichtigungen</li>
                      <li>Rechnungsstellung und Kundenbetreuung</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rechtsgrundlage */}
            <Card>
              <CardHeader>
                <CardTitle>Rechtsgrundlage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>MUST_FILL:</strong> Detaillierte Rechtsgrundlagen nach DSGVO Art. 6</p>
                  <p><strong>MUST_FILL:</strong> Vertragliche Grundlagen und berechtigte Interessen</p>
                </div>
              </CardContent>
            </Card>

            {/* Speicherdauer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Speicherdauer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <strong>MUST_FILL:</strong> Informationen zur Aufbewahrungsdauer verschiedener Datentypen
                </p>
              </CardContent>
            </Card>

            {/* Ihre Rechte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Ihre Rechte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nach der DSGVO stehen Ihnen folgende Rechte zu:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                    <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                    <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                    <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                    <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                    <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    <strong>MUST_FILL:</strong> Kontaktinformationen für Ausübung der Rechte
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Cookies und Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <strong>MUST_FILL:</strong> Informationen über verwendete Cookies, Analytics-Tools und Tracking-Technologien
                </p>
              </CardContent>
            </Card>

            {/* Drittanbieter */}
            <Card>
              <CardHeader>
                <CardTitle>Drittanbieter und Auftragsverarbeiter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Supabase (Hosting):</strong> MUST_FILL: Details zur Datenübertragung</p>
                  <p><strong>Stripe (Zahlungen):</strong> MUST_FILL: Zahlungsabwicklung</p>
                  <p><strong>MUST_FILL:</strong> Weitere Dienstleister und deren Zweck</p>
                </div>
              </CardContent>
            </Card>

            {/* Beschwerderecht */}
            <Card>
              <CardHeader>
                <CardTitle>Beschwerderecht</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sie haben das Recht, sich bei einer Aufsichtsbehörde über die Verarbeitung 
                  Ihrer personenbezogenen Daten durch uns zu beschweren.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>MUST_FILL:</strong> Zuständige Aufsichtsbehörde und Kontaktdaten
                </p>
              </CardContent>
            </Card>

            {/* Aktualisierung */}
            <Card>
              <CardHeader>
                <CardTitle>Aktualisierung der Datenschutzerklärung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Diese Datenschutzerklärung kann von Zeit zu Zeit aktualisiert werden. 
                  Die aktuelle Version ist immer unter dieser Adresse abrufbar.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Stand:</strong> MUST_FILL: Datum der letzten Aktualisierung
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}