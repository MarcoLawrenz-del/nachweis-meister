import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { TeamGuard } from '@/components/TeamGuard';
import Team from './Team';
import { 
  Settings as SettingsIcon, 
  User, 
  Users, 
  Mail, 
  Bell,
  Info,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRoleDisplayName, canManageTeam } from '@/services/team.store';

export default function Settings() {
  const { user, userRole } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const canAccessTeam = canManageTeam(userRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Konto- und Systemeinstellungen
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger 
            value="team" 
            className="flex items-center gap-2"
            disabled={!canAccessTeam}
          >
            <Users className="w-4 h-4" />
            Team & Rollen
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Benutzerprofil
              </CardTitle>
              <CardDescription>
                Ihre persönlichen Informationen und Kontodetails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm font-medium">Demo Benutzer</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">E-Mail</label>
                    <p className="text-sm">demo@subfix.de</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rolle</label>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="capitalize">
                        {getRoleDisplayName(userRole)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Anmeldung</label>
                    <p className="text-sm text-muted-foreground">Demo-Modus (lokal)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <TeamGuard>
            <Team />
          </TeamGuard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                E-Mail & Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihre Benachrichtigungseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Demo-Modus:</strong> E-Mail-Benachrichtigungen sind im Demo-Modus nicht aktiv. 
                  Für echte E-Mail-Benachrichtigungen wird ein E-Mail-Provider (z.B. Resend) benötigt.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Erinnerungen für fehlende Dokumente</div>
                    <div className="text-sm text-muted-foreground">
                      Automatische E-Mails an Nachunternehmer mit fehlenden Dokumenten
                    </div>
                  </div>
                  <Badge variant="outline">Demo</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Status-Updates</div>
                    <div className="text-sm text-muted-foreground">
                      Benachrichtigungen bei Dokumentenänderungen
                    </div>
                  </div>
                  <Badge variant="outline">Demo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Magic Link Info for Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Magic Link Anmeldung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Diese Funktion ist im Demo-Login nicht aktiv.</strong> Für E-Mail-Login via Magic-Link 
                  wird ein E-Mail-Provider + Domain-Allowlist benötigt. In der Vollversion können Sie hier 
                  erlaubte E-Mail-Domains konfigurieren.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Systemeinstellungen
              </CardTitle>
              <CardDescription>
                Allgemeine Einstellungen für das System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Lokale Authentifizierung</div>
                    <div className="text-sm text-muted-foreground">
                      Demo-Modus mit localStorage-basierter Anmeldung
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Aktiv
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Rollenbasierte Zugriffskontrolle</div>
                    <div className="text-sm text-muted-foreground">
                      Inhaber, Administrator und Mitarbeiter Rollen
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Aktiv
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Team Management</div>
                    <div className="text-sm text-muted-foreground">
                      Lokales Team mit Rollenverwaltung
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Aktiv
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}