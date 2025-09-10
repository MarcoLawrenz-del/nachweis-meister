import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function Impressum() {
  return (
    <>
      <Helmet>
        <title>Impressum - subfix</title>
        <meta name="description" content="Impressum und rechtliche Angaben der OK Beteiligungsgesellschaft mbH" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Impressum</h1>
            <p className="text-muted-foreground">Angaben gemäß § 5 TMG</p>
          </div>

          <div className="space-y-6">
            {/* Anbieter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Anbieter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">OK Beteiligungsgesellschaft mbH</p>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                    <div>
                      <p>Lindauer Str. 4-5</p>
                      <p>10781 Berlin</p>
                      <p>Deutschland</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vertretung */}
            <Card>
              <CardHeader>
                <CardTitle>Vertreten durch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <strong>MUST_FILL:</strong> Geschäftsführung
                </p>
              </CardContent>
            </Card>

            {/* Registereintrag */}
            <Card>
              <CardHeader>
                <CardTitle>Registereintrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>MUST_FILL:</strong> Handelsregister-Nr.</p>
                  <p><strong>MUST_FILL:</strong> Registergericht</p>
                </div>
              </CardContent>
            </Card>

            {/* Umsatzsteuer-ID */}
            <Card>
              <CardHeader>
                <CardTitle>Umsatzsteuer-Identifikationsnummer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <strong>MUST_FILL:</strong> USt-IdNr. nach § 27a UStG
                </p>
              </CardContent>
            </Card>

            {/* Kontakt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Kontakt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span><strong>MUST_FILL:</strong> Telefonnummer</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span><strong>MUST_FILL:</strong> support@subfix.de</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mediengesetz */}
            <Card>
              <CardHeader>
                <CardTitle>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">
                  <p><strong>MUST_FILL:</strong> Name des Verantwortlichen</p>
                  <p>Lindauer Str. 4-5, 10781 Berlin</p>
                </div>
              </CardContent>
            </Card>

            {/* EU-Streitschlichtung */}
            <Card>
              <CardHeader>
                <CardTitle>EU-Streitschlichtung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                  <a 
                    href="https://ec.europa.eu/consumers/odr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
              </CardContent>
            </Card>

            {/* Verbraucherstreitbeilegung */}
            <Card>
              <CardHeader>
                <CardTitle>Verbraucherstreitbeilegung / Universalschlichtungsstelle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}