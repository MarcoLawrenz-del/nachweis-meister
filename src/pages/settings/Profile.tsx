import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Key, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, profile } = useSupabaseAuthContext();
  const { toast } = useToast();
  
  // Guard: return loading if no user context yet
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Info */}
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
                <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-Mail</label>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rolle</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline" className="capitalize">
                    Benutzer
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Anmeldung</label>
                <p className="text-sm text-muted-foreground">Supabase Auth</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change - Hide for now since it needs Supabase integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>
            Passwort-Änderung über Supabase Auth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Passwort-Änderung ist aktuell über die Supabase Auth-Funktionen verfügbar.
            Diese Funktion wird in einem zukünftigen Update hinzugefügt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}