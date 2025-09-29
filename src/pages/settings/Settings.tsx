import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { SettingsErrorBoundary } from '@/components/SettingsErrorBoundary';
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
import { getRoleDisplayName, canManageTeam, useCurrentUserRole } from '@/services/team.supabase';

export default function Settings() {
  const { user, profile } = useNewAuth();
  const [currentTab, setCurrentTab] = useState('profile');
  const { toast } = useToast();
  const { role: userRole, loading: roleLoading } = useCurrentUserRole();
  
  const canAccessTeam = canManageTeam(userRole);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  return (
    <SettingsErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Konto und Ihre Präferenzen
          </p>
        </div>

        {/* Settings Navigation */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2" disabled={!canAccessTeam}>
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Benachrichtigungen</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Profile />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Team />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Notifications />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <System />
          </TabsContent>
        </Tabs>
      </div>
    </SettingsErrorBoundary>
  );
}