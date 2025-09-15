import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Server } from 'lucide-react';

export default function Dienstleister() {
  return (
    <>
      <Helmet>
        <title>Dienstleister - subfix</title>
        <meta name="description" content="Transparenzliste der eingesetzten Dienstleister für subfix" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Dienstleister – Transparenzliste</h1>
            <p className="text-muted-foreground">
              Stand: 15.09.2025 · Laufend gepflegte Übersicht
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Eingesetzte Auftragsverarbeiter und Drittanbieter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Dienstleister</TableHead>
                      <TableHead className="min-w-[200px]">Zweck</TableHead>
                      <TableHead className="min-w-[140px]">Standort/Region</TableHead>
                      <TableHead className="min-w-[160px]">Rechtsgrundlage/Vertrag</TableHead>
                      <TableHead className="min-w-[200px]">Hinweise</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Checkdomain</TableCell>
                      <TableCell>Domain/DNS (ggf. Hosting)</TableCell>
                      <TableCell>Deutschland</TableCell>
                      <TableCell>AVV/DPA (falls relevant)</TableCell>
                      <TableCell>Provider-Website/Hinweise einpflegen</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Supabase</TableCell>
                      <TableCell>Datenbank & Storage</TableCell>
                      <TableCell>Frankfurt (EU)</TableCell>
                      <TableCell>AVV; Standardvertragsklauseln falls nötig</TableCell>
                      <TableCell>AES-256 At-Rest, TLS in Transit (Anbieterangabe)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Resend</TableCell>
                      <TableCell>Transaktions-E-Mails</TableCell>
                      <TableCell>EU/USA (je nach Produkt)</TableCell>
                      <TableCell>AVV; ggf. SCC</TableCell>
                      <TableCell>Zustell-/Bounce-Logs</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Lovable</TableCell>
                      <TableCell>Build/Hosting/Preview</TableCell>
                      <TableCell>MUST_FILL</TableCell>
                      <TableCell>MUST_FILL</TableCell>
                      <TableCell>Projektabhängig dokumentieren</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Microsoft / Google</TableCell>
                      <TableCell>SSO/ID-Provider</TableCell>
                      <TableCell>EU/Global</TableCell>
                      <TableCell>Verträge/Terms</TableCell>
                      <TableCell>nur Auth-Daten</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Stripe (optional)</TableCell>
                      <TableCell>Zahlungsabwicklung</TableCell>
                      <TableCell>EU/Global</TableCell>
                      <TableCell>DPA/SCC</TableCell>
                      <TableCell>keine vollen Kartendaten bei uns</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Optionale Tools</TableCell>
                      <TableCell>Sentry, Cloudflare/Akamai, Matomo/Plausible</TableCell>
                      <TableCell>MUST_FILL</TableCell>
                      <TableCell>MUST_FILL</TableCell>
                      <TableCell>nur wenn aktiv</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Hinweis:</strong> Diese Liste wird fortlaufend gepflegt und aktualisiert. Bei Fragen zu einzelnen Dienstleistern oder deren Datenverarbeitung wenden Sie sich bitte an <a href="mailto:support@subfix.de" className="text-brand hover:underline">support@subfix.de</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}