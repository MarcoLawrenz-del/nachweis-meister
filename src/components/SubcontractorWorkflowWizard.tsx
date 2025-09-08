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
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users,
  FileText,
  Shield,
  ArrowRight,
  ArrowLeft,
  Zap
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface SubcontractorWorkflow {
  id: string;
  company_name: string;
  company_type: 'gbr' | 'baubetrieb' | 'einzelunternehmen';
  status: 'active' | 'inactive';
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  contact_email: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  canActivate: boolean;
}

interface SubcontractorWorkflowWizardProps {
  subcontractorId: string;
  onWorkflowComplete?: () => void;
}

export function SubcontractorWorkflowWizard({ 
  subcontractorId, 
  onWorkflowComplete 
}: SubcontractorWorkflowWizardProps) {
  const [workflow, setWorkflow] = useState<SubcontractorWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchWorkflowData();
    }
  }, [profile?.tenant_id, subcontractorId]);

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);

      // Fetch subcontractor data
      const { data: subcontractor, error: subError } = await supabase
        .from('subcontractors')
        .select(`
          id,
          company_name,
          company_type,
          status,
          compliance_status,
          contact_email
        `)
        .eq('id', subcontractorId)
        .single();

      if (subError) throw subError;

      // Define workflow steps based on company type
      const baseSteps: Omit<WorkflowStep, 'completed' | 'current'>[] = [
        {
          id: 'company_setup',
          title: 'Unternehmensdaten erfassen',
          description: 'Grundlegende Firmendaten und Kontaktinformationen',
          icon: Users
        },
        {
          id: 'document_upload',
          title: 'Pflichtdokumente hochladen',
          description: 'Alle rechtlich erforderlichen Nachweise bereitstellen',
          icon: FileText
        },
        {
          id: 'compliance_check',
          title: 'Compliance-Prüfung',
          description: 'Automatische Validierung der rechtlichen Konformität',
          icon: Shield
        },
        {
          id: 'activation',
          title: 'Aktivierung',
          description: 'Nachunternehmer für Projektzuweisungen freischalten',
          icon: Zap
        }
      ];

      // Check completion status for each step
      const steps: WorkflowStep[] = await Promise.all(
        baseSteps.map(async (step, index) => {
          let completed = false;

          switch (step.id) {
            case 'company_setup':
              completed = !!(subcontractor.company_name && subcontractor.contact_email && subcontractor.company_type);
              break;
            
            case 'document_upload':
              // Check if mandatory documents are uploaded
              const { data: documents } = await supabase
                .from('requirements')
                .select(`
                  status,
                  document_type:document_types (
                    required_by_default
                  )
                `)
                .eq('project_sub.subcontractor_id', subcontractorId)
                .eq('document_type.required_by_default', true);

              const mandatoryDocCount = await getMandatoryDocumentCount(subcontractor.company_type);
              const uploadedCount = documents?.filter(d => d.status !== 'missing').length || 0;
              completed = uploadedCount >= mandatoryDocCount;
              break;
            
            case 'compliance_check':
              completed = subcontractor.compliance_status === 'compliant' || subcontractor.compliance_status === 'expiring_soon';
              break;
            
            case 'activation':
              completed = subcontractor.status === 'active';
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
      const currentStepIndex = steps.findIndex(step => !step.completed);
      const validCurrentIndex = currentStepIndex === -1 ? steps.length - 1 : currentStepIndex;
      
      if (validCurrentIndex >= 0 && validCurrentIndex < steps.length) {
        steps[validCurrentIndex].current = true;
      }

      const canActivate = steps.slice(0, 3).every(step => step.completed) && subcontractor.status === 'inactive';

      setWorkflow({
        id: subcontractor.id,
        company_name: subcontractor.company_name,
        company_type: subcontractor.company_type as 'gbr' | 'baubetrieb' | 'einzelunternehmen',
        status: subcontractor.status as 'active' | 'inactive',
        compliance_status: subcontractor.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon',
        contact_email: subcontractor.contact_email,
        steps,
        currentStepIndex: validCurrentIndex,
        canActivate
      });

    } catch (error) {
      console.error('Error fetching workflow data:', error);
      toast({
        title: "Fehler",
        description: "Workflow-Daten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMandatoryDocumentCount = async (companyType: string): Promise<number> => {
    const { data } = await supabase
      .from('document_types')
      .select('id')
      .eq('required_by_default', true);

    let count = data?.length || 0;
    
    // Adjust for company type (Einzelunternehmen has one optional document)
    if (companyType === 'einzelunternehmen') {
      count = Math.max(0, count - 1); // BG membership is optional
    }

    return count;
  };

  const activateSubcontractor = async () => {
    if (!workflow?.canActivate) return;

    try {
      setActivating(true);

      // Run compliance calculation
      const { error: calcError } = await supabase.rpc('calculate_subcontractor_compliance_by_type', {
        subcontractor_id_param: subcontractorId
      });

      if (calcError) throw calcError;

      // Calculate reminder dates
      await supabase.rpc('calculate_next_reminder_date', {
        subcontractor_id_param: subcontractorId
      });

      toast({
        title: "Nachunternehmer aktiviert",
        description: `${workflow.company_name} ist jetzt aktiv und kann Projekten zugewiesen werden.`
      });

      onWorkflowComplete?.();
      await fetchWorkflowData(); // Refresh data

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

  const getCompanyTypeLabel = (type: string) => {
    switch (type) {
      case 'gbr': return 'Gesellschaft bürgerlichen Rechts (GbR)';
      case 'baubetrieb': return 'Baubetrieb / Dienstleister';
      case 'einzelunternehmen': return 'Einzelunternehmen (Solo)';
      default: return type;
    }
  };

  const getStepIcon = (step: WorkflowStep) => {
    const IconComponent = step.icon;
    if (step.completed) {
      return <CheckCircle className="h-6 w-6 text-success" />;
    } else if (step.current) {
      return <IconComponent className="h-6 w-6 text-primary" />;
    } else {
      return <IconComponent className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const completedSteps = workflow?.steps.filter(s => s.completed).length || 0;
  const totalSteps = workflow?.steps.length || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  if (loading || !workflow) {
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
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Nachunternehmer-Workflow: {workflow.company_name}
              </CardTitle>
              <CardDescription>
                {getCompanyTypeLabel(workflow.company_type)} • {workflow.contact_email}
              </CardDescription>
            </div>
            <ComplianceStatusBadge 
              complianceStatus={workflow.compliance_status}
              subcontractorStatus={workflow.status}
              size="lg"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Workflow-Fortschritt</span>
                <span>{completedSteps} von {totalSteps} Schritten abgeschlossen</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {workflow.canActivate && (
              <Alert className="border-success/50 bg-success/5">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    <strong>Bereit zur Aktivierung:</strong> Alle Voraussetzungen sind erfüllt.
                  </span>
                  <Button 
                    size="sm"
                    onClick={activateSubcontractor}
                    disabled={activating}
                    className="ml-4"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {activating ? 'Aktiviere...' : 'Jetzt Aktivieren'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow-Schritte</CardTitle>
          <CardDescription>
            Folgen Sie diesen Schritten für eine rechtskonforme Nachunternehmer-Aufnahme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workflow.steps.map((step, index) => (
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
                
                {index < workflow.steps.length - 1 && (
                  <div className="ml-3 mt-4 mb-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Management Section */}
      {workflow.steps[1]?.current && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Dokumente-Management
            </CardTitle>
            <CardDescription>
              Laden Sie alle rechtlich erforderlichen Dokumente für die Unternehmensform "{getCompanyTypeLabel(workflow.company_type)}" hoch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubcontractorComplianceProfile 
              subcontractorId={subcontractorId}
              // Note: This would need a project_sub_id for full functionality
              // For standalone use, the component handles this case
            />
          </CardContent>
        </Card>
      )}

      {/* Legal Notice */}
      <Alert className="border-primary/50 bg-primary/5">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Rechtliche Compliance:</strong> Dieser Workflow stellt sicher, dass alle gesetzlichen Anforderungen 
          nach deutschem Baurecht erfüllt werden. Nur aktivierte Nachunternehmer können Projekten zugewiesen werden.
        </AlertDescription>
      </Alert>
    </div>
  );
}