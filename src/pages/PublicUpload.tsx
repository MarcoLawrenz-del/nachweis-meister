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
import HelpTooltip from '@/components/HelpTooltip';
import { DocumentTypeTooltip } from '@/components/DocumentTypeTooltip';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  Save,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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
      };
    };
    subcontractor: {
      company_name: string;
    };
  };
}

interface Requirement {
  id: string;
  status: 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired';
  due_date: string | null;
  document_type: {
    name_de: string;
    code: string;
    description_de: string;
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
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    validFrom: '',
    validTo: '',
    documentNumber: ''
  });
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchInvitationData();
    }
  }, [token]);

  const fetchInvitationData = async () => {
    if (!token) return;

    try {
      // Fetch invitation details via Edge Function (bypasses RLS and type issues)
      const { data: inviteResponse, error: inviteError } = await supabase.functions.invoke('get-invitation-data', {
        body: { token }
      });

      if (inviteError || !inviteResponse?.data) throw new Error('Invitation not found');
      const inviteData = inviteResponse.data;

      if (inviteError) throw inviteError;
      setInvitation(inviteData);

      // Requirements are included in the invitation response
      setRequirements((inviteResponse.requirements || []).map((req: any) => ({
        ...req,
        status: req.status as 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired'
      })));
    } catch (error: any) {
      console.error('Error fetching invitation data:', error);
      toast({
        title: "Einladung nicht gefunden",
        description: "Diese Einladung ist ungültig oder abgelaufen.",
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

      // Generate unique file name
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${selectedRequirement.document_type.code}_${Date.now()}.${fileExt}`;
      const filePath = `${invitation.project_sub.project.tenant.name}/${selectedRequirement.id}/${fileName}`;

      // Upload file to Supabase Storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // Create document record via Edge Function (bypasses RLS)
      // This will transition the requirement from 'missing' to 'submitted'
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
          // Explicit state transition: missing -> submitted
          new_status: 'submitted'
        }
      });

      if (docError) throw docError;
      setUploadProgress(100);

      toast({
        title: "Dokument erfolgreich hochgeladen",
        description: `${uploadData.file.name} wurde zur Prüfung übermittelt. Sie erhalten eine Benachrichtigung über das Prüfungsergebnis.`,
        variant: "default"
      });

      // Reset form and refresh data
      setUploadData({
        file: null,
        validFrom: '',
        validTo: '',
        documentNumber: ''
      });
      setSelectedRequirement(null);
      setUploadDialogOpen(false);
      
      // Wait a bit before refreshing to ensure backend is updated
      setTimeout(() => {
        fetchInvitationData();
      }, 1000);
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

  const getStatusBadge = (status: string, documents: Document[]) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground">
          <CheckCircle className="h-3 w-3 mr-1" />
          Genehmigt
        </Badge>;
      case 'in_review':
        return <Badge className="bg-warning text-warning-foreground">
          <Clock className="h-3 w-3 mr-1" />
          In Prüfung
        </Badge>;
      case 'expired':
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Abgelaufen
        </Badge>;
      case 'expiring':
        return <Badge className="bg-warning text-warning-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Läuft ab
        </Badge>;
      case 'missing':
      default:
        return <Badge variant="outline" className="border-destructive text-destructive">
          <Upload className="h-3 w-3 mr-1" />
          Upload erforderlich
        </Badge>;
    }
  };

  const saveProgress = () => {
    // In a real app, this would save progress to localStorage or server
    localStorage.setItem(`upload_progress_${token}`, JSON.stringify({
      completedRequirements: requirements.filter(r => r.documents.length > 0).map(r => r.id),
      timestamp: Date.now()
    }));
    
    toast({
      title: "Fortschritt gespeichert",
      description: "Sie können später fortfahren wo Sie aufgehört haben.",
      variant: "default"
    });
  };

  const continueToNext = () => {
    // This could navigate to a completion page or close the window
    window.close();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Einladungsdaten...</p>
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
            <h2 className="text-xl font-semibold mb-2">Einladung nicht gefunden</h2>
            <p className="text-muted-foreground">
              Diese Einladung ist ungültig oder bereits abgelaufen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter requirements: only show missing/required ones by default
  const missingRequirements = requirements.filter(r => 
    r.status === 'missing' || (r.documents.length === 0)
  );
  const completedRequirements = requirements.filter(r => 
    r.documents.length > 0 || r.status === 'valid'
  );
  
  const displayedRequirements = showCompleted ? requirements : missingRequirements;
  const totalRequirements = requirements.length;
  const completedCount = completedRequirements.length;
  const progressPercent = totalRequirements > 0 ? Math.round((completedCount / totalRequirements) * 100) : 0;

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
              <h1 className="text-xl font-bold">
                Nachweise für {invitation.project_sub.project.name} hochladen
              </h1>
              <p className="text-sm text-muted-foreground font-medium text-primary">
                Es werden ausschließlich Pflichtnachweise angefordert.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Above the fold: Progress and Project Info */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Ihr Fortschritt</h2>
                    <p className="text-sm text-muted-foreground">
                      {completedCount} von {totalRequirements} Dokumenten hochgeladen
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
                    <div className="text-xs text-muted-foreground">Abgeschlossen</div>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Project Info Compact */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Projekt:</span>
                  <p className="font-medium">{invitation.project_sub.project.name}</p>
                  <p className="text-xs text-muted-foreground">{invitation.project_sub.project.code}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Unternehmen:</span>
                  <p className="font-medium">{invitation.project_sub.subcontractor.company_name}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Noch erforderlich:</span>
                  <p className="font-medium text-destructive">{missingRequirements.length} Dokumente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open Requirements List */}
        {missingRequirements.length > 0 && !showCompleted && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Upload className="mr-2 h-5 w-5 text-destructive" />
                    Offene Pflichtnachweise ({missingRequirements.length})
                  </CardTitle>
                  <CardDescription>
                    Nur Pflichtnachweise werden angefordert. Jetzt hochladen:
                  </CardDescription>
                </div>
                {completedRequirements.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompleted(true)}
                  >
                    Alle anzeigen
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {missingRequirements.map((requirement) => (
                <Card key={requirement.id} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{requirement.document_type.name_de}</h3>
                          <DocumentTypeTooltip code={requirement.document_type.code} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {requirement.document_type.description_de}
                        </p>
                        {requirement.due_date && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Fällig: {format(new Date(requirement.due_date), 'dd.MM.yyyy', { locale: de })}
                          </div>
                        )}
                        <div className="pt-1">
                          {getStatusBadge(requirement.status, requirement.documents)}
                        </div>
                      </div>
                      <div>
                        <Button 
                          onClick={() => {
                            setSelectedRequirement(requirement);
                            setUploadDialogOpen(true);
                          }}
                          className="bg-primary hover:bg-primary/90"
                          data-testid="upload-start"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Jetzt hochladen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Requirements (when showing completed) */}
        {showCompleted && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Alle Dokumente ({requirements.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompleted(false)}
                >
                  Nur offene anzeigen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {requirements.map((requirement) => (
                <Card key={requirement.id} className={`${
                  requirement.status === 'valid' ? 'border-success/20 bg-success/5' :
                  requirement.status === 'in_review' ? 'border-warning/20 bg-warning/5' :
                  'border-destructive/20 bg-destructive/5'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{requirement.document_type.name_de}</h3>
                          <DocumentTypeTooltip code={requirement.document_type.code} />
                        </div>
                        {requirement.documents.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{requirement.documents[0].file_name}</span>
                            {requirement.status === 'in_review' && (
                              <span className="text-warning font-medium">• Wird geprüft</span>
                            )}
                          </div>
                        )}
                        <div>
                          {getStatusBadge(requirement.status, requirement.documents)}
                        </div>
                      </div>
                      {requirement.status !== 'valid' && (
                        <Button 
                          size="sm"
                          variant={requirement.documents.length > 0 ? "outline" : "primary"}
                          onClick={() => {
                            setSelectedRequirement(requirement);
                            setUploadDialogOpen(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {requirement.documents.length > 0 ? 'Neu hochladen' : 'Hochladen'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background border-t p-4 -mx-4">
          <div className="flex gap-3 justify-center max-w-md mx-auto">
            <Button 
              variant="outline" 
              onClick={saveProgress}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Später abschließen
            </Button>
            {missingRequirements.length === 0 && (
              <Button 
                onClick={continueToNext}
                className="flex-1 bg-success hover:bg-success/90"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Fertig
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dokument hochladen
            </DialogTitle>
            <DialogDescription>
              {selectedRequirement?.document_type.name_de} für {invitation.project_sub.subcontractor.company_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Drag & Drop Upload */}
            <DragDropUpload
              onFileSelect={(file) => setUploadData(prev => ({ ...prev, file }))}
              selectedFile={uploadData.file}
              uploading={uploadLoading}
              uploadProgress={uploadProgress}
              onCancel={() => setUploadData(prev => ({ ...prev, file: null }))}
            />

            {/* Validity Dates */}
            {uploadData.file && !uploadLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valid_from">Gültig von (optional)</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={uploadData.validFrom}
                      onChange={(e) => setUploadData(prev => ({ ...prev, validFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_to">Gültig bis (optional)</Label>
                    <Input
                      id="valid_to"
                      type="date"
                      value={uploadData.validTo}
                      onChange={(e) => setUploadData(prev => ({ ...prev, validTo: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="document_number">Dokumentennummer (optional)</Label>
                  <Input
                    id="document_number"
                    placeholder="z.B. Zertifikatsnummer, Bescheinigungsnummer"
                    value={uploadData.documentNumber}
                    onChange={(e) => setUploadData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Processing Info */}
            {uploadProgress === 100 && (
              <Card className="border-success bg-success/5">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <h3 className="font-medium text-success">Upload erfolgreich!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ihr Dokument wird in der Regel binnen 2-3 Werktagen geprüft.
                    Sie erhalten eine E-Mail-Benachrichtigung über das Ergebnis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadData({ file: null, validFrom: '', validTo: '', documentNumber: '' });
              }} 
              disabled={uploadLoading}
            >
              {uploadProgress === 100 ? 'Schließen' : 'Abbrechen'}
            </Button>
            {uploadData.file && uploadProgress !== 100 && (
              <Button 
                onClick={handleFileUpload}
                disabled={uploadLoading}
              >
                {uploadLoading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}