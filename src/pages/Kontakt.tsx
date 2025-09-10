import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export default function Kontakt() {
  return (
    <>
      <Helmet>
        <title>Kontakt - subfix</title>
        <meta name="description" content="Kontaktieren Sie das subfix Team - Support und Vertrieb für Nachunternehmer-Compliance Management" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Kontakt</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Haben Sie Fragen zu subfix oder benötigen Sie Unterstützung? 
              Wir helfen Ihnen gerne weiter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Kontakt-Informationen */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    E-Mail Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">
                    Unser Support-Team antwortet innerhalb von 24 Stunden.
                  </p>
                  <a 
                    href="mailto:support@subfix.de" 
                    className="text-primary hover:underline font-medium"
                  >
                    support@subfix.de
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Telefon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">
                    <strong>MUST_FILL:</strong> Telefonische Beratung
                  </p>
                  <p className="font-medium">MUST_FILL: Telefonnummer</p>
                  <p className="text-sm text-muted-foreground">
                    Mo-Fr: 9:00-17:00 Uhr
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Anschrift
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">
                    <p className="font-medium text-foreground">OK Beteiligungsgesellschaft mbH</p>
                    <p>Lindauer Str. 4-5</p>
                    <p>10781 Berlin</p>
                    <p>Deutschland</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Vertrieb & Enterprise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">
                    Für Enterprise-Lösungen und individuelle Anfragen.
                  </p>
                  <a 
                    href="mailto:sales@subfix.de" 
                    className="text-primary hover:underline font-medium"
                  >
                    sales@subfix.de
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Kontakt-Formular */}
            <Card>
              <CardHeader>
                <CardTitle>Nachricht senden</CardTitle>
                <p className="text-muted-foreground">
                  Senden Sie uns eine Nachricht und wir melden uns schnellstmöglich bei Ihnen.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input id="firstName" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input id="lastName" required />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input id="email" type="email" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="company">Unternehmen</Label>
                    <Input id="company" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" type="tel" />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Betreff *</Label>
                    <Input id="subject" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Nachricht *</Label>
                    <Textarea 
                      id="message" 
                      rows={6} 
                      placeholder="Beschreiben Sie Ihr Anliegen..."
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Nachricht senden
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Mit dem Absenden stimmen Sie unserer 
                    <a href="/datenschutz" className="text-primary hover:underline ml-1">
                      Datenschutzerklärung
                    </a> zu.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}