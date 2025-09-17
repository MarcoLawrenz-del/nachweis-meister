import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import DragDropUpload from '@/components/DragDropUpload';
import { DocumentTypeTooltip } from '@/components/DocumentTypeTooltip';
import { WORDING } from '@/content/wording';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Save,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface Invitation {
  id: string;
  email: string;
  project_sub: {
    id: string;
    project: {
      name: string;
      code: string;
      tenant: {
        name: string;
        logo_url: string | null;
        locale_default?: string;
      };
    };
    subcontractor: {
      company_name: string;
    };
  };
}

interface Requirement {
  id: string;
  status: 'missing' | 'submitted' | 'in_review' | 'valid' | 'expiring' | 'expired' | 'rejected';
  due_date: string | null;
  document_type: {
    name_de: string;
    code: string;
    description_de: string;
    required_by_default: boolean;
  };
  documents: Document[];
}

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  valid_from: string | null;
  valid_to: string | null;
  uploaded_at: string;
}

export default function PublicUpload() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [locale, setLocale] = useState<'de' | 'en'>('de');
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    validFrom: '',
    validTo: '',
    documentNumber: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchInvitationData();
    }
  }, [token]);

  const getText = (key: string, fallback: string) => {
    // Simple i18n helper
    const texts = {
      de: {
        uploadInvitation: 'Lade Einladungsdaten...',
        invitationNotFound: 'Einladung nicht gefunden',
        invitationInvalid: 'Diese Einladung ist ungültig oder abgelaufen.',
        uploadDocuments: 'Nachweise hochladen für',
        onlyRequired: 'Es werden ausschließlich Pflichtnachweise angefordert.',
        yourProgress: 'Ihr Fortschritt',
        documentsUploaded: 'Dokumente hochgeladen',
        completed: 'Abgeschlossen',
        uploadNowButton: 'Jetzt hochladen',
        finish: 'Fertigstellen'
      },
      en: {
        uploadInvitation: 'Loading invitation data...',
        invitationNotFound: 'Invitation not found',
        invitationInvalid: 'This invitation is invalid or expired.',
        uploadDocuments: 'Upload documents for',
        onlyRequired: 'Only required documents are requested.',
        yourProgress: 'Your Progress',
        documentsUploaded: 'documents uploaded',
        completed: 'Completed',
        uploadNowButton: 'Upload now',
        finish: 'Finish'
      }
    };
    return texts[locale]?.[key as keyof typeof texts['de']] || fallback;
  };

  const fetchInvitationData = async () => {
    if (!token) return;

    try {
      const { data: inviteResponse, error } = await supabase.functions.invoke('get-invitation-data', {
        body: { token }
      });

      if (error || !inviteResponse?.data) throw new Error('Invitation not found');
      
      setInvitation(inviteResponse.data);
      setLocale(inviteResponse.data.project_sub?.project?.tenant?.locale_default || 'de');
      setRequirements((inviteResponse.requirements || []).map((req: any) => ({
        ...req,
        status: req.status as 'missing' | 'submitted' | 'in_review' | 'valid' | 'expiring' | 'expired' | 'rejected'
      })));
    } catch (error: any) {
      console.error('Error fetching invitation data:', error);
      toast({
        title: getText('invitationNotFound', 'Einladung nicht gefunden'),
        description: getText('invitationInvalid', 'Diese Einladung ist ungültig oder abgelaufen.'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.file || !selectedRequirement || !invitation) return;

    try {
      setUploadLoading(true);
      setUploadProgress(10);

      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${selectedRequirement.document_type.code}_${Date.now()}.${fileExt}`;
      const filePath = `${invitation.project_sub.project.tenant.name}/${selectedRequirement.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      const { error: docError } = await supabase.functions.invoke('create-public-document', {
        body: {
          requirement_id: selectedRequirement.id,
          file_name: uploadData.file.name,
          file_url: filePath,
          file_size: uploadData.file.size,
          mime_type: uploadData.file.type,
          valid_from: uploadData.validFrom || null,
          valid_to: uploadData.validTo || null,
          document_number: uploadData.documentNumber || null,
          invitation_token: token,
          new_status: 'submitted'
        }
      });

      if (docError) throw docError;
      setUploadProgress(100);

      toast({
        title: "Upload erfolgreich",
        description: `${uploadData.file.name} wurde zur Prüfung übermittelt.`,
      });

      setUploadData({ file: null, validFrom: '', validTo: '', documentNumber: '' });
      setSelectedRequirement(null);
      setUploadDialogOpen(false);
      
      setTimeout(() => fetchInvitationData(), 1000);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload-Fehler",
        description: error.message || "Dokument konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{getText('uploadInvitation', 'Lade Einladungsdaten...')}</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {getText('invitationNotFound', 'Einladung nicht gefunden')}
            </h2>
            <p className="text-muted-foreground">
              {getText('invitationInvalid', 'Diese Einladung ist ungültig oder bereits abgelaufen.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredRequirements = requirements.filter(r => r.document_type.required_by_default);
  const completedRequired = requiredRequirements.filter(r => 
    r.documents.length > 0 || ['valid', 'submitted', 'in_review'].includes(r.status)
  );
  const totalRequired = requiredRequirements.length;
  const completedCount = completedRequired.length;
  const progressPercent = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;
  
  const openRequirements = requiredRequirements.filter(r => 
    r.status === 'missing' || r.status === 'rejected' || (r.documents.length === 0)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {invitation.project_sub.project.tenant.logo_url ? (
              <img 
                src={invitation.project_sub.project.tenant.logo_url} 
                alt="Logo" 
                className="h-12 w-12 object-contain rounded"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold">
                {getText('uploadDocuments', 'Nachweise hochladen für')} {invitation.project_sub.project.name}
              </h1>
              <p className="text-sm text-muted-foreground font-medium text-primary">
                {getText('onlyRequired', 'Es werden ausschließlich Pflichtnachweise angefordert.')}
              </p>
              {isMobile && (
                <div className="flex items-center gap-1 mt-1">
                  <Smartphone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {locale === 'de' ? 'Mobil-optimiert' : 'Mobile optimized'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Progress */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{getText('yourProgress', 'Ihr Fortschritt')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {completedCount} {locale === 'de' ? 'von' : 'of'} {totalRequired} {getText('documentsUploaded', 'Dokumente hochgeladen')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
                  <div className="text-xs text-muted-foreground">{getText('completed', 'Abgeschlossen')}</div>
                </div>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        {openRequirements.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Upload className="mr-2 h-5 w-5 text-destructive" />
                Pflichtnachweise ({openRequirements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {openRequirements.map((requirement) => (
                <Card key={requirement.id} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} gap-4`}>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{requirement.document_type.name_de}</h3>
                          <DocumentTypeTooltip code={requirement.document_type.code} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {requirement.document_type.description_de}
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedRequirement(requirement);
                          setUploadDialogOpen(true);
                        }}
                        className={`bg-primary hover:bg-primary/90 ${isMobile ? 'w-full' : ''}`}
                      >
                        {isMobile ? <Camera className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {getText('uploadNowButton', 'Jetzt hochladen')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completion */}
        {progressPercent === 100 && (
          <Card className="border-success bg-success/5">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-success mb-2">
                {locale === 'de' ? 'Upload abgeschlossen!' : 'Upload completed!'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {locale === 'de' 
                  ? 'Alle erforderlichen Dokumente wurden eingereicht.'
                  : 'All required documents have been submitted.'
                }
              </p>
              <Button onClick={() => window.close()}>
                {getText('finish', 'Fertigstellen')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className={`${isMobile ? 'sm:max-w-[95vw] h-[90vh] overflow-y-auto' : 'sm:max-w-md'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isMobile ? <Camera className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              Datei hochladen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <DragDropUpload
              onFileSelect={(file) => setUploadData(prev => ({ ...prev, file }))}
              selectedFile={uploadData.file}
              uploading={uploadLoading}
              uploadProgress={uploadProgress}
              onCancel={() => setUploadData(prev => ({ ...prev, file: null }))}
            />

            {uploadData.file && !uploadLoading && (
              <div className="space-y-4">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  <div>
                    <Label htmlFor="valid-from">Gültig von</Label>
                    <Input
                      id="valid-from"
                      type="date"
                      value={uploadData.validFrom}
                      onChange={(e) => setUploadData(prev => ({ ...prev, validFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid-to">Gültig bis</Label>
                    <Input
                      id="valid-to"
                      type="date"
                      value={uploadData.validTo}
                      onChange={(e) => setUploadData(prev => ({ ...prev, validTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className={isMobile ? 'flex-col space-y-2' : ''}>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              className={isMobile ? 'w-full' : ''}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={!uploadData.file || uploadLoading}
              className={isMobile ? 'w-full' : ''}
            >
              {uploadLoading ? 'Lade hoch...' : 'Hochladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}