import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createMagicLink, resolveMagicLink } from '@/services/magicLinks';
import { storeSnapshot } from '@/services/requirementsSnapshot';
import { ExternalLink, Copy, Trash2, TestTube2, Database, Link as LinkIcon, Eye, Zap } from 'lucide-react';

interface Subcontractor {
  id: string;
  company_name: string;
  contact_email: string;
}

interface LogEntry {
  timestamp: string;
  step: string;
  data: any;
}

export default function MagicLinkTests() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const [newSubcontractor, setNewSubcontractor] = useState({
    company_name: '',
    contact_email: ''
  });
  const [magicLinkData, setMagicLinkData] = useState<{token: string; url: string} | null>(null);
  const [resolvedData, setResolvedData] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubcontractors();
    
    // Listen to console logs for magic-link events
    const originalLog = console.info;
    console.info = (...args) => {
      originalLog(...args);
      if (args[0] === '[magic-link]' || args[0]?.includes?.('[magic-link]')) {
        addLog('console.info', args);
      }
    };

    return () => {
      console.info = originalLog;
    };
  }, []);

  const addLog = (step: string, data: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      step,
      data: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    }].slice(-20)); // Keep last 20 logs
  };

  const loadSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('id, company_name, contact_email')
        .limit(20);
      
      if (error) throw error;
      setSubcontractors(data || []);
    } catch (error: any) {
      toast({
        title: "Fehler beim Laden",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createTestSubcontractor = async () => {
    if (!newSubcontractor.company_name || !newSubcontractor.contact_email) {
      toast({
        title: "Felder fehlen",
        description: "Firmenname und E-Mail sind erforderlich",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get current user's tenant ID
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', userData.user.id)
        .single();
      
      if (!userProfile?.tenant_id) throw new Error('No tenant found');
      
      const { data, error } = await supabase
        .from('subcontractors')
        .insert({
          company_name: newSubcontractor.company_name,
          contact_email: newSubcontractor.contact_email,
          tenant_id: userProfile.tenant_id,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setSubcontractors(prev => [...prev, data]);
      setSelectedSubcontractor(data.id);
      setNewSubcontractor({ company_name: '', contact_email: '' });
      
      addLog('subcontractor_created', { id: data.id, company: data.company_name });
      
      toast({
        title: "Subunternehmer erstellt",
        description: `${data.company_name} wurde erfolgreich erstellt`
      });
    } catch (error: any) {
      toast({
        title: "Erstellungsfehler",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const writeCurrentSnapshot = async () => {
    if (!selectedSubcontractor) {
      toast({
        title: "Kein Subunternehmer gewählt",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create mock requirements for testing
      const mockRequirements = [
        {
          type: 'GEWERBEANMELDUNG',
          label: 'Gewerbeanmeldung',
          description: 'Aktueller Gewerbeschein',
          requirement: 'required' as const
        },
        {
          type: 'VERSICHERUNG_BETRIEB',
          label: 'Betriebshaftpflichtversicherung',
          description: 'Nachweis der Betriebshaftpflichtversicherung',
          requirement: 'required' as const
        },
        {
          type: 'MITARBEITERVERZEICHNIS',
          label: 'Mitarbeiterverzeichnis',
          description: 'Liste aller Mitarbeiter auf der Baustelle',
          requirement: 'optional' as const
        }
      ];

      await storeSnapshot(selectedSubcontractor, mockRequirements);
      
      addLog('snapshot_written', { 
        contractorId: selectedSubcontractor, 
        requirementsCount: mockRequirements.length 
      });
      
      toast({
        title: "Snapshot geschrieben",
        description: `${mockRequirements.length} Anforderungen gespeichert`
      });
    } catch (error: any) {
      toast({
        title: "Snapshot-Fehler",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestMagicLink = async () => {
    if (!selectedSubcontractor) {
      toast({
        title: "Kein Subunternehmer gewählt",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const result = await createMagicLink(selectedSubcontractor);
      setMagicLinkData(result);
      
      addLog('magic_link_created', {
        token: result.token.substring(0, 8) + '...',
        url: result.url
      });
      
      toast({
        title: "Magic Link erstellt",
        description: "Link wurde erfolgreich generiert"
      });
    } catch (error: any) {
      toast({
        title: "Magic Link Fehler",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testResolveLink = async () => {
    if (!magicLinkData) {
      toast({
        title: "Kein Magic Link vorhanden",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const resolved = await resolveMagicLink(magicLinkData.token);
      setResolvedData(resolved);
      
      addLog('magic_link_resolved', resolved);
      
      toast({
        title: "Magic Link aufgelöst",
        description: `Contractor ID: ${resolved.contractorId}`
      });
    } catch (error: any) {
      toast({
        title: "Resolve-Fehler",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async () => {
    if (!magicLinkData) {
      toast({
        title: "Kein Magic Link vorhanden",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('magic_links')
        .update({ expires_at: new Date().toISOString() })
        .eq('token', magicLinkData.token);
      
      if (error) throw error;
      
      addLog('token_revoked', { token: magicLinkData.token.substring(0, 8) + '...' });
      
      toast({
        title: "Token widerrufen",
        description: "Magic Link ist jetzt ungültig"
      });
    } catch (error: any) {
      toast({
        title: "Widerruf-Fehler",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert",
      description: "Text wurde in die Zwischenablage kopiert"
    });
  };

  const selectedSub = subcontractors.find(s => s.id === selectedSubcontractor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Magic Link Tests</h1>
        <p className="text-muted-foreground">End-to-End Testing für Magic Links ohne CLI</p>
      </div>

      {/* Section 1: Subcontractor Selection/Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            1. Subunternehmer wählen/erstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bestehenden Subunternehmer wählen</Label>
              <Select value={selectedSubcontractor} onValueChange={setSelectedSubcontractor}>
                <SelectTrigger>
                  <SelectValue placeholder="Subunternehmer auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {subcontractors.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.company_name} ({sub.contact_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Oder neuen Demo-Nutzer anlegen</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Firmenname"
                  value={newSubcontractor.company_name}
                  onChange={(e) => setNewSubcontractor(prev => ({ ...prev, company_name: e.target.value }))}
                />
                <Input
                  placeholder="E-Mail"
                  type="email"
                  value={newSubcontractor.contact_email}
                  onChange={(e) => setNewSubcontractor(prev => ({ ...prev, contact_email: e.target.value }))}
                />
                <Button onClick={createTestSubcontractor} disabled={loading}>
                  Erstellen
                </Button>
              </div>
            </div>
          </div>
          
          {selectedSub && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedSub.company_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSub.contact_email}</p>
                </div>
                <Badge variant="outline">Gewählt</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Snapshot Writing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            2. Snapshot schreiben
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Schreibt die aktuellen Anforderungen nach public.contractor_requirements
          </p>
          <Button 
            onClick={writeCurrentSnapshot} 
            disabled={!selectedSubcontractor || loading}
            className="w-full md:w-auto"
          >
            <Zap className="h-4 w-4 mr-2" />
            Snapshot jetzt schreiben
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: Magic Link Creation & Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            3. Magic Link erstellen & testen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={createTestMagicLink} 
              disabled={!selectedSubcontractor || loading}
            >
              Magic Link erstellen
            </Button>
            
            {magicLinkData && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(magicLinkData.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  In neuem Tab öffnen
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={testResolveLink}
                  disabled={loading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  /resolve testen
                </Button>
              </>
            )}
          </div>

          {magicLinkData && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(magicLinkData.token)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-xs break-all">{magicLinkData.token}</code>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">URL:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(magicLinkData.url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-xs break-all">{magicLinkData.url}</code>
            </div>
          )}

          {resolvedData && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Resolve-Ergebnis:</h4>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(resolvedData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Token Revocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            4. Token widerrufen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Macht den Token ungültig. Test: /upload/&lt;token&gt; zeigt dann 404-UI.
          </p>
          <Button 
            variant="destructive" 
            onClick={revokeToken} 
            disabled={!magicLinkData || loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Token widerrufen
          </Button>
        </CardContent>
      </Card>

      {/* Live Log Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Live-Log Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">Keine Logs vorhanden...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="p-2 bg-muted rounded text-xs font-mono">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="text-xs">{log.step}</Badge>
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap">{log.data}</pre>
                </div>
              ))
            )}
          </div>
          {logs.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLogs([])} 
              className="mt-2"
            >
              Logs löschen
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}