import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar
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
      setUploadProgress(0);

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

      setUploadProgress(50);

      // Create document record via Edge Function (bypasses RLS)
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
          invitation_token: token
        }
      });

      if (docError) throw docError;

      setUploadProgress(100);

      toast({
        title: "Dokument erfolgreich hochgeladen",
        description: `${uploadData.file.name} wurde erfolgreich übermittelt und wird geprüft.`,
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
      fetchInvitationData();
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
    const hasDocuments = documents.length > 0;
    
    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground">
          <CheckCircle className="h-3 w-3 mr-1" />
          Genehmigt
        </Badge>;
      case 'in_review':
        return <Badge variant="secondary">
          Wird geprüft
        </Badge>;
      case 'expired':
        return <Badge variant="destructive">
          Abgelaufen
        </Badge>;
      case 'expiring':
        return <Badge className="bg-warning text-warning-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Läuft ab
        </Badge>;
      case 'missing':
      default:
        return <Badge variant={hasDocuments ? "default" : "outline"}>
          <FileText className="h-3 w-3 mr-1" />
          {hasDocuments ? 'Hochgeladen' : 'Erforderlich'}
        </Badge>;
    }
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

  const pendingDocs = requirements.filter(r => r.status === 'missing' || (r.documents.length === 0));
  const uploadedDocs = requirements.filter(r => r.documents.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
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
            <div>
              <h1 className="text-2xl font-bold">{invitation.project_sub.project.tenant.name}</h1>
              <p className="text-muted-foreground">Dokumenten-Upload Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Projekt: {invitation.project_sub.project.name}
            </CardTitle>
            <CardDescription>
              Bitte laden Sie die erforderlichen Dokumente für Ihr Unternehmen "{invitation.project_sub.subcontractor.company_name}" hoch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Projektcode:</span>
                <p className="text-muted-foreground">{invitation.project_sub.project.code}</p>
              </div>
              <div>
                <span className="font-medium">Ihr Unternehmen:</span>
                <p className="text-muted-foreground">{invitation.project_sub.subcontractor.company_name}</p>
              </div>
              <div>
                <span className="font-medium">Ausstehend:</span>
                <p className="text-destructive font-medium">{pendingDocs.length} Dokumente</p>
              </div>
              <div>
                <span className="font-medium">Hochgeladen:</span>
                <p className="text-success font-medium">{uploadedDocs.length} Dokumente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Erforderliche Dokumente ({requirements.length})
            </CardTitle>
            <CardDescription>
              Laden Sie alle erforderlichen Dokumente hoch. Akzeptierte Formate: PDF, JPG, PNG, DOC, DOCX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokumenttyp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hochgeladenes Dokument</TableHead>
                  <TableHead>Gültigkeit</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((requirement) => (
                  <TableRow key={requirement.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{requirement.document_type.name_de}</p>
                        <p className="text-sm text-muted-foreground">
                          {requirement.document_type.description_de}
                        </p>
                        {requirement.due_date && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Fällig: {format(new Date(requirement.due_date), 'dd.MM.yyyy', { locale: de })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(requirement.status, requirement.documents)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {requirement.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 text-sm">
                            <FileText className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{doc.file_name}</span>
                            <span className="text-muted-foreground">
                              ({formatFileSize(doc.file_size)})
                            </span>
                          </div>
                        ))}
                        {requirement.documents.length === 0 && (
                          <span className="text-sm text-muted-foreground">Noch nicht hochgeladen</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {requirement.documents.length > 0 && requirement.documents[0].valid_to ? (
                        <div className="text-sm">
                          {requirement.documents[0].valid_from && (
                            <div>Ab: {format(new Date(requirement.documents[0].valid_from), 'dd.MM.yyyy', { locale: de })}</div>
                          )}
                          <div>Bis: {format(new Date(requirement.documents[0].valid_to), 'dd.MM.yyyy', { locale: de })}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nicht angegeben</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedRequirement(requirement);
                          setUploadDialogOpen(true);
                        }}
                        disabled={requirement.status === 'valid'}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {requirement.documents.length > 0 ? 'Neu hochladen' : 'Hochladen'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Dokument hochladen</DialogTitle>
              <DialogDescription>
                {selectedRequirement?.document_type.name_de} für {invitation.project_sub.subcontractor.company_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Datei auswählen *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Erlaubte Formate: PDF, JPG, PNG, DOC, DOCX (max. 10MB)
                </p>
              </div>
              
              <div>
                <Label htmlFor="document_number">Dokumentnummer (optional)</Label>
                <Input
                  id="document_number"
                  placeholder="z.B. 123456789"
                  value={uploadData.documentNumber}
                  onChange={(e) => setUploadData(prev => ({ ...prev, documentNumber: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Gültig von</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={uploadData.validFrom}
                    onChange={(e) => setUploadData(prev => ({ ...prev, validFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_to">Gültig bis</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={uploadData.validTo}
                    onChange={(e) => setUploadData(prev => ({ ...prev, validTo: e.target.value }))}
                  />
                </div>
              </div>

              {uploadLoading && (
                <div>
                  <Label>Upload-Fortschritt</Label>
                  <Progress value={uploadProgress} className="mt-2" />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploadLoading}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleFileUpload}
                disabled={!uploadData.file || uploadLoading}
              >
                {uploadLoading ? "Lade hoch..." : "Hochladen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {invitation.project_sub.project.tenant.name} - 
          Dokument-Upload Portal
        </div>
      </footer>
    </div>
  );
}