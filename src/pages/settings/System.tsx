import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSettings, subscribeToSettings } from '@/services/settings.store';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Info, Globe, Shield } from 'lucide-react';

export default function System() {
  const { user } = useAuthContext();
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

  return (
    <div className="space-y-6">
      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Systemkonfiguration
          </CardTitle>
          <CardDescription>
            Allgemeine Einstellungen und Systeminformationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Sprache / Locale</div>
                  <div className="text-sm text-muted-foreground">
                    Systemsprache und Datumsformat
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                {settings.system.locale.toUpperCase()} (Deutsch)
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Demo-Modus</div>
                  <div className="text-sm text-muted-foreground">
                    Lokale Authentifizierung ohne Cloud-Backend
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-info-50 text-info-600 border-info-600/20">
                {settings.system.demoMode ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode Information */}
      {settings.system.demoMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Demo-Modus Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Im Demo-Modus nutzen Sie eine lokale Version ohne Cloud-Backend. E-Mail-Versand 
                verwendet Stubs, sofern nicht RESEND konfiguriert ist. Alle Daten werden lokal gespeichert.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Lokale Authentifizierung</span>
                <Badge variant="outline" className="bg-success-50 text-success-600 border-success-600/20">
                  Aktiv
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Rollenbasierte Zugriffskontrolle</span>
                <Badge variant="outline" className="bg-success-50 text-success-600 border-success-600/20">
                  Aktiv
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Team-Management</span>
                <Badge variant="outline" className="bg-success-50 text-success-600 border-success-600/20">
                  Aktiv
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">E-Mail Versand</span>
                <Badge variant="outline" className="bg-info-50 text-info-600 border-info-600/20">
                  Stub (Demo)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}