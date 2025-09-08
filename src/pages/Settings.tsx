import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Settings as SettingsIcon, User, Building } from 'lucide-react';

export default function Settings() {
  const { profile } = useAppAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-professional">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Konto- und Systemeinstellungen
          </p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Benutzerprofil
            </CardTitle>
            <CardDescription>
              Ihre persönlichen Informationen und Kontodetails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{profile?.name || 'Nicht verfügbar'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-Mail</label>
                <p className="text-sm">{profile?.email || 'Nicht verfügbar'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rolle</label>
                <p className="text-sm capitalize">{profile?.role || 'Nicht verfügbar'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tenant ID</label>
                <p className="text-sm font-mono">{profile?.tenant_id || 'Nicht verfügbar'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" />
              Systemeinstellungen
            </CardTitle>
            <CardDescription>
              Allgemeine Einstellungen für das System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Weitere Einstellungen werden in zukünftigen Updates verfügbar sein.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}