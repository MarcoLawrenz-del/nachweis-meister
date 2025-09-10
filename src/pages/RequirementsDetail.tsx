import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Upload,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  AlertTriangle,
  Clock,
  Plus,
  History as HistoryIcon
} from 'lucide-react';
import { InviteSubcontractor } from '@/components/InviteSubcontractor';
import { ReviewHistory } from '@/components/ReviewHistory';
import { ReviewActions } from '@/components/ReviewActions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ProjectSub {
  id: string;
  project: {
    name: string;
    code: string;
  };
  subcontractor: {
    company_name: string;
    contact_email: string;
  };
}

interface Requirement {
  id: string;
  status: 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired';
  due_date: string | null;
  rejection_reason: string | null;
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
  file_url: string;
  file_size: number;
  valid_from: string | null;
  valid_to: string | null;
  uploaded_at: string;
  mime_type: string;
}

export default function RequirementsDetail() {
  const { projectSubId } = useParams<{ projectSubId: string }>();
  const navigate = useNavigate();
  const [projectSub, setProjectSub] = useState<ProjectSub | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    validFrom: '',
    validTo: '',
    documentNumber: ''
  });
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile && projectSubId) {
      Promise.all([
        fetchProjectSub(),
        fetchRequirements()
      ]);
    }
  }, [profile, projectSubId]);

  const fetchProjectSub = async () => {
    if (!projectSubId) return;

    try {
      const { data, error } = await supabase
        .from('project_subs')
        .select(`
          id,
          project:projects (
            name,
            code
          ),
          subcontractor:subcontractors (
            company_name,
            contact_email
          )
        `)
        .eq('id', projectSubId)
        .single();

      if (error) throw error;
      setProjectSub(data);
    } catch (error) {
      console.error('Error fetching project sub:', error);
      toast({
        title: "Fehler",
        description: "Projektdaten konnten nicht geladen werden.",
        variant: "destructive"
      });
      navigate('/app/dashboard');
    }
  };

  const fetchRequirements = async () => {
    if (!projectSubId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('requirements')
        .select(`
          id,
          status,
          due_date,
          rejection_reason,
          document_type:document_types (
            name_de,
            code,
            description_de
          ),
          documents (
            id,
            file_name,
            file_url,
            file_size,
            valid_from,
            valid_to,
            uploaded_at,
            mime_type
          )
        `)
        .eq('project_sub_id', projectSubId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequirements((data || []).map(req => ({
        ...req,
        status: req.status as 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired'
      })));
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast({
        title: "Fehler",
        description: "Anforderungen konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.file || !selectedRequirement || !profile) return;

    try {
      setUploadLoading(true);

      // Generate unique file name
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${selectedRequirement.document_type.code}_${Date.now()}.${fileExt}`;
      const filePath = `${profile.tenant_id}/${selectedRequirement.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          requirement_id: selectedRequirement.id,
          file_name: uploadData.file.name,
          file_url: filePath,
          file_size: uploadData.file.size,
          mime_type: uploadData.file.type,
          valid_from: uploadData.validFrom || null,
          valid_to: uploadData.validTo || null,
          document_number: uploadData.documentNumber || null,
          uploaded_by: profile.id
        });

      if (docError) throw docError;

      // Update requirement status
      const { error: reqError } = await supabase
        .from('requirements')
        .update({ 
          status: 'in_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequirement.id);

      if (reqError) throw reqError;

      toast({
        title: "Dokument hochgeladen",
        description: `${uploadData.file.name} wurde erfolgreich hochgeladen.`
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
      fetchRequirements();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload-Fehler",
        description: error.message || "Dokument konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const getStatusBadge = (status: string, documents: Document[]) => {
    const hasDocuments = documents.length > 0;
    
    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground">
          <CheckCircle className="h-3 w-3 mr-1" />
          Gültig
        </Badge>;
      case 'in_review':
        return <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          In Prüfung
        </Badge>;
      case 'expired':
        return <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Abgelaufen
        </Badge>;
      case 'expiring':
        return <Badge className="bg-warning text-warning-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Läuft ab
        </Badge>;
      case 'missing':
      default:
        return <Badge variant="outline" className={hasDocuments ? 'border-primary text-primary' : ''}>
          <FileText className="h-3 w-3 mr-1" />
          {hasDocuments ? 'Hochgeladen' : 'Fehlend'}
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

  if (loading || !projectSub) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          <div className="space-y-1 flex-1">
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-professional">
            {projectSub.subcontractor.company_name}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Badge variant="outline">{projectSub.project.code}</Badge>
            <span>{projectSub.project.name}</span>
          </div>
        </div>
      </div>

      {/* Tabs for Requirements and History */}
      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requirements">
            <FileText className="h-4 w-4 mr-2" />
            Anforderungen ({requirements.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <HistoryIcon className="h-4 w-4 mr-2" />
            Review-Historie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          {/* Requirements Table */}
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Dokumentenanforderungen ({requirements.length})
              </CardTitle>
              <CardDescription>
                Alle erforderlichen Dokumente für {projectSub.subcontractor.company_name}
              </CardDescription>
            </div>
            <InviteSubcontractor 
              projectSubId={projectSubId || ''}
              subcontractorEmail={projectSub.subcontractor.contact_email}
              subcontractorName={projectSub.subcontractor.company_name}
              projectName={projectSub.project.name}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokumenttyp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dokumente</TableHead>
                <TableHead>Gültigkeit</TableHead>
                <TableHead>Aktionen</TableHead>
                <TableHead>Review</TableHead>
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
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(requirement.status, requirement.documents)}
                    {requirement.rejection_reason && (
                      <div className="text-sm text-destructive mt-1">
                        Grund: {requirement.rejection_reason}
                      </div>
                    )}
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
                        <span className="text-sm text-muted-foreground">Kein Dokument</span>
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
                    <div className="flex gap-2">
                      {requirement.documents.length > 0 ? (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={supabase.storage.from('documents').getPublicUrl(requirement.documents[0].file_url).data.publicUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ansehen
                          </a>
                        </Button>
                      ) : null}
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedRequirement(requirement);
                          setUploadDialogOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {requirement.documents.length > 0 ? 'Neu hochladen' : 'Hochladen'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {requirement.status === 'in_review' && profile?.role && ['owner', 'admin', 'staff'].includes(profile.role) ? (
                      <ReviewActions 
                        requirementId={requirement.id}
                        currentStatus={requirement.status}
                        onActionComplete={fetchRequirements}
                      />
                    ) : (
                      getStatusBadge(requirement.status, requirement.documents)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="history">
          <ReviewHistory projectSubId={projectSubId || ''} />
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
            <DialogDescription>
              Laden Sie {selectedRequirement?.document_type.name_de} hoch für {projectSub.subcontractor.company_name}
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
              <Label htmlFor="document_number">Dokumentnummer</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={!uploadData.file || uploadLoading}
            >
              {uploadLoading ? 'Wird hochgeladen...' : 'Hochladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}