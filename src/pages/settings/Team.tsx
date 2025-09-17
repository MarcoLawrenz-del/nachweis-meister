import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Plus, Edit, Trash2, Shield, Crown, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { 
  listTeamMembers, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember, 
  subscribe,
  canEditMember,
  getRoleDisplayName,
  type TeamMember,
  type UserRole,
  getCurrentUserRole
} from '@/services/team.store';

export default function Team() {
  const { user } = useSupabaseAuthContext();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'staff' as UserRole });
  
  const currentUserRole = getCurrentUserRole();
  
  // Guard: return loading if no user context yet
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  useEffect(() => {
    const loadMembers = () => setMembers(listTeamMembers());
    
    // Ensure current user is in team
    const { ensureCurrentUserInTeam } = require('@/services/team.store');
    ensureCurrentUserInTeam();
    
    loadMembers();
    return subscribe(loadMembers);
  }, []);

  const handleInviteMember = async () => {
    if (!inviteData.name.trim() || !inviteData.email.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Felder aus.',
        variant: 'destructive'
      });
      return;
    }

    // Check for duplicate email
    const existingMember = members.find(m => m.email.toLowerCase() === inviteData.email.toLowerCase());
    if (existingMember) {
      toast({
        title: 'E-Mail bereits vorhanden',
        description: 'Ein Mitglied mit dieser E-Mail-Adresse existiert bereits.',
        variant: 'destructive'
      });
      return;
    }

    try {
      createTeamMember({
        name: inviteData.name.trim(),
        email: inviteData.email.trim().toLowerCase(),
        role: inviteData.role,
        invited_by: 'current-user'
      });

      toast({
        title: 'Mitglied eingeladen',
        description: `${inviteData.name} wurde erfolgreich zum Team hinzugefügt.`
      });

      setInviteData({ name: '', email: '', role: 'staff' });
      setShowInviteDialog(false);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Mitglied konnte nicht hinzugefügt werden.',
        variant: 'destructive'
      });
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;

    try {
      updateTeamMember(editingMember.id, {
        role: editingMember.role
      });

      toast({
        title: 'Rolle aktualisiert',
        description: `Die Rolle von ${editingMember.name} wurde erfolgreich geändert.`
      });

      setEditingMember(null);
      setShowEditDialog(false);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Rolle konnte nicht geändert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Möchten Sie ${member.name} wirklich aus dem Team entfernen?`)) {
      return;
    }

    try {
      deleteTeamMember(member.id);

      toast({
        title: 'Mitglied entfernt',
        description: `${member.name} wurde aus dem Team entfernt.`
      });
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Mitglied konnte nicht entfernt werden.',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'staff': return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'staff': return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team verwalten</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Teammitglieder und deren Rollen
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Mitglied einladen
        </Button>
      </div>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teammitglieder ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Teammitglieder vorhanden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Hinzugefügt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         {getRoleIcon(member.role)}
                         <Badge variant={getRoleBadgeVariant(member.role)}>
                           {getRoleDisplayName(member.role)}
                         </Badge>
                         {member.id === 'current-user' && (
                           <Badge variant="outline" className="text-xs">Sie</Badge>
                         )}
                       </div>
                     </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEditMember(currentUserRole, member.role) && member.id !== 'current-user' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingMember(member);
                                    setShowEditDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bearbeiten</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Entfernen</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                         )}
                         {member.id === 'current-user' && (
                           <Badge variant="outline" className="text-xs">Sie</Badge>
                         )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Rollenbeschreibungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Crown className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium">Inhaber</div>
                <div className="text-sm text-muted-foreground">
                  Vollzugriff auf alle Funktionen, kann andere Inhaber ernennen
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Administrator</div>
                <div className="text-sm text-muted-foreground">
                  Kann Teammitglieder verwalten und Einstellungen ändern
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Mitarbeiter</div>
                <div className="text-sm text-muted-foreground">
                  Kann Nachunternehmer und Dokumente verwalten
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Teammitglied einladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Das Mitglied wird direkt zum Team hinzugefügt. In der Demo-Version werden keine E-Mails versendet.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                placeholder="Max Mustermann"
                value={inviteData.name}
                onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-Mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="max@unternehmen.de"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Rolle</Label>
              <Select value={inviteData.role} onValueChange={(value: UserRole) => setInviteData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Mitarbeiter</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  {currentUserRole === 'owner' && (
                    <SelectItem value="owner">Inhaber</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleInviteMember}>
              Einladen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle bearbeiten</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4">
              <div>
                <Label>Mitglied</Label>
                <p className="text-sm font-medium">{editingMember.name} ({editingMember.email})</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Neue Rolle</Label>
                <Select 
                  value={editingMember.role} 
                  onValueChange={(value: UserRole) => setEditingMember(prev => prev ? { ...prev, role: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Mitarbeiter</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    {currentUserRole === 'owner' && (
                      <SelectItem value="owner">Inhaber</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditMember}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}