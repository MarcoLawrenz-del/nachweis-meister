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
                  1. Verantwortlicher / Anbieter dieser Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">OK Beteiligungsgesellschaft mbH</p>
                  <p className="text-muted-foreground">Lindauer Str. 4–5, 10781 Berlin, Deutschland</p>
                  <p className="text-muted-foreground">E-Mail: support@subfix.de</p>
                  <p className="text-muted-foreground mt-3">(„wir", „subfix")</p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">Für die Website (Marketing, Kontakt, Demo, Abrechnung) sind wir Verantwortlicher i. S. d. Art. 4 Nr. 7 DSGVO.</p>
                    <p className="text-sm mt-2">Für die App-Arbeitsbereiche unserer Kunden (Verarbeitung von Daten beauftragter Firmen/Mitarbeitender) handeln wir in der Regel als Auftragsverarbeiter gem. Art. 28 DSGVO. Ein Auftragsverarbeitungsvertrag (AVV/DPA) wird bereitgestellt: MUST_FILL_LINK_AVV.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Kategorien personenbezogener Daten */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  2. Kategorien personenbezogener Daten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Web/Nutzung:</p>
                    <p className="text-sm text-muted-foreground">IP, Zeitstempel, Request-Daten, User-Agent, Referrer, Cookie/Local-Storage-IDs.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Konto/SSO:</p>
                    <p className="text-sm text-muted-foreground">Name, E-Mail, Organisation, SSO-Claims (Microsoft/Google), Login-Zeitpunkte.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">App-Daten (im Auftrag):</p>
                    <p className="text-sm text-muted-foreground">Nachweise/Dokumente (z. B. A1, § 48b-Freistellung, SOKA/Unbedenklichkeit, Betriebshaftpflicht, Mitarbeiterlisten inkl. Name/Vorname und ID-Abgleich), Gültig-bis/Ablaufdaten, Prüf-/Freigabeprotokolle, Erinnerungs-/Eskalationshistorie.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Kommunikation:</p>
                    <p className="text-sm text-muted-foreground">E-Mail-Inhalte (Einladung/Reminder/Service), Zustelllogs.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Abrechnung:</p>
                    <p className="text-sm text-muted-foreground">Kundendaten, Buchungs-/Zahlungsinformationen (keine Speicherung vollständiger Kartendaten bei uns).</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Support:</p>
                    <p className="text-sm text-muted-foreground">Inhalte von Support-Anfragen.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Zwecke und Rechtsgrundlagen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  3. Zwecke und Rechtsgrundlagen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p><strong>Websitebetrieb & Sicherheit</strong> (Server-Logs, Fehler-Monitoring) – Art. 6 Abs. 1 lit. f DSGVO.</p>
                  <p><strong>Konto/SSO & Vertragsdurchführung</strong> – Art. 6 Abs. 1 lit. b DSGVO.</p>
                  <p><strong>Erinnerungen/Eskalation im Auftrag</strong> (nur Pflichtnachweise) – Art. 6 Abs. 1 lit. f bzw. lit. b DSGVO (Kunde ↔ beauftragte Firma).</p>
                  <p><strong>Gesetzliche Pflichten</strong> (steuer-/handelsrechtliche Aufbewahrung) – Art. 6 Abs. 1 lit. c DSGVO.</p>
                  <p><strong>Abrechnung/Bezahlung</strong> – Art. 6 Abs. 1 lit. b DSGVO.</p>
                  <p><strong>Marketing-Kommunikation</strong> (nur mit Einwilligung) – Art. 6 Abs. 1 lit. a DSGVO (widerruflich).</p>
                </div>
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
                <div className="space-y-3 text-sm">
                  <p><strong>Website/Vertrag/Billing:</strong> wir sind Verantwortlicher.</p>
                  <p><strong>App-Arbeitsbereiche:</strong> Kunde (z. B. Generalunternehmer) ist Verantwortlicher; wir verarbeiten als Auftragsverarbeiter.</p>
                  <p>Betroffene (z. B. Mitarbeitende beauftragter Firmen) wenden sich primär an den jeweiligen Kunden; wir unterstützen diesen gemäß AVV.</p>
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
                <div className="space-y-4">
                  <p className="text-sm">Wir setzen sorgfältig ausgewählte Dienstleister ein; mit allen besteht – soweit erforderlich – ein AVV gem. Art. 28 DSGVO.</p>
                  
                  <div className="space-y-3 text-sm">
                    <p><strong>Checkdomain</strong> – Domain/DNS (ggf. Webhosting); Standort Deutschland.</p>
                    <p><strong>Supabase</strong> – Datenbank & Datei-Storage; Region: Frankfurt (EU). Supabase gibt an: Verschlüsselung in Transit (TLS) und At-Rest (AES-256).</p>
                    <p><strong>Resend</strong> – Transaktions-E-Mails (Einladung, Reminder, Eskalation).</p>
                    <p><strong>Lovable</strong> – App-Bereitstellung/Preview/Build-Hosting (Details zu Rolle/Standort projektabhängig; werden in der Dienstleisterliste fortlaufend dokumentiert).</p>
                    <p><strong>Microsoft / Google</strong> – SSO/Authentifizierung.</p>
                    <p><strong>Stripe (falls aktiv)</strong> – Zahlungsabwicklung (wir speichern keine vollständigen Kartendaten).</p>
                  </div>

                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm"><strong>Drittlandübermittlung:</strong> Soweit Dienstleister außerhalb der EU/EWR tätig sind bzw. Zugriff besteht, stellen wir geeignete Garantien gem. Art. 44 ff. DSGVO sicher (insb. EU-Standardvertragsklauseln). Details je Dienstleister: <a href="/dienstleister" className="text-brand hover:underline">/dienstleister</a> (laufend gepflegt).</p>
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
                <div className="space-y-2 text-sm">
                  <p><strong>Server-Logs:</strong> i. d. R. 14–30 Tage, danach Löschung/Anonymisierung.</p>
                  <p><strong>Konto/App-Daten:</strong> für die Vertragslaufzeit; nach Beendigung gem. Vertrag/AVV Löschung oder Rückgabe, sofern keine gesetzlichen Pflichten entgegenstehen.</p>
                  <p><strong>Abrechnungsunterlagen:</strong> 6/10 Jahre (HGB/AO).</p>
                  <p><strong>E-Mail-Logs:</strong> i. d. R. 90 Tage.</p>
                </div>
              </CardContent>
            </Card>

            {/* 7. Cookies / Local Storage */}
            <Card>
              <CardHeader>
                <CardTitle>7. Cookies / Local Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Technisch erforderliche Cookies/Local-Storage (Sitzung, SSO, Sicherheit).</p>
                  <p>Optionale/analytische Cookies nur mit Einwilligung über ein Consent-Tool. Aktueller Einsatz: MUST_FILL_ANALYTICS (z. B. „keine" / „Matomo on-prem" / „Plausible").</p>
                </div>
              </CardContent>
            </Card>

            {/* 8-12. Weitere Abschnitte */}
            <Card>
              <CardHeader>
                <CardTitle>8. Registrierung, Login & SSO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>E-Mail/Passwort oder Magic Link; SSO via Microsoft/Google.</p>
                  <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
                  <p>Sicherheit: HTTPS, rollenbasierte Berechtigungen, signierte Datei-Links.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Upload von Nachweisen (App)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Im Auftrag unserer Kunden verarbeiten wir Dokumente mit personenbezogenen Daten.</p>
                  <p>Rechtsgrundlage beim Kunden: Art. 6 Abs. 1 lit. b/c/f DSGVO.</p>
                  <p>Wir setzen angemessene technische und organisatorische Maßnahmen ein (siehe § 12).</p>
                </div>
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
                <div className="space-y-2 text-sm">
                  <p>Versand von Erinnerungs-/Eskalationsmails an hinterlegte Kontakte beauftragter Firmen; Protokollierung des Zustellstatus.</p>
                  <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b/f DSGVO.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Zahlungen (falls aktiv)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Zahlungen über Stripe; wir erhalten Transaktions-Metadaten, speichern keine vollständigen Kartendaten.</p>
                  <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
                </div>
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
                <div className="space-y-2 text-sm">
                  <p>• Transportverschlüsselung (HTTPS/TLS).</p>
                  <p>• Zugriff nur per rollenbasierten Rechten (Least-Privilege), Protokollierung administrativer Aktionen.</p>
                  <p>• Signierte URLs für Datei-Downloads, MIME-Whitelist; regelmäßige Backups.</p>
                  <p>• Verschlüsselung: TLS in Transit; At-Rest gemäß Anbieterstandard (Supabase dokumentiert AES-256 At-Rest). MUST_CONFIRM_INTERNAL: Bitte intern verifizieren, ob für euer Projekt zusätzliche At-Rest/Column-Encryption (z. B. Vault/pgsodium) verwendet wird.</p>
                </div>
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
                  <p className="text-sm">Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21), Widerruf von Einwilligungen (Art. 7 Abs. 3).</p>
                  <p className="text-sm">Beschwerderecht bei der Aufsichtsbehörde: <a href="https://www.datenschutz-berlin.de/" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">Berliner Beauftragte für Datenschutz und Informationsfreiheit</a>.</p>
                  <p className="text-sm">Anfragen an: <a href="mailto:support@subfix.de" className="text-brand hover:underline">support@subfix.de</a></p>
                  <p className="text-sm text-muted-foreground">Für App-Daten im Auftrag wenden Sie sich bitte primär an den jeweiligen Kunden (Verantwortlichen). Wir unterstützen diesen gemäß AVV.</p>
                </div>
              </CardContent>
            </Card>

            {/* 14-16. Weitere Abschnitte */}
            <Card>
              <CardHeader>
                <CardTitle>14. Pflicht zur Bereitstellung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Für die Nutzung der App sind bestimmte Angaben erforderlich (z. B. E-Mail für Login; Nachweisdaten zur Vertragserfüllung/Compliance). Ohne diese ist die Leistung ggf. nicht möglich.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>15. Minderjährige</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Unser Angebot richtet sich nicht an Personen unter 16 Jahren.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  16. Änderungen dieser Erklärung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Wir passen diese Erklärung an, wenn sich Rechtslage, Dienste oder Prozesse ändern. Die jeweils aktuelle Fassung ist jederzeit unter /datenschutz abrufbar.</p>
                  <p className="mt-4"><strong>Kontakt Datenschutz (optional):</strong><br />E-Mail: MUST_FILL_DSB_MAIL (falls Datenschutzbeauftragter benannt)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}