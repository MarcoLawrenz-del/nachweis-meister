import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAppAuth } from '@/hooks/useAppAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Mail, Trash2, RefreshCw, Shield, AlertCircle, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
  created_at: string;
  expires_at: string;
  invited_by_name: string;
}

const roleLabels = {
  owner: 'Inhaber',
  admin: 'Administrator', 
  staff: 'Mitarbeiter'
};

const roleDescriptions = {
  owner: 'Vollzugriff auf alle Funktionen und Einstellungen',
  admin: 'Verwaltung von Projekten, Subunternehmern und Einstellungen',
  staff: 'Bearbeitung von Dokumenten und Reviews'
};

export default function RolesAccess() {
  const { profile } = useAppAuth();
  const { toast } = useToast();
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');
  const [inviting, setInviting] = useState(false);

  const canManageTeam = profile?.role === 'owner' || profile?.role === 'admin';
  const canInvite = canManageTeam;
  const canRemoveMembers = profile?.role === 'owner';

  useEffect(() => {
    if (profile?.tenant_id && canManageTeam) {
      fetchTeamData();
    }
  }, [profile?.tenant_id, canManageTeam]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at');

      if (membersError) throw membersError;
      setTeamMembers((members || []) as TeamMember[]);

      // Fetch pending invitations
      const { data: invitationsRaw, error: invitationsError } = await supabase
        .from('invitations')
        .select(`
          id,
          email, 
          role,
          created_at,
          expires_at,
          invited_by
        `)
        .eq('invitation_type', 'team')
        .eq('status', 'sent')
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) throw invitationsError;
      
      // Fetch inviter names separately to avoid relation issues
      const invitationsWithNames = await Promise.all(
        (invitationsRaw || []).map(async (inv) => {
          const { data: inviterData } = await supabase
            .from('users')
            .select('name')
            .eq('id', inv.invited_by)
            .single();
          
          return {
            id: inv.id,
            email: inv.email,
            role: inv.role as 'owner' | 'admin' | 'staff',
            created_at: inv.created_at,
            expires_at: inv.expires_at,
            invited_by_name: inviterData?.name || 'Unbekannt'
          };
        })
      );
      
      setPendingInvitations(invitationsWithNames);

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: 'Fehler',
        description: 'Team-Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim() || !profile?.tenant_id) return;

    try {
      setInviting(true);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: 'Benutzer bereits vorhanden',
          description: 'Diese E-Mail-Adresse ist bereits Teil Ihres Teams.',
          variant: 'destructive'
        });
        return;
      }

      // Send invitation via edge function
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          tenant_id: profile.tenant_id,
          invited_by: profile.id
        }
      });

      if (error) throw error;

      toast({
        title: 'Einladung versendet',
        description: `Eine Einladung wurde an ${inviteEmail} gesendet.`
      });

      setInviteEmail('');
      setInviteRole('staff');
      setInviteDialogOpen(false);
      await fetchTeamData();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      
      if (error.message?.includes('domain not allowed')) {
        toast({
          title: 'Domain nicht erlaubt',
          description: 'Diese E-Mail-Domain ist nicht in der Allowlist. Fügen Sie die Domain in den Systemeinstellungen hinzu.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Fehler beim Senden',
          description: 'Die Einladung konnte nicht versendet werden.',
          variant: 'destructive'
        });
      }
    } finally {
      setInviting(false);
    }
  };

  const resendInvitation = async (invitationId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke('resend-team-invitation', {
        body: { invitation_id: invitationId }
      });

      if (error) throw error;

      toast({
        title: 'Einladung erneut gesendet',
        description: `Eine neue Einladung wurde an ${email} gesendet.`
      });

      await fetchTeamData();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Fehler',
        description: 'Einladung konnte nicht erneut gesendet werden.',
        variant: 'destructive'
      });
    }
  };

  const cancelInvitation = async (invitationId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Einladung widerrufen',
        description: `Die Einladung für ${email} wurde widerrufen.`
      });

      await fetchTeamData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Fehler',
        description: 'Einladung konnte nicht widerrufen werden.',
        variant: 'destructive'
      });
    }
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    if (memberId === profile?.id) {
      toast({
        title: 'Nicht möglich',
        description: 'Sie können sich nicht selbst entfernen.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Mitglied entfernt',
        description: `${memberEmail} wurde aus dem Team entfernt.`
      });

      await fetchTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Fehler',
        description: 'Mitglied konnte nicht entfernt werden.',
        variant: 'destructive'
      });
    }
  };

  const changeRole = async (memberId: string, newRole: 'admin' | 'staff', memberEmail: string) => {
    if (memberId === profile?.id && profile?.role === 'owner') {
      toast({
        title: 'Nicht möglich',
        description: 'Sie können Ihre eigene Inhaber-Rolle nicht ändern.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Rolle geändert',
        description: `Die Rolle von ${memberEmail} wurde zu ${roleLabels[newRole]} geändert.`
      });

      await fetchTeamData();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: 'Fehler',
        description: 'Rolle konnte nicht geändert werden.',
        variant: 'destructive'
      });
    }
  };

  if (!canManageTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-professional">Rollen & Zugriffe</h1>
            <p className="text-muted-foreground">
              Team-Verwaltung und Berechtigungen
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sie haben keine Berechtigung, die Team-Verwaltung zu betreten. Nur Inhaber und Administratoren können Teams verwalten.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-professional">Rollen & Zugriffe</h1>
          <p className="text-muted-foreground">
            Team-Verwaltung und Berechtigungen
          </p>
        </div>
        {canInvite && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Mitglied einladen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Team-Mitglied einladen</DialogTitle>
                <DialogDescription>
                  Laden Sie ein neues Mitglied zu Ihrem Team ein.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="beispiel@unternehmen.de"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rolle</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'admin' | 'staff')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">
                        <div>
                          <div className="font-medium">{roleLabels.staff}</div>
                          <div className="text-sm text-muted-foreground">{roleDescriptions.staff}</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div>
                          <div className="font-medium">{roleLabels.admin}</div>
                          <div className="text-sm text-muted-foreground">{roleDescriptions.admin}</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={sendInvitation} disabled={!inviteEmail.trim() || inviting}>
                  {inviting ? 'Sende...' : 'Einladung senden'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Rollen-Übersicht
          </CardTitle>
          <CardDescription>
            Verstehen Sie die verschiedenen Rollen und deren Berechtigungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(roleLabels).map(([role, label]) => (
              <div key={role} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Badge variant="outline" className="mt-0.5">
                  {label}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">
                    {roleDescriptions[role as keyof typeof roleDescriptions]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team-Mitglieder ({teamMembers.length})
            </div>
            <Button variant="ghost" size="sm" onClick={fetchTeamData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Lade Team-Mitglieder...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Beigetreten</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {profile?.role === 'owner' && member.role !== 'owner' ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => changeRole(member.id, value as 'admin' | 'staff', member.email)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">{roleLabels.staff}</SelectItem>
                            <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">
                          {roleLabels[member.role]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.created_at), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right">
                      {canRemoveMembers && member.id !== profile?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mitglied entfernen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie {member.name} ({member.email}) wirklich aus dem Team entfernen?
                                Diese Aktion kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMember(member.id, member.email)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Entfernen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Ausstehende Einladungen ({pendingInvitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Keine ausstehenden Einladungen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Eingeladen von</TableHead>
                  <TableHead>Läuft ab</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabels[invitation.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>{invitation.invited_by_name}</TableCell>
                    <TableCell>
                      {format(new Date(invitation.expires_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendInvitation(invitation.id, invitation.email)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelInvitation(invitation.id, invitation.email)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}