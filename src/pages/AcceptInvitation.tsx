import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/ROUTES';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError('Ungültiger Einladungslink');
      setLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          users!invitations_invited_by_fkey(name),
          tenants!users_tenant_id_fkey(name)
        `)
        .eq('token', token)
        .eq('status', 'sent')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setError('Einladung nicht gefunden oder abgelaufen');
        return;
      }

      setInvitation(data);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Fehler beim Laden der Einladung');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!name.trim()) {
      setError('Bitte geben Sie Ihren Namen ein');
      return;
    }

    if (!password || password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    try {
      setAccepting(true);
      setError('');

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${ROUTES.dashboard}`
        }
      });

      if (authError) {
        throw authError;
      }

      // If user is created, create their profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            tenant_id: invitation.tenant_id,
            name: name.trim(),
            email: invitation.email,
            role: invitation.role
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't throw here as user is already created
        }

        // Mark invitation as accepted
        await supabase
          .from('invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);

        toast({
          title: 'Einladung angenommen',
          description: 'Ihr Konto wurde erfolgreich erstellt. Sie werden weitergeleitet...'
        });

        // Redirect to dashboard
        setTimeout(() => {
          navigate(ROUTES.dashboard);
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Fehler beim Annehmen der Einladung');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-pulse">Lade Einladung...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/login')}>
                Zur Anmeldung
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels = {
    admin: 'Administrator',
    staff: 'Mitarbeiter'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Team-Einladung</CardTitle>
          <CardDescription>
            Sie wurden zu <strong>{invitation?.tenants?.name}</strong> eingeladen
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm">
              <div><strong>E-Mail:</strong> {invitation?.email}</div>
              <div><strong>Rolle:</strong> {roleLabels[invitation?.role as keyof typeof roleLabels]}</div>
              <div><strong>Eingeladen von:</strong> {invitation?.users?.name}</div>
            </div>
          </div>

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={(e) => { e.preventDefault(); acceptInvitation(); }} className="space-y-4">
            <div>
              <Label htmlFor="name">Ihr vollständiger Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Passwort erstellen</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={accepting}
            >
              {accepting ? 'Erstelle Konto...' : 'Einladung annehmen'}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            Mit der Annahme der Einladung stimmen Sie unseren Nutzungsbedingungen zu.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}