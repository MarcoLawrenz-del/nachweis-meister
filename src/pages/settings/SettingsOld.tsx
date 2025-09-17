import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAppAuth } from '@/hooks/useAppAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings as SettingsIcon, User, Building, Mail, Plus, Trash2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DomainAllowlist {
  id: string;
  domain: string;
  created_at: string;
}

export default function Settings() {
  const { profile } = useAppAuth();
  const { toast } = useToast();
  const [domains, setDomains] = useState<DomainAllowlist[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDomains, setLoadingDomains] = useState(true);

  const canManageDomains = profile?.role === 'owner' || profile?.role === 'admin';

  useEffect(() => {
    if (canManageDomains && profile?.tenant_id) {
      fetchDomains();
    }
  }, [canManageDomains, profile?.tenant_id]);

  const fetchDomains = async () => {
    try {
      setLoadingDomains(true);
      const { data, error } = await supabase
        .from('tenant_domain_allowlists')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('domain');

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: 'Fehler',
        description: 'Domain-Allowlist konnte nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoadingDomains(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim() || !profile?.tenant_id) return;

    // Simple domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(newDomain.trim())) {
      toast({
        title: 'Ungültige Domain',
        description: 'Bitte geben Sie eine gültige Domain ein (z.B. unternehmen.de).',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('tenant_domain_allowlists')
        .insert({
          tenant_id: profile.tenant_id,
          domain: newDomain.trim().toLowerCase(),
          created_by: profile.id
        });

      if (error) throw error;

      setNewDomain('');
      await fetchDomains();
      toast({
        title: 'Domain hinzugefügt',
        description: `Die Domain "${newDomain.trim()}" wurde zur Allowlist hinzugefügt.`
      });
    } catch (error: any) {
      console.error('Error adding domain:', error);
      if (error.code === '23505') {
        toast({
          title: 'Domain bereits vorhanden',
          description: 'Diese Domain ist bereits in der Allowlist.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Fehler',
          description: 'Domain konnte nicht hinzugefügt werden.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const removeDomain = async (domainId: string, domain: string) => {
    try {
      const { error } = await supabase
        .from('tenant_domain_allowlists')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      await fetchDomains();
      toast({
        title: 'Domain entfernt',
        description: `Die Domain "${domain}" wurde aus der Allowlist entfernt.`
      });
    } catch (error) {
      console.error('Error removing domain:', error);
      toast({
        title: 'Fehler',
        description: 'Domain konnte nicht entfernt werden.',
        variant: 'destructive'
      });
    }
  };

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
                <Badge variant="outline" className="capitalize">
                  {profile?.role || 'Nicht verfügbar'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tenant ID</label>
                <p className="text-xs font-mono text-muted-foreground">{profile?.tenant_id || 'Nicht verfügbar'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Magic Link Domain Allowlist - Only for Owners/Admins */}
        {canManageDomains && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Magic Link Domain-Allowlist
              </CardTitle>
              <CardDescription>
                Beschränken Sie Magic Link Anmeldungen auf bestimmte E-Mail-Domains (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Optional:</strong> Wenn keine Domains konfiguriert sind, sind Magic Links für alle E-Mail-Adressen verfügbar. 
                  Sobald Sie Domains hinzufügen, werden Magic Links nur für diese Domains erlaubt.
                </AlertDescription>
              </Alert>

              {/* Add Domain Form */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="domain">Neue Domain hinzufügen</Label>
                  <Input
                    id="domain"
                    placeholder="z.B. unternehmen.de"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addDomain} disabled={loading || !newDomain.trim()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
              </div>

              {/* Domain List */}
              <div className="space-y-2">
                <Label>Erlaubte Domains ({domains.length})</Label>
                {loadingDomains ? (
                  <div className="text-sm text-muted-foreground">Lade Domains...</div>
                ) : domains.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                    Keine Domains konfiguriert - Magic Links sind für alle E-Mail-Adressen verfügbar
                  </div>
                ) : (
                  <div className="space-y-2">
                    {domains.map((domain) => (
                      <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{domain.domain}</span>
                          <p className="text-xs text-muted-foreground">
                            Hinzugefügt am {new Date(domain.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDomain(domain.id, domain.domain)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">SSO-Anmeldung</p>
                  <p className="text-sm text-muted-foreground">Microsoft, Google und Magic Link verfügbar</p>
                </div>
                <Badge variant="outline" className="text-success">Aktiv</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Rollenmodell</p>
                  <p className="text-sm text-muted-foreground">Owner, Admin, Staff Rollen implementiert</p>
                </div>
                <Badge variant="outline" className="text-success">Aktiv</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}