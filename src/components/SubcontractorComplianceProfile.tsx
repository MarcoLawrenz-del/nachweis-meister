import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ComplianceStatusBadge } from './ComplianceStatusBadge';
import { DocumentUpload } from './DocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  FileText, 
  Upload,
  Scale,
  RefreshCw,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DocumentType {
  id: string;
  code: string;
  name_de: string;
  description_de: string;
  required_by_default: boolean;
  sort_order: number;
}

interface RequirementStatus {
  id: string;
  status: 'missing' | 'in_review' | 'valid' | 'expired' | 'expiring';
  due_date: string | null;
  document_type: DocumentType;
  documents: Array<{
    id: string;
    file_name: string;
    valid_from: string | null;
    valid_to: string | null;
    uploaded_at: string;
  }>;
}

interface SubcontractorCompliance {
  id: string;
  company_name: string;
  status: 'active' | 'inactive';
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  activation_date: string | null;
  next_reminder_date: string | null;
  last_compliance_check: string;
}

interface SubcontractorComplianceProfileProps {
  subcontractorId: string;
  projectSubId?: string; // Optional for standalone profile view
}

export function SubcontractorComplianceProfile({ 
  subcontractorId, 
  projectSubId 
}: SubcontractorComplianceProfileProps) {
  const [subcontractor, setSubcontractor] = useState<SubcontractorCompliance | null>(null);
  const [requirements, setRequirements] = useState<RequirementStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchComplianceData();
    }
  }, [profile?.tenant_id, subcontractorId, projectSubId]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSubcontractorCompliance(),
        fetchRequirements()
      ]);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcontractorCompliance = async () => {
    if (!profile?.tenant_id) return;

    const { data, error } = await supabase
      .from('subcontractors')
      .select(`
        id,
        company_name,
        status,
        compliance_status,
        activation_date,
        next_reminder_date,
        last_compliance_check
      `)
      .eq('id', subcontractorId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (error) throw error;
    setSubcontractor({
      ...data,
      status: data.status as 'active' | 'inactive',
      compliance_status: data.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon'
    });
  };

  const fetchRequirements = async () => {
    if (!projectSubId) {
      // If no project_sub_id, create requirements for all document types
      await createStandaloneRequirements();
      return;
    }

    const { data, error } = await supabase
      .from('requirements')
      .select(`
        id,
        status,
        due_date,
        document_type:document_types (
          id,
          code,
          name_de,
          description_de,
          required_by_default,
          sort_order
        ),
        documents (
          id,
          file_name,
          valid_from,
          valid_to,
          uploaded_at
        )
      `)
      .eq('project_sub_id', projectSubId)
      .order('document_type.sort_order');

    if (error) throw error;
    const processedRequirements = data?.map(req => ({
      ...req,
      status: req.status as 'missing' | 'in_review' | 'valid' | 'expired' | 'expiring'
    })) || [];
    setRequirements(processedRequirements);
  };

  const createStandaloneRequirements = async () => {
    // For standalone profile view, we need to create a temporary project_sub
    // or handle requirements differently
    // For now, we'll fetch document types and show them as potential requirements
    const { data: documentTypes, error } = await supabase
      .from('document_types')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    const mockRequirements: RequirementStatus[] = documentTypes?.map(dt => ({
      id: `temp-${dt.id}`,
      status: 'missing' as const,
      due_date: null,
      document_type: dt,
      documents: []
    })) || [];

    setRequirements(mockRequirements);
  };

  const refreshCompliance = async () => {
    if (!subcontractor) return;

    try {
      setRefreshing(true);
      
      // Call the compliance calculation function
      const { error } = await supabase.rpc('calculate_subcontractor_compliance', {
        subcontractor_id_param: subcontractor.id
      });

      if (error) throw error;

      // Also calculate reminder dates
      await supabase.rpc('calculate_next_reminder_date', {
        subcontractor_id_param: subcontractor.id
      });

      toast({
        title: "Compliance-Status aktualisiert",
        description: "Der rechtliche Status wurde neu berechnet."
      });

      await fetchComplianceData();
    } catch (error) {
      console.error('Error refreshing compliance:', error);
      toast({
        title: "Fehler",
        description: "Compliance-Status konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'in_review':
        return <FileText className="h-4 w-4 text-primary" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground">Gültig</Badge>;
      case 'expiring':
        return <Badge className="bg-warning text-warning-foreground">Läuft ab</Badge>;
      case 'expired':
        return <Badge variant="destructive">Abgelaufen</Badge>;
      case 'in_review':
        return <Badge variant="secondary">In Prüfung</Badge>;
      default:
        return <Badge variant="outline">Fehlend</Badge>;
    }
  };

  const calculateComplianceProgress = () => {
    const mandatoryRequirements = requirements.filter(r => r.document_type.required_by_default);
    const validMandatory = mandatoryRequirements.filter(r => r.status === 'valid');
    return mandatoryRequirements.length > 0 ? (validMandatory.length / mandatoryRequirements.length) * 100 : 0;
  };

  if (loading || !subcontractor) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mandatoryRequirements = requirements.filter(r => r.document_type.required_by_default);
  const optionalRequirements = requirements.filter(r => !r.document_type.required_by_default);
  const complianceProgress = calculateComplianceProgress();

  return (
    <div className="space-y-6">
      {/* Compliance Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Rechtlicher Compliance-Status
              </CardTitle>
              <CardDescription>
                Überprüfung der gesetzlich erforderlichen Dokumente für {subcontractor.company_name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshCompliance}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
              <ComplianceStatusBadge 
                complianceStatus={subcontractor.compliance_status}
                subcontractorStatus={subcontractor.status}
                size="lg"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Compliance-Fortschritt</p>
              <div className="space-y-2">
                <Progress value={complianceProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(complianceProgress)}% der Pflichtdokumente vollständig
                </p>
              </div>
            </div>
            
            {subcontractor.activation_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Aktiviert seit</p>
                <p className="text-sm font-semibold">
                  {format(new Date(subcontractor.activation_date), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
            )}
            
            {subcontractor.next_reminder_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Nächste Erinnerung</p>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(subcontractor.next_reminder_date), 'dd.MM.yyyy', { locale: de })}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legal Warning */}
      <Alert className="border-destructive/50 bg-destructive/5">
        <Scale className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Rechtlicher Hinweis:</strong> Pflichtdokumente sind gesetzlich erforderlich. 
          Bei fehlenden Dokumenten können Werklohn-Zurückbehaltungsrechte geltend gemacht werden.
          Der Hauptunternehmer haftet für Sozialabgaben und Mindestlohn, wenn entsprechende Nachweise fehlen.
        </AlertDescription>
      </Alert>

      {/* Mandatory Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Pflichtdokumente ({mandatoryRequirements.length})
            <Badge variant="destructive" className="ml-2">Rechtlich erforderlich</Badge>
          </CardTitle>
          <CardDescription>
            Diese Dokumente sind gesetzlich vorgeschrieben und müssen vollständig und gültig vorliegen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mandatoryRequirements.map((requirement) => (
            <div key={requirement.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {getStatusIcon(requirement.status)}
                  <div>
                    <h4 className="font-medium">{requirement.document_type.name_de}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {requirement.document_type.description_de}
                    </p>
                  </div>
                </div>
                {getStatusBadge(requirement.status)}
              </div>
              
              {requirement.documents.length > 0 && (
                <div className="space-y-2 mb-3">
                  {requirement.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.valid_from && doc.valid_to ? (
                            `Gültig: ${format(new Date(doc.valid_from), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(doc.valid_to), 'dd.MM.yyyy', { locale: de })}`
                          ) : (
                            `Hochgeladen: ${format(new Date(doc.uploaded_at), 'dd.MM.yyyy', { locale: de })}`
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {projectSubId && (
                <DocumentUpload
                  requirement={{
                    id: requirement.id,
                    status: requirement.status,
                    due_date: requirement.due_date,
                    document_type: requirement.document_type,
                    documents: requirement.documents.map(doc => ({
                      ...doc,
                      file_size: 0,
                      mime_type: '',
                      uploaded_by: null,
                      file_url: ''
                    }))
                  }}
                  subcontractorName={subcontractor.company_name}
                  onUploadComplete={fetchComplianceData}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optional Documents */}
      {optionalRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
              Empfohlene Dokumente ({optionalRequirements.length})
              <Badge variant="secondary" className="ml-2">Optional</Badge>
            </CardTitle>
            <CardDescription>
              Rechtlich nicht zwingend erforderlich, aber empfohlen für zusätzliche Rechtssicherheit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionalRequirements.map((requirement) => (
              <div key={requirement.id} className="border rounded-lg p-4 opacity-75">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(requirement.status)}
                    <div>
                      <h4 className="font-medium">{requirement.document_type.name_de}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {requirement.document_type.description_de}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(requirement.status)}
                </div>
                
                {requirement.documents.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {requirement.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div>
                          <p className="text-sm font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.valid_from && doc.valid_to ? (
                              `Gültig: ${format(new Date(doc.valid_from), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(doc.valid_to), 'dd.MM.yyyy', { locale: de })}`
                            ) : (
                              `Hochgeladen: ${format(new Date(doc.uploaded_at), 'dd.MM.yyyy', { locale: de })}`
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {projectSubId && (
                  <DocumentUpload
                    requirement={{
                      id: requirement.id,
                      status: requirement.status,
                      due_date: requirement.due_date,
                      document_type: requirement.document_type,
                      documents: requirement.documents.map(doc => ({
                        ...doc,
                        file_size: 0,
                        mime_type: '',
                        uploaded_by: null,
                        file_url: ''
                      }))
                    }}
                    subcontractorName={subcontractor.company_name}
                    onUploadComplete={fetchComplianceData}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}