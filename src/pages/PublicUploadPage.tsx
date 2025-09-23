import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { resolveMagicLink } from '@/services/magicLinks';
import { fetchLatestSnapshot, type DocRequirement } from '@/services/requirementsSnapshot';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Save,
  Smartphone,
  Camera,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface ContractorData {
  id: string;
  company_name: string;
  contact_email: string;
  tenant: {
    name: string;
    logo_url: string | null;
    locale_default?: string;
  };
}

export default function PublicUploadPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [contractor, setContractor] = useState<ContractorData | null>(null);
  const [requirements, setRequirements] = useState<DocRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRequirement, setSelectedRequirement] = useState<DocRequirement | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
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
      initializePublicUpload();
    }
  }, [token]);

  const getText = (key: string, fallback: string) => {
    const texts = {
      de: {
        loading: 'Lade Daten...',
        notFound: 'Link nicht gefunden',
        linkInvalid: 'Dieser Link ist ungültig oder abgelaufen.',
        uploadDocuments: 'Dokumente hochladen für',
        noRequirements: 'Keine Anforderungen hinterlegt',
        contactClient: 'Bitte wenden Sie sich an Ihren Auftraggeber.',
        yourProgress: 'Ihr Fortschritt',
        documentsUploaded: 'Dokumente hochgeladen',
        completed: 'Abgeschlossen',
        uploadNowButton: 'Jetzt hochladen',
        finish: 'Fertigstellen',
        requiredDocs: 'Pflichtnachweise',
        optionalDocs: 'Optionale Nachweise'
      },
      en: {
        loading: 'Loading data...',
        notFound: 'Link not found',
        linkInvalid: 'This link is invalid or expired.',
        uploadDocuments: 'Upload documents for',
        noRequirements: 'No requirements specified',
        contactClient: 'Please contact your client.',
        yourProgress: 'Your Progress',
        documentsUploaded: 'documents uploaded',
        completed: 'Completed',
        uploadNowButton: 'Upload now',
        finish: 'Finish',
        requiredDocs: 'Required Documents',
        optionalDocs: 'Optional Documents'
      }
    };
    return texts[locale]?.[key as keyof typeof texts['de']] || fallback;
  };

  const initializePublicUpload = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Step 1: Resolve magic link to get contractor ID
      console.info('[PublicUpload] Resolving magic link...');
      const resolved = await resolveMagicLink(token);
      
      // Step 2: Load contractor data from Supabase
      console.info('[PublicUpload] Loading contractor data:', resolved.contractorId);
      const { data: contractorData, error: contractorError } = await supabase
        .from('subcontractors')
        .select(`
          id,
          company_name,
          contact_email,
          tenant:tenants(name, logo_url, locale_default)
        `)
        .eq('id', resolved.contractorId)
        .single();

      if (contractorError || !contractorData) {
        throw new Error('Contractor not found');
      }

      // Step 3: Load requirements snapshot
      console.info('[PublicUpload] Loading requirements snapshot...');
      const snapshot = await fetchLatestSnapshot(resolved.contractorId);
      
      if (snapshot.length === 0) {
        console.warn('[PublicUpload] No requirements snapshot found');
      }

      setContractor(contractorData);
      setRequirements(snapshot);
      setLocale((contractorData.tenant?.locale_default as 'de' | 'en') || 'de');
      
    } catch (error: any) {
      console.error('[PublicUpload] Initialization failed:', error);
      toast({
        title: getText('notFound', 'Link nicht gefunden'),
        description: getText('linkInvalid', 'Dieser Link ist ungültig oder abgelaufen.'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.file || !selectedRequirement || !contractor || !token) return;

    try {
      setUploadLoading(true);
      setUploadProgress(10);

      // Upload file to storage
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${selectedRequirement.type}_${Date.now()}.${fileExt}`;
      const filePath = `${contractor.tenant.name}/${contractor.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // Create document record
      const { error: docError } = await supabase.functions.invoke('create-public-document', {
        body: {
          contractor_id: contractor.id,
          document_type: selectedRequirement.type,
          file_name: uploadData.file.name,
          file_url: filePath,
          file_size: uploadData.file.size,
          mime_type: uploadData.file.type,
          valid_from: uploadData.validFrom || null,
          valid_to: uploadData.validTo || null,
          document_number: uploadData.documentNumber || null,
          magic_token: token
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
      
    } catch (error: any) {
      console.error('[PublicUpload] Upload failed:', error);
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
          <p className="text-muted-foreground">{getText('loading', 'Lade Daten...')}</p>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {getText('notFound', 'Link nicht gefunden')}
            </h2>
            <p className="text-muted-foreground">
              {getText('linkInvalid', 'Dieser Link ist ungültig oder abgelaufen.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No requirements snapshot - show error state
  if (requirements.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {getText('noRequirements', 'Keine Anforderungen hinterlegt')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {getText('contactClient', 'Bitte wenden Sie sich an Ihren Auftraggeber.')}
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.close()}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Schließen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredRequirements = requirements.filter(r => r.requirement === 'required');
  const optionalRequirements = requirements.filter(r => r.requirement === 'optional');
  
  // For now, we assume all docs are uploaded if they exist in the snapshot
  // In a real implementation, you'd track upload status
  const completedCount = 0; // This would be calculated based on actual uploads
  const totalRequired = requiredRequirements.length;
  const progressPercent = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {contractor.tenant.logo_url ? (
              <img 
                src={contractor.tenant.logo_url} 
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
                {getText('uploadDocuments', 'Dokumente hochladen für')} {contractor.company_name}
              </h1>
              <p className="text-sm text-muted-foreground font-medium text-primary">
                {contractor.tenant.name}
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
        {requiredRequirements.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Upload className="mr-2 h-5 w-5 text-destructive" />
                {getText('requiredDocs', 'Pflichtnachweise')} ({requiredRequirements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredRequirements.map((requirement, index) => (
                <Card key={`${requirement.type}-${index}`} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} gap-4`}>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{requirement.label}</h3>
                          <Badge variant="destructive" className="text-xs">Pflicht</Badge>
                        </div>
                        {requirement.description && (
                          <p className="text-sm text-muted-foreground">
                            {requirement.description}
                          </p>
                        )}
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

        {/* Optional Documents */}
        {optionalRequirements.length > 0 && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                {getText('optionalDocs', 'Optionale Nachweise')} ({optionalRequirements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {optionalRequirements.map((requirement, index) => (
                <Card key={`${requirement.type}-${index}`} className="border-muted/20">
                  <CardContent className="p-4">
                    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} gap-4`}>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-muted-foreground">{requirement.label}</h3>
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </div>
                        {requirement.description && (
                          <p className="text-sm text-muted-foreground">
                            {requirement.description}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedRequirement(requirement);
                          setUploadDialogOpen(true);
                        }}
                        className={isMobile ? 'w-full' : ''}
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
            <DialogDescription>
              {selectedRequirement?.label}
            </DialogDescription>
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
                <div>
                  <Label htmlFor="doc-number">Dokumentennummer (optional)</Label>
                  <Input
                    id="doc-number" 
                    type="text"
                    value={uploadData.documentNumber}
                    onChange={(e) => setUploadData(prev => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="z.B. A1-123456"
                  />
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