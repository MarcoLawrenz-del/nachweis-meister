// ============= Notifications Settings Page =============

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  getNotificationSettings, 
  saveNotificationSettings,
  type NotificationSettings 
} from '@/services/notifications';
import { sendEmail, type EmailType } from '@/services/email';
import { isErr } from '@/utils/result';
import { createUploadToken } from '@/services/uploadLinks';
import { Bell, Mail, Settings, TestTube } from 'lucide-react';

export default function Notifications() {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [isTestingSending, setIsTestingSending] = useState(false);
  const { toast } = useToast();

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    
    toast({
      title: "Einstellungen gespeichert",
      description: "Ihre Benachrichtigungseinstellungen wurden aktualisiert.",
    });
  };

  const handleTestEmail = async () => {
    setIsTestingSending(true);
    
    try {
      // Create test payload with magic link
      const testContractorId = "test-contractor-123";
      const { url: magicLink } = createUploadToken(testContractorId);
      
      const testPayload = {
        contractorId: testContractorId,
        to: "test@example.com", // In real scenario, use user's email
        contractorName: "Test Nachunternehmer GmbH",
        customerName: "Ihre Test-Organisation",
        requiredDocs: [
          "Gewerbeanmeldung",
          "Handwerkskarte", 
          "Versicherungsnachweis"
        ],
        magicLink,
        supportEmail: "support@subfix.app"
      };

      const result = await sendEmail("invitation", testPayload);
      
      if (isErr(result)) {
        toast({
          title: "Test fehlgeschlagen",
          description: result.error === "auth" 
            ? "Senden fehlgeschlagen. Bitte Domain bei Resend verifizieren oder Absender konfigurieren."
            : result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: result.mode === "stub" ? "Im Demo-Modus gesendet (Stub)" : "Test-E-Mail gesendet",
          description: result.mode === "stub" 
            ? "E-Mail-Payload wurde in der Konsole ausgegeben" 
            : "Test-E-Mail wurde erfolgreich versendet",
        });
      }
    } catch (error) {
      toast({
        title: "Test fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsTestingSending(false);
    }
  };

  const handleCheckExpiries = async () => {
    try {
      const { tickDaily } = await import('@/services/notifications');
      const result = await tickDaily();
      
      toast({
        title: "Ablaufprüfung abgeschlossen",
        description: `${result.checked} Nachunternehmer geprüft, ${result.warnings} Warnungen versendet`,
      });
      
      if (result.errors.length > 0) {
        console.warn("Expiry check errors:", result.errors);
      }
    } catch (error) {
      toast({
        title: "Prüfung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Benachrichtigungen</h2>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre E-Mail-Benachrichtigungen und Erinnerungen
        </p>
      </div>

      <div className="grid gap-6">
        {/* E-Mail Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Steuern Sie, wann E-Mails an Nachunternehmer gesendet werden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Erinnerungen für fehlende Unterlagen</Label>
                <div className="text-sm text-muted-foreground">
                  Automatische Erinnerungen an Nachunternehmer mit fehlenden Pflichtdokumenten
                </div>
              </div>
              <Switch
                checked={settings.missingRemindersEnabled}
                onCheckedChange={(checked) => handleSettingChange('missingRemindersEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Status-Updates bei Dokumentänderungen</Label>
                <div className="text-sm text-muted-foreground">
                  Benachrichtigungen über angenommene oder abgelehnte Dokumente
                </div>
              </div>
              <Switch
                checked={settings.statusUpdatesEnabled}
                onCheckedChange={(checked) => handleSettingChange('statusUpdatesEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Ablaufwarnungen</Label>
                <div className="text-sm text-muted-foreground">
                  Warnungen vor Ablauf akzeptierter Dokumente
                </div>
              </div>
              <Switch
                checked={settings.expiryWarningsEnabled}
                onCheckedChange={(checked) => handleSettingChange('expiryWarningsEnabled', checked)}
              />
            </div>

            {settings.expiryWarningsEnabled && (
              <div className="ml-6 flex items-center gap-4">
                <Label htmlFor="expiryDays" className="text-sm">
                  Warnungen senden
                </Label>
                <Input
                  id="expiryDays"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.expiryWarnDays}
                  onChange={(e) => handleSettingChange('expiryWarnDays', parseInt(e.target.value) || 30)}
                  className="w-20"
                />
                <Label className="text-sm text-muted-foreground">
                  Tage vor Ablauf
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System-Aktionen
            </CardTitle>
            <CardDescription>
              Test- und Wartungsfunktionen für das E-Mail-System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Test-E-Mail senden</Label>
                <div className="text-sm text-muted-foreground">
                  Sendet eine Test-Einladung um die E-Mail-Konfiguration zu prüfen
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleTestEmail}
                disabled={isTestingSending}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isTestingSending ? "Sende..." : "Test senden"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Ablaufwarnungen jetzt prüfen</Label>
                <div className="text-sm text-muted-foreground">
                  Manuell nach ablaufenden Dokumenten suchen und Warnungen versenden
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCheckExpiries}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Jetzt prüfen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Info */}
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <strong>E-Mail-Konfiguration:</strong> Im Demo-Modus werden E-Mails nur in der Browser-Konsole ausgegeben. 
            Für den Produktivbetrieb konfigurieren Sie Ihren Resend-API-Schlüssel über die Umgebungsvariable VITE_RESEND_API_KEY.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}