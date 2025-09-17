import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePackages, type DocumentSelection } from '@/hooks/usePackages';
import { WORDING } from '@/content/wording';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PackageWizardProps {
  projectId?: string;
  subcontractorId?: string;
  onComplete?: () => void;
}

export function PackageWizard({ projectId, subcontractorId, onComplete }: PackageWizardProps) {
  const navigate = useNavigate();
  const { projectId: urlProjectId, subcontractorId: urlSubcontractorId } = useParams<{
    projectId: string;
    subcontractorId: string;
  }>();
  
  // Use props first, then URL params as fallback
  const finalProjectId = projectId || urlProjectId;
  const finalSubcontractorId = subcontractorId || urlSubcontractorId;
  const { toast } = useToast();
  const { packages, loading, error, loadPackageItems, getDefaultPackage, createDocumentSelection } = usePackages();
  
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [documentSelections, setDocumentSelections] = useState<DocumentSelection[]>([]);
  const [sending, setSending] = useState(false);
  const [locale] = useState<'de' | 'en'>('de'); // Default to German, can be made dynamic

  // Initialize with default package
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageId) {
      const defaultPackage = getDefaultPackage();
      if (defaultPackage) {
        setSelectedPackageId(defaultPackage.id);
        handlePackageSelection(defaultPackage.id);
      }
    }
  }, [packages]);

  const handlePackageSelection = async (packageId: string) => {
    setSelectedPackageId(packageId);
    const items = await loadPackageItems(packageId);
    const selections = createDocumentSelection(items);
    setDocumentSelections(selections);
  };

  const toggleDocumentSelection = (documentTypeId: string) => {
    setDocumentSelections(prev =>
      prev.map(selection =>
        selection.document_type_id === documentTypeId
          ? { ...selection, is_selected: !selection.is_selected }
          : selection
      )
    );
  };

  const toggleDocumentRequired = (documentTypeId: string) => {
    setDocumentSelections(prev =>
      prev.map(selection =>
        selection.document_type_id === documentTypeId
          ? { ...selection, is_required: !selection.is_required }
          : selection
      )
    );
  };

  const sendInvitation = async () => {
    if (!finalProjectId || !finalSubcontractorId) {
      toast({
        title: 'Fehler',
        description: 'Projekt oder Subunternehmer fehlt',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSending(true);
      
      // Get selected documents
      const selectedDocuments = documentSelections.filter(sel => sel.is_selected);
      
      if (selectedDocuments.length === 0) {
        toast({
          title: 'Fehler',
          description: 'Bitte wählen Sie mindestens ein Dokument aus',
          variant: 'destructive'
        });
        return;
      }

      // Create project_sub entry first
      const { data: projectSub, error: projectSubError } = await supabase
        .from('project_subs')
        .insert({
          project_id: finalProjectId,
          subcontractor_id: finalSubcontractorId,
          status: 'active'
        })
        .select()
        .single();

      if (projectSubError) throw projectSubError;

      // Create requirements for selected documents
      const requirementInserts = selectedDocuments.map(doc => ({
        project_sub_id: projectSub.id,
        document_type_id: doc.document_type_id,
        status: 'missing' as const,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }));

      const { error: requirementsError } = await supabase
        .from('requirements')
        .insert(requirementInserts);

      if (requirementsError) throw requirementsError;

      // Get subcontractor and project details for the invitation
      const { data: subcontractor } = await supabase
        .from('subcontractors')
        .select('company_name, contact_email')
        .eq('id', finalSubcontractorId)
        .single();

      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', finalProjectId)
        .single();

      if (!subcontractor || !project) {
        throw new Error('Subcontractor or project not found');
      }

      // Generate invitation token
      const invitationToken = crypto.randomUUID();

      // Create invitation
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          email: subcontractor.contact_email,
          token: invitationToken,
          subject: `Dokumentenanforderung - ${project.name}`,
          message: `Bitte laden Sie die folgenden Dokumente für das Projekt "${project.name}" hoch:\n\n${
            selectedDocuments.map(doc => {
              const docType = documentSelections.find(d => d.document_type_id === doc.document_type_id);
              return `• ${docType ? 'Document' : 'Document'} ${doc.is_required ? '(Pflicht)' : '(Optional)'}`;
            }).join('\n')
          }\n\nLink zum Upload: ${window.location.origin}/upload/${invitationToken}`,
          invited_by: (await supabase.auth.getUser()).data.user?.id!,
          project_sub_id: projectSub.id,
          invitation_type: 'project'
        });

      // Send invitation email using edge function
      const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: subcontractor.contact_email,
          subject: `Dokumentenanforderung - ${project.name}`,
          message: `Bitte laden Sie die folgenden Dokumente für das Projekt "${project.name}" hoch:\n\n${
            selectedDocuments.map(doc => {
              const docType = documentSelections.find(d => d.document_type_id === doc.document_type_id);
              return `• Document ${doc.document_type_id.slice(-4)} ${doc.is_required ? '(Pflicht)' : '(Optional)'}`;
            }).join('\n')
          }\n\nLink zum Upload: ${window.location.origin}/upload/${invitationToken}`,
          subcontractorName: subcontractor.company_name,
          projectName: project.name
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the whole process if email fails
      }

      toast({
        title: 'Einladung versendet',
        description: `Einladung wurde an ${subcontractor.contact_email} gesendet`
      });

      if (onComplete) {
        onComplete();
      } else {
        navigate(-1);
      }

    } catch (err: any) {
      console.error('Error sending invitation:', err);
      toast({
        title: 'Fehler',
        description: err.message || 'Fehler beim Versenden der Einladung',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const selectedDocuments = documentSelections.filter(sel => sel.is_selected);
  const requiredDocuments = selectedDocuments.filter(sel => sel.is_required);
  const optionalDocuments = selectedDocuments.filter(sel => !sel.is_required);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">{WORDING.packageWizard[locale]}</h1>
        <p className="text-muted-foreground mt-2">
          {WORDING.fullControl[locale]}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Package Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{WORDING.selectPackage[locale]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedPackageId === pkg.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handlePackageSelection(pkg.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {locale === 'de' ? pkg.name_de : pkg.name_en}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'de' ? pkg.description_de : pkg.description_en}
                    </p>
                  </div>
                  {selectedPackageId === pkg.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Document Customization */}
        {documentSelections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{WORDING.customizeDocuments[locale]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentSelections.map((selection) => (
                  <div key={selection.document_type_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selection.is_selected}
                        onCheckedChange={() => toggleDocumentSelection(selection.document_type_id)}
                      />
                      <div>
                        <span className="font-medium">Document Type {selection.document_type_id.slice(-4)}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={selection.is_required ? "default" : "secondary"}>
                            {selection.is_required ? WORDING.documentRequired[locale] : WORDING.documentOptional[locale]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {selection.is_selected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDocumentRequired(selection.document_type_id)}
                      >
                        {selection.is_required ? 'Als Optional markieren' : 'Als Pflicht markieren'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary and Send */}
      {selectedDocuments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{WORDING.invitationSummary[locale]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {requiredDocuments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    {WORDING.requiredDocuments[locale]} ({requiredDocuments.length})
                  </h4>
                  <ul className="space-y-1">
                    {requiredDocuments.map((doc) => (
                      <li key={doc.document_type_id} className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">Pflicht</Badge>
                        <span className="text-sm">Document {doc.document_type_id.slice(-4)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {optionalDocuments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    {WORDING.optionalDocuments[locale]} ({optionalDocuments.length})
                  </h4>
                  <ul className="space-y-1">
                    {optionalDocuments.map((doc) => (
                      <li key={doc.document_type_id} className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Optional</Badge>
                        <span className="text-sm">Document {doc.document_type_id.slice(-4)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Separator className="my-4" />
            
            <div className="flex justify-end">
              <Button
                onClick={sendInvitation}
                disabled={sending || selectedDocuments.length === 0}
                className="min-w-32"
              >
                {sending ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {WORDING.sendInvitation[locale]}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PackageWizard;