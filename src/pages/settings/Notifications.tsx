import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSettings, updateSettings, subscribeToSettings } from '@/services/settings.store';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bell, Info, Mail } from 'lucide-react';

export default function Notifications() {
  const { user } = useSupabaseAuthContext();
  const [settings, setSettings] = useState(() => getSettings());
  const { toast } = useToast();
  
  // Guard: return loading if no user context yet
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  useEffect(() => {
    const unsubscribe = subscribeToSettings(() => {
      setSettings(getSettings());
    });
    return unsubscribe;
  }, []);

  const handleToggle = (key: keyof typeof settings.notifications, value: boolean) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    });

    toast({
      title: "Gespeichert",
      description: "Benachrichtigungseinstellungen wurden aktualisiert"
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            E-Mail Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie Ihre E-Mail-Benachrichtigungseinstellungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo-Modus:</strong> E-Mail-Benachrichtigungen sind im Demo-Modus nicht aktiv. 
              Für echte E-Mail-Benachrichtigungen wird ein E-Mail-Provider (z.B. Resend) benötigt.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">Erinnerungen für fehlende Dokumente</div>
                <div className="text-sm text-muted-foreground">
                  Automatische E-Mails an Nachunternehmer mit fehlenden Dokumenten
                </div>
              </div>
              <Switch
                checked={settings.notifications.remindersEnabled}
                onCheckedChange={(checked) => handleToggle('remindersEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">Status-Updates bei Dokumentenänderungen</div>
                <div className="text-sm text-muted-foreground">
                  Benachrichtigungen wenn Dokumente akzeptiert oder abgelehnt werden
                </div>
              </div>
              <Switch
                checked={settings.notifications.statusUpdatesEnabled}
                onCheckedChange={(checked) => handleToggle('statusUpdatesEnabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Magic Link Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Magic-Link Anmeldung (Info)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Im Demo-Modus nicht aktiv. Für produktive E-Mail-Logins benötigen Sie einen E-Mail-Provider 
              (z. B. Resend) und ggf. Domain-Allowlist. Diese Option wird erst in der Cloud-Version freigeschaltet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}