import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComplianceStatusBadge } from './ComplianceStatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  XCircle,
  Users,
  Shield
} from 'lucide-react';

interface ValidationResult {
  valid: boolean;
  reason?: string;
  message?: string;
  missing_documents?: string[];
  compliance_status?: 'compliant' | 'non_compliant' | 'expiring_soon';
}

interface SubcontractorValidation {
  id: string;
  company_name: string;
  status: 'active' | 'inactive';
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  company_type: 'gbr' | 'baubetrieb' | 'einzelunternehmen';
  validation: ValidationResult | null;
  loading: boolean;
}

interface ProjectAssignmentValidatorProps {
  subcontractors: Array<{
    id: string;
    company_name: string;
    status: 'active' | 'inactive';
    compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
    company_type: 'gbr' | 'baubetrieb' | 'einzelunternehmen';
  }>;
  projectId: string;
  projectName: string;
  onAssignmentComplete?: () => void;
}

export function ProjectAssignmentValidator({ 
  subcontractors, 
  projectId, 
  projectName,
  onAssignmentComplete 
}: ProjectAssignmentValidatorProps) {
  const [validations, setValidations] = useState<Record<string, SubcontractorValidation>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateSubcontractor = async (subcontractorId: string) => {
        setValidations(prev => ({
          ...prev,
          [subcontractorId]: {
            ...prev[subcontractorId],
            loading: true
          } as SubcontractorValidation
        }));

    try {
      const { data, error } = await supabase.rpc('validate_subcontractor_for_project', {
        subcontractor_id_param: subcontractorId
      });

      if (error) throw error;

      const subcontractor = subcontractors.find(s => s.id === subcontractorId);
      if (!subcontractor) return;

      setValidations(prev => ({
        ...prev,
        [subcontractorId]: {
          id: subcontractor.id,
          company_name: subcontractor.company_name,
          status: subcontractor.status,
          compliance_status: subcontractor.compliance_status,
          company_type: subcontractor.company_type,
          validation: data as unknown as ValidationResult,
          loading: false
        }
      }));

    } catch (error) {
      console.error('Error validating subcontractor:', error);
      const subcontractor = subcontractors.find(s => s.id === subcontractorId);
      if (!subcontractor) return;

      setValidations(prev => ({
        ...prev,
        [subcontractorId]: {
          id: subcontractor.id,
          company_name: subcontractor.company_name,
          status: subcontractor.status,
          compliance_status: subcontractor.compliance_status,
          company_type: subcontractor.company_type,
          validation: {
            valid: false,
            reason: 'Validierungsfehler aufgetreten'
          },
          loading: false
        }
      }));

      toast({
        title: "Validierungsfehler",
        description: "Die Compliance-Prüfung konnte nicht durchgeführt werden.",
        variant: "destructive"
      });
    }
  };

  const validateAllSubcontractors = async () => {
    setLoading(true);
    try {
      await Promise.all(
        subcontractors.map(sub => validateSubcontractor(sub.id))
      );
      toast({
        title: "Validierung abgeschlossen",
        description: `${subcontractors.length} Nachunternehmer wurden auf Projekttauglichkeit geprüft.`
      });
    } finally {
      setLoading(false);
    }
  };

  const assignToProject = async (subcontractorId: string) => {
    const validation = validations[subcontractorId];
    if (!validation?.validation?.valid) {
      toast({
        title: "Zuweisung nicht möglich",
        description: "Nachunternehmer ist nicht compliance-konform.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if already assigned
      const { data: existingAssignment } = await supabase
        .from('project_subs')
        .select('id')
        .eq('project_id', projectId)
        .eq('subcontractor_id', subcontractorId)
        .single();

      if (existingAssignment) {
        toast({
          title: "Bereits zugewiesen",
          description: `${validation.company_name} ist bereits diesem Projekt zugewiesen.`,
          variant: "destructive"
        });
        return;
      }

      // Create project assignment
      const { error } = await supabase
        .from('project_subs')
        .insert({
          project_id: projectId,
          subcontractor_id: subcontractorId,
          overall_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Erfolgreich zugewiesen",
        description: `${validation.company_name} wurde dem Projekt "${projectName}" zugewiesen.`
      });

      onAssignmentComplete?.();

    } catch (error) {
      console.error('Error assigning subcontractor:', error);
      toast({
        title: "Zuweisungsfehler",
        description: "Nachunternehmer konnte nicht zugewiesen werden.",
        variant: "destructive"
      });
    }
  };

  const getCompanyTypeLabel = (type: string) => {
    switch (type) {
      case 'gbr': return 'GbR';
      case 'baubetrieb': return 'Baubetrieb';
      case 'einzelunternehmen': return 'Einzelunternehmen';
      default: return type;
    }
  };

  const getValidationIcon = (validation: ValidationResult | null) => {
    if (!validation) return <Clock className="h-4 w-4 text-muted-foreground" />;
    if (validation.valid) return <CheckCircle className="h-4 w-4 text-success" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const compliantSubcontractors = Object.values(validations).filter(v => v.validation?.valid);
  const nonCompliantSubcontractors = Object.values(validations).filter(v => v.validation && !v.validation.valid);

  return (
    <div className="space-y-6">
      {/* Header with Validation Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Projekt-Zuweisung Validator
              </CardTitle>
              <CardDescription>
                Prüfung der rechtlichen Compliance für Projektzuweisung: "{projectName}"
              </CardDescription>
            </div>
            <Button 
              onClick={validateAllSubcontractors}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {loading ? 'Prüfe...' : 'Alle Prüfen'}
            </Button>
          </div>
        </CardHeader>
        
        {Object.keys(validations).length > 0 && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{compliantSubcontractors.length}</div>
                <div className="text-sm text-muted-foreground">Projektbereit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{nonCompliantSubcontractors.length}</div>
                <div className="text-sm text-muted-foreground">Nicht bereit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{subcontractors.length}</div>
                <div className="text-sm text-muted-foreground">Gesamt</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Legal Notice */}
      <Alert className="border-destructive/50 bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Rechtlicher Hinweis:</strong> Nur compliance-konforme Nachunternehmer können Projekten zugewiesen werden. 
          Bei fehlenden Pflichtdokumenten bestehen rechtliche Haftungsrisiken für den Hauptunternehmer.
        </AlertDescription>
      </Alert>

      {/* Subcontractor Validation Results */}
      <div className="space-y-4">
        {subcontractors.map((subcontractor) => {
          const validation = validations[subcontractor.id];
          const isValidated = validation?.validation !== undefined;
          const canAssign = validation?.validation?.valid === true;

          return (
            <Card key={subcontractor.id} className={`${canAssign ? 'border-success/50' : isValidated ? 'border-destructive/50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getValidationIcon(validation?.validation || null)}
                    <div>
                      <h4 className="font-medium">{subcontractor.company_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getCompanyTypeLabel(subcontractor.company_type)}
                        </Badge>
                        <span>•</span>
                        <ComplianceStatusBadge 
                          complianceStatus={subcontractor.compliance_status}
                          subcontractorStatus={subcontractor.status}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!isValidated ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => validateSubcontractor(subcontractor.id)}
                        disabled={validation?.loading}
                      >
                        {validation?.loading ? 'Prüfe...' : 'Prüfen'}
                      </Button>
                    ) : canAssign ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Projektbereit
                        </Badge>
                        <Button 
                          size="sm"
                          onClick={() => assignToProject(subcontractor.id)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Zuweisen
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Nicht bereit
                      </Badge>
                    )}
                  </div>
                </div>
                
                {validation?.validation && !validation.validation.valid && (
                  <div className="mt-3 p-3 bg-destructive/5 rounded-lg">
                    <p className="text-sm text-destructive font-medium mb-2">
                      Projektzuweisung nicht möglich:
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {validation.validation.reason}
                    </p>
                    {validation.validation.missing_documents && validation.validation.missing_documents.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium text-destructive mb-1">Fehlende Dokumente:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {validation.validation.missing_documents.map((doc, index) => (
                            <li key={index}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {validation?.validation?.valid && (
                  <div className="mt-3 p-3 bg-success/5 rounded-lg">
                    <p className="text-sm text-success font-medium">
                      ✅ {validation.validation.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}