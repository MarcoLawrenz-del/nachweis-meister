import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { TeamGuard } from '@/components/TeamGuard';
import Team from './Team';
import Profile from './Profile';
import Notifications from './Notifications';
import System from './System';
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
          <Profile />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <TeamGuard>
            <Team />
          </TeamGuard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Notifications />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <System />
        </TabsContent>
      </Tabs>
    </div>
  );
}