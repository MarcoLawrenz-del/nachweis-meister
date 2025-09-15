import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, FileText, Users, Mail, AlertCircle, Calendar, Server, Globe } from 'lucide-react';

export default function Datenschutz() {
  return (
    <>
      <Helmet>
        <title>Datenschutzerklärung - subfix</title>
        <meta name="description" content="Datenschutzerklärung für subfix - Compliance Management für Nachunternehmer" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Datenschutzerklärung</h1>
            <p className="text-muted-foreground">
              Stand: 15.09.2025
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Verantwortlicher */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  1. Verantwortlicher / Anbieter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">OK Beteiligungsgesellschaft mbH</p>
                  <p className="text-muted-foreground">Lindauer Str. 4–5, 10781 Berlin</p>
                  <p className="text-muted-foreground">E-Mail: support@subfix.de</p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Datenkategorien */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  2. Datenkategorien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Web/Nutzung; Konto/SSO; App-Daten (Pflichtnachweise, Gültig-bis, Prüf-/Freigabe-Protokoll); Kommunikation; Abrechnung; Support.
                </p>
              </CardContent>
            </Card>

            {/* 3. Zwecke/Rechtsgrundlagen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  3. Zwecke/Rechtsgrundlagen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Betrieb/Sicherheit (Art. 6 (1) f), Vertrag/SSO (b), Erinnerungen im Auftrag (b/f), Pflichten (c), Zahlung (b), Marketing nur mit Einwilligung (a).
                </p>
              </CardContent>
            </Card>

            {/* 4. Rollenmodell */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  4. Rollenmodell
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Website/Billing:</strong> Verantwortlicher = wir.</p>
                  <p><strong>App:</strong> Kunde = Verantwortlicher; wir = Auftragsverarbeiter (AVV/DPA: /legal/avv-subfix.pdf).</p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Empfänger / Auftragsverarbeiter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  5. Empfänger / Auftragsverarbeiter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>Checkdomain</strong> – Domain/DNS (ggf. Hosting) · DE</p>
                  <p><strong>Supabase</strong> – DB/Storage · Frankfurt (EU)</p>
                  <p><strong>Resend</strong> – Transaktions-E-Mails</p>
                  <p><strong>Lovable</strong> – Build/Hosting/Preview (EU, projektabhängig; Details in <a href="/dienstleister" className="text-brand hover:underline">/dienstleister</a>)</p>
                  <p><strong>Microsoft / Google</strong> – SSO</p>
                  <p><strong>Stripe (falls aktiv)</strong> – Zahlungen</p>
                  <p className="text-xs">Optionale Tools nur, wenn aktiv (Sentry, CDN/WAF, Analytics).</p>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs">
                      <strong>Drittlandübermittlung:</strong> falls relevant mit geeigneten Garantien.<br />
                      Dienstleisterliste: <a href="/dienstleister" className="text-brand hover:underline">/dienstleister</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Speicherdauer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  6. Speicherdauer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Server-Logs 14–30 Tage; Konto/App während Vertragslaufzeit; Abrechnung 6/10 Jahre; E-Mail-Logs ~90 Tage.
                </p>
              </CardContent>
            </Card>

            {/* 7. Cookies / Local Storage */}
            <Card>
              <CardHeader>
                <CardTitle>7. Cookies / Local Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Technisch erforderlich. Analytics: keine.
                </p>
              </CardContent>
            </Card>

            {/* 8-12. Weitere Abschnitte */}
            <Card>
              <CardHeader>
                <CardTitle>8. Registrierung, Login & SSO</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  E-Mail/Passwort oder Magic-Link; SSO Microsoft/Google; TLS; Rollenrechte; signierte Datei-Links.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Upload von Nachweisen (App)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Verarbeitung im Auftrag des Kunden (Art. 6 (1) b/c/f). Angemessene TOMs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  10. Kommunikation & Erinnerungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transaktions-/Erinnerungs-Mails; Protokollierung Zustellstatus (Art. 6 (1) b/f).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Zahlungen (falls aktiv)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stripe; keine Speicherung kompletter Kartendaten bei uns (Art. 6 (1) b).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  12. Sicherheit (TOMs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  TLS, Least-Privilege, signierte Downloads, Backups; At-Rest gemäß Anbieterstandard.
                </p>
              </CardContent>
            </Card>

            {/* 13. Ihre Rechte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  13. Ihre Rechte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit, Widerspruch, Widerruf.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Aufsichtsbehörde: Berlin – <a href="https://www.datenschutz-berlin.de/" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">https://www.datenschutz-berlin.de/</a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 14-16. Weitere Abschnitte */}
            <Card>
              <CardHeader>
                <CardTitle>14–16. Pflichtangaben, Minderjährige, Änderungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Wie zuvor beschrieben.</p>
                  <p><strong>Datenschutzkontakt (optional):</strong> support@subfix.de</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}