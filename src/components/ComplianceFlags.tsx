import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle, Users, Globe, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComplianceFlagsProps {
  subcontractorId: string;
  currentFlags: {
    requires_employees?: boolean | null;
    has_non_eu_workers?: boolean | null;
    employees_not_employed_in_germany?: boolean | null;
  };
  onFlagsUpdate?: (flags: any) => void;
  onCompute?: () => void;
}

export function ComplianceFlags({ 
  subcontractorId, 
  currentFlags, 
  onFlagsUpdate,
  onCompute 
}: ComplianceFlagsProps) {
  const [flags, setFlags] = useState(currentFlags);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [computeResult, setComputeResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFlagChange = (flagName: string, value: boolean) => {
    const newFlags = { ...flags, [flagName]: value };
    setFlags(newFlags);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update(flags)
        .eq('id', subcontractorId);

      if (error) throw error;

      toast({
        title: 'Compliance-Flags aktualisiert',
        description: 'Die Einstellungen wurden erfolgreich gespeichert.',
      });

      onFlagsUpdate?.(flags);
    } catch (error: any) {
      console.error('Error updating flags:', error);
      toast({
        title: 'Fehler',
        description: 'Die Flags konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComputeRequirements = async () => {
    setComputing(true);
    setComputeResult(null);
    
    try {
      // First save current flags
      await handleSave();
      
      // Then compute requirements
      const { data, error } = await supabase.functions.invoke('compute-requirements', {
        body: { subcontractor_id: subcontractorId }
      });

      if (error) throw error;

      setComputeResult(data);
      onCompute?.();

      toast({
        title: 'Pflichtdokumente berechnet',
        description: `${data.created_requirements} neue Requirements erstellt, ${data.warning_count} Warnungen gefunden.`,
      });
    } catch (error: any) {
      console.error('Error computing requirements:', error);
      toast({
        title: 'Fehler',
        description: 'Die Pflichtdokumente konnten nicht berechnet werden.',
        variant: 'destructive',
      });
    } finally {
      setComputing(false);
    }
  };

  const getFlagDescription = (flagName: string): string => {
    switch (flagName) {
      case 'requires_employees':
        return 'Hat Angestellte (löst zusätzliche Nachweise aus: BG-Mitgliedschaft, SOKA, Unbedenklichkeit, monatliche Mindestlohnerklärung)';
      case 'has_non_eu_workers':
        return 'Beschäftigt Nicht-EU-Arbeitnehmer (erfordert Aufenthalts-/Arbeitserlaubnis)';
      case 'employees_not_employed_in_germany': 
        return 'Entsendung aus dem Ausland (erfordert A1-Bescheinigung und GZD-Meldung)';
      default:
        return '';
    }
  };

  const getFlagIcon = (flagName: string) => {
    switch (flagName) {
      case 'requires_employees':
        return <Users className="h-4 w-4" />;
      case 'has_non_eu_workers':
        return <Globe className="h-4 w-4" />;
      case 'employees_not_employed_in_germany':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Compliance-Einstellungen
        </CardTitle>
        <CardDescription>
          Diese Einstellungen bestimmen, welche Dokumente für diesen Nachunternehmer erforderlich sind.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {Object.entries(flags).map(([flagName, value]) => (
            <div key={flagName} className="flex items-start space-x-3 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                {getFlagIcon(flagName)}
                <Switch
                  id={flagName}
                  checked={value === true}
                  onCheckedChange={(checked) => handleFlagChange(flagName, checked)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor={flagName} className="text-sm font-medium">
                  {flagName === 'requires_employees' && 'Beschäftigt Angestellte'}
                  {flagName === 'has_non_eu_workers' && 'Nicht-EU-Arbeitnehmer'}
                  {flagName === 'employees_not_employed_in_germany' && 'Auslandsentsendung'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {getFlagDescription(flagName)}
                </p>
              </div>
              <Badge variant={value === true ? 'default' : 'outline'}>
                {value === true ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            variant="outline"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Einstellungen speichern
          </Button>
          
          <Button 
            onClick={handleComputeRequirements} 
            disabled={computing}
          >
            {computing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Pflichtdokumente neu berechnen
          </Button>
        </div>

        {computeResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Berechnung erfolgreich:</strong></p>
                <ul className="text-sm space-y-1">
                  <li>• {computeResult.created_requirements} neue Requirements erstellt</li>
                  <li>• {computeResult.updated_requirements} bestehende Requirements aktualisiert</li>
                  <li>• {computeResult.warning_count} aktive Warnungen</li>
                  <li>• Status: {computeResult.subcontractor_active ? 'Aktiv' : 'Inaktiv'}</li>
                  <li>• Rechtsform: {computeResult.company_type}</li>
                </ul>
                
                {computeResult.warnings && computeResult.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-sm">Aktive Warnungen:</p>
                    <ul className="text-xs space-y-1 ml-2">
                      {computeResult.warnings.map((warning: any, index: number) => (
                        <li key={index}>
                          • {warning.document_name}: {warning.status}
                          {warning.due_date && ` (fällig: ${new Date(warning.due_date).toLocaleDateString('de-DE')})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}