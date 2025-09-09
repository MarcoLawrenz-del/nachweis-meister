import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ComplianceStatusBadge } from './ComplianceStatusBadge';
import { SubcontractorComplianceProfile } from './SubcontractorComplianceProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users,
  FileText,
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  AlertTriangle,
  Building2
} from 'lucide-react';

interface ComplianceFlowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface SubcontractorData {
  id: string;
  company_name: string;
  company_type: 'gbr' | 'baubetrieb' | 'einzelunternehmen';
  status: 'active' | 'inactive';
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  contact_email: string;
}

interface ComplianceFlowProps {
  subcontractorId: string;
  onFlowComplete?: () => void;
}

export function ComplianceFlow({ 
  subcontractorId, 
  onFlowComplete 
}: ComplianceFlowProps) {
  const [subcontractor, setSubcontractor] = useState<SubcontractorData | null>(null);
  const [steps, setSteps] = useState<ComplianceFlowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchFlowData();
    }
  }, [profile?.tenant_id, subcontractorId]);

  const fetchFlowData = async () => {
    try {
      setLoading(true);

      // Fetch subcontractor data
      const { data: subData, error: subError } = await supabase
        .from('subcontractors')
        .select('id, company_name, company_type, status, compliance_status, contact_email')
        .eq('id', subcontractorId)
        .single();

      if (subError) throw subError;
      setSubcontractor({
        ...subData,
        company_type: subData.company_type as 'gbr' | 'baubetrieb' | 'einzelunternehmen',
        status: subData.status as 'active' | 'inactive',
        compliance_status: subData.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon'
      });

      // Define compliance workflow steps
      const flowSteps: Omit<ComplianceFlowStep, 'completed' | 'current'>[] = [
        {
          id: 'subcontractor_setup',
          title: 'Nachunternehmer anlegen',
          description: 'Grundlegende Firmendaten und Kontaktinformationen erfassen',
          icon: Users
        },
        {
          id: 'documents_upload',
          title: 'Chargenpflichtige Dokumente hochladen',
          description: 'Alle 8 Pflichtdokumente nach deutschen Baurechts-Standards bereitstellen',
          icon: FileText
        },
        {
          id: 'compliance_validation',
          title: 'Automatische Compliance-Prüfung',
          description: 'System validiert Vollständigkeit und Gültigkeit aller Dokumente',
          icon: Shield
        },
        {
          id: 'auto_activation',
          title: 'Status automatisch auf "aktuell aktiv"',
          description: 'Bei vollständiger Compliance erfolgt automatische Aktivierung',
          icon: Zap
        }
      ];

      // Check completion status for each step
      const completedSteps: ComplianceFlowStep[] = await Promise.all(
        flowSteps.map(async (step, index) => {
          let completed = false;

          switch (step.id) {
            case 'subcontractor_setup':
              completed = !!(subData.company_name && subData.contact_email && subData.company_type);
              break;
            
            case 'documents_upload':
              // Check if all 8 mandatory documents are uploaded
              const { data: mandatoryDocs } = await supabase
                .from('requirements')
                .select(`
                  status,
                  document_type:document_types (
                    required_by_default
                  )
                `)
                .eq('project_sub.subcontractor_id', subcontractorId)
                .eq('document_type.required_by_default', true);

              const uploadedMandatory = mandatoryDocs?.filter(d => d.status !== 'missing').length || 0;
              completed = uploadedMandatory >= 8; // All 8 mandatory docs
              break;
            
            case 'compliance_validation':
              completed = subData.compliance_status === 'compliant' || subData.compliance_status === 'expiring_soon';
              break;
            
            case 'auto_activation':
              completed = subData.status === 'active' && subData.compliance_status === 'compliant';
              break;
          }

          return {
            ...step,
            completed,
            current: false
          };
        })
      );

      // Determine current step
      const currentStepIndex = completedSteps.findIndex(step => !step.completed);
      const validCurrentIndex = currentStepIndex === -1 ? completedSteps.length - 1 : currentStepIndex;
      
      if (validCurrentIndex >= 0 && validCurrentIndex < completedSteps.length) {
        completedSteps[validCurrentIndex].current = true;
      }

      setSteps(completedSteps);

    } catch (error) {
      console.error('Error fetching flow data:', error);
      toast({
        title: "Fehler",
        description: "Workflow-Daten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const activateSubcontractor = async () => {
    if (!subcontractor || subcontractor.compliance_status !== 'compliant') return;

    try {
      setActivating(true);

      // Run compliance calculation with new function
      const { error: calcError } = await supabase.rpc('calculate_subcontractor_compliance', {
        subcontractor_id_param: subcontractorId
      });

      if (calcError) throw calcError;

      // Calculate reminder dates
      await supabase.rpc('calculate_next_reminder_date', {
        subcontractor_id_param: subcontractorId
      });

      toast({
        title: "Nachunternehmer aktiviert",
        description: `${subcontractor.company_name} ist jetzt für Projektzuweisungen verfügbar.`
      });

      onFlowComplete?.();
      await fetchFlowData(); // Refresh data

    } catch (error) {
      console.error('Error activating subcontractor:', error);
      toast({
        title: "Aktivierungsfehler",
        description: "Nachunternehmer konnte nicht aktiviert werden.",
        variant: "destructive"
      });
    } finally {
      setActivating(false);
    }
  };

  const getStepIcon = (step: ComplianceFlowStep) => {
    const IconComponent = step.icon;
    if (step.completed) {
      return <CheckCircle className="h-6 w-6 text-success" />;
    } else if (step.current) {
      return <IconComponent className="h-6 w-6 text-primary" />;
    } else {
      return <IconComponent className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const completedStepsCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedStepsCount / totalSteps) * 100 : 0;
  const canActivate = steps.slice(0, 3).every(step => step.completed) && subcontractor?.status === 'inactive';

  if (loading || !subcontractor) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Flow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Rechtssicherheits-Flow: {subcontractor.company_name}
              </CardTitle>
              <CardDescription>
                Rechtskonforme Nachunternehmer-Aufnahme nach deutschen Baurechts-Standards
              </CardDescription>
            </div>
            <ComplianceStatusBadge 
              complianceStatus={subcontractor.compliance_status}
              subcontractorStatus={subcontractor.status}
              size="lg"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Workflow-Fortschritt</span>
                <span>{completedStepsCount} von {totalSteps} Schritten abgeschlossen</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {canActivate && (
              <Alert className="border-success/50 bg-success/5">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    <strong>Bereit für automatische Aktivierung:</strong> Alle Chargenpflichtigen Dokumente sind vollständig.
                  </span>
                  <Button 
                    size="sm"
                    onClick={activateSubcontractor}
                    disabled={activating}
                    className="ml-4"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {activating ? 'Aktiviere...' : 'Status aktivieren'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>UX-Flow: Rechtssichere Aufnahme</CardTitle>
          <CardDescription>
            „Subunternehmer anlegen" → „Dokumente hochladen" → „Status aktivieren" → „Bei Projektzuweisung prüfen"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${step.current ? 'text-primary' : step.completed ? 'text-success' : 'text-muted-foreground'}`}>
                        {step.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {step.completed && (
                          <Badge className="bg-success text-success-foreground text-xs">
                            Abgeschlossen
                          </Badge>
                        )}
                        {step.current && (
                          <Badge variant="secondary" className="text-xs">
                            Aktueller Schritt
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="ml-3 mt-4 mb-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section - Current Step */}
      {steps[1]?.current && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Chargenpflichtige Dokumente hochladen
            </CardTitle>
            <CardDescription>
              Alle 8 Pflichtdokumente nach deutschen Baurechts-Standards für rechtskonforme Compliance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubcontractorComplianceProfile 
              subcontractorId={subcontractorId}
            />
          </CardContent>
        </Card>
      )}

      {/* Rechtssicherheits-Hinweis */}
      <Alert className="border-primary/50 bg-primary/5">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Rechtssichere Compliance:</strong> Dieser Workflow gewährleistet die Einhaltung aller 
          gesetzlichen Anforderungen nach deutschem Baurecht. Ohne vollständige Compliance ist eine Projektzuweisung blockiert.
          Das Ampelsystem zeigt den Status: <strong className="text-success">Grün = aktiv</strong>, 
          <strong className="text-destructive"> Rot = fehlt etwas/abgelaufen</strong>.
        </AlertDescription>
      </Alert>
    </div>
  );
}