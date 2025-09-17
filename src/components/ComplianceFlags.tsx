import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Users, Globe, FileText } from 'lucide-react';
import { useComplianceEngine } from '@/hooks/useComplianceEngine';
import { SubcontractorFlags, ComputeRequirementsResponse } from '@/types/compliance';

interface ComplianceFlagsProps {
  subcontractorId: string;
  currentFlags: SubcontractorFlags;
  onFlagsUpdate?: (flags: SubcontractorFlags) => void;
  onCompute?: () => void;
}

export function ComplianceFlags({ 
  subcontractorId, 
  currentFlags, 
  onFlagsUpdate,
  onCompute 
}: ComplianceFlagsProps) {
  const [flags, setFlags] = useState<SubcontractorFlags>(currentFlags);
  const [computeResult, setComputeResult] = useState<ComputeRequirementsResponse | null>(null);
  
  const { updateSubcontractorFlags, computeRequirements, isLoading } = useComplianceEngine({
    onSuccess: () => {
      onFlagsUpdate?.(flags);
      onCompute?.();
    }
  });

  const handleFlagChange = (flagName: string, value: boolean) => {
    const newFlags = { ...flags, [flagName]: value };
    setFlags(newFlags);
  };

  const handleSave = async () => {
    const success = await updateSubcontractorFlags(subcontractorId, flags);
    if (success) {
      onFlagsUpdate?.(flags);
    }
  };

  const handleComputeRequirements = async () => {
    const result = await computeRequirements(subcontractorId);
    if (result) {
      setComputeResult(result);
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
          Erweiterte Einstellungen
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
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Einstellungen speichern
          </Button>
          
          <Button 
            onClick={handleComputeRequirements} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
                  <li>• Status: {computeResult.subcontractor_global_active ? 'Aktiv' : 'Inaktiv'}</li>
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