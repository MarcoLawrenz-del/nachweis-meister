import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSettings, updateSettings, initializeSettings, subscribeToSettings, type Settings } from '@/services/settings.supabase';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Info, Globe, Shield, TestTube, Database } from 'lucide-react';

export default function System() {
  const { user } = useNewAuth();
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load settings from Supabase on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await initializeSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: "Fehler beim Laden",
          description: "Systemeinstellungen konnten nicht geladen werden",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [toast]);

  useEffect(() => {
    const unsubscribe = subscribeToSettings(() => {
      setSettings(getSettings());
    });
    return unsubscribe;
  }, []);

  const handleSystemSettingChange = async (key: keyof Settings['system'], value: any) => {
    const newSettings = {
      ...settings,
      system: {
        ...settings.system,
        [key]: value
      }
    };
    
    setSettings(newSettings);
    
    const result = await updateSettings({ system: newSettings.system });
    
    if (result.success) {
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Systemeinstellungen wurden aktualisiert.",
      });
    } else {
      toast({
        title: "Fehler beim Speichern",
        description: result.error || "Einstellungen konnten nicht gespeichert werden",
        variant: "destructive"
      });
      // Revert settings on error
      setSettings(getSettings());
    }
  };

  const handleResetSettings = async () => {
    const defaultSettings: Settings = {
      notifications: {
        remindersEnabled: true,
        statusUpdatesEnabled: true,
        missingRemindersEnabled: true,
        expiryWarningsEnabled: true,
        expiryWarnDays: 30,
      },
      system: {
        locale: 'de',
        demoMode: true,
      },
    };

    const result = await updateSettings(defaultSettings);
    
    if (result.success) {
      setSettings(defaultSettings);
      toast({
        title: "Einstellungen zurückgesetzt",
        description: "Alle Einstellungen wurden auf die Standardwerte zurückgesetzt.",
      });
    } else {
      toast({
        title: "Fehler beim Zurücksetzen",
        description: result.error || "Einstellungen konnten nicht zurückgesetzt werden",
        variant: "destructive"
      });
    }
  };

  // Guard: return loading if no user context yet
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System</h2>
        <p className="text-muted-foreground">
          Allgemeine Anwendungseinstellungen und Systemkonfiguration
        </p>
      </div>

      <div className="grid gap-6">
        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sprache & Region
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie Ihre bevorzugte Sprache und regionale Einstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sprache</Label>
                <div className="text-sm text-muted-foreground">
                  Standardsprache für die Benutzeroberfläche
                </div>
              </div>
              <Select
                value={settings.system.locale}
                onValueChange={(value) => handleSystemSettingChange('locale', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Application Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Anwendungsmodus
            </CardTitle>
            <CardDescription>
              Steuern Sie das Verhalten der Anwendung und Testfunktionen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Demo-Modus</Label>
                <div className="text-sm text-muted-foreground">
                  Verwende Testdaten und simuliere E-Mail-Versand in der Konsole
                </div>
              </div>
              <Switch
                checked={settings.system.demoMode}
                onCheckedChange={(checked) => handleSystemSettingChange('demoMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datenverwaltung
            </CardTitle>
            <CardDescription>
              Zurücksetzen und Verwalten Ihrer gespeicherten Daten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Einstellungen zurücksetzen</Label>
                <div className="text-sm text-muted-foreground">
                  Setzt alle Einstellungen auf die Standardwerte zurück
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleResetSettings}
                className="flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Datenspeicherung:</strong> Ihre Einstellungen werden sicher in der Supabase-Datenbank gespeichert 
            und zwischen Geräten synchronisiert. Ihre Daten sind durch Row-Level Security geschützt.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}