import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Users, Settings as SettingsIcon } from 'lucide-react';
import { SettingsErrorBoundary } from '@/components/SettingsErrorBoundary';
import { useAuthContext } from '@/contexts/AuthContext';
import { canManageTeam } from '@/services/team.store';
import Team from './Team';
import Profile from './Profile';
import Notifications from './Notifications';
import System from './System';

export default function Settings() {
  const { user, userRole } = useAuthContext();
  const [currentTab, setCurrentTab] = useState('profile');
  
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