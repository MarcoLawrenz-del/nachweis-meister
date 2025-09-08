import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  FileCheck,
  FileX
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { StatusBadge } from '@/components/StatusBadge';

interface DocumentDetail {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string | null;
  valid_from: string | null;
  valid_to: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  document_number: string | null;
  issuer: string | null;
  requirement: {
    id: string;
    status: string;
    rejection_reason: string | null;
    due_date: string | null;
    escalated: boolean;
    project_sub: {
      id: string;
      project: {
        id: string;
        name: string;
        code: string;
      };
      subcontractor: {
        id: string;
        company_name: string;
        contact_name: string | null;
        contact_email: string;
      };
    };
    document_type: {
      id: string;
      name_de: string;
      description_de: string | null;
      code: string;
    };
  };
}

export default function DocumentDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (documentId && profile) {
      fetchDocument();
    }
  }, [documentId, profile]);

  const fetchDocument = async () => {
    if (!documentId || !profile) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          file_url,
          file_size,
          mime_type,
          valid_from,
          valid_to,
          uploaded_at,
          uploaded_by,
          reviewed_at,
          reviewed_by,
          document_number,
          issuer,
          requirement:requirements!inner (
            id,
            status,
            rejection_reason,
            due_date,
            escalated,
            project_sub:project_subs!inner (
              id,
              project:projects!inner (
                id,
                name,
                code
              ),
              subcontractor:subcontractors!inner (
                id,
                company_name,
                contact_name,
                contact_email
              )
            ),
            document_type:document_types!inner (
              id,
              name_de,
              description_de,
              code
            )
          )
        `)
        .eq('id', documentId)
        .single();

      if (error) throw error;

      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: "Fehler",
        description: "Dokument konnte nicht geladen werden.",
        variant: "destructive"
      });
      navigate('/app/review-queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!document) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('requirements')
        .update({ 
          status: 'valid',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.requirement.id);

      if (error) throw error;

      toast({
        title: "Dokument genehmigt",
        description: `${document.requirement.document_type.name_de} wurde genehmigt.`
      });

      fetchDocument();
    } catch (error: any) {
      console.error('Error approving document:', error);
      toast({
        title: "Fehler",
        description: "Dokument konnte nicht genehmigt werden.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!document || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('requirements')
        .update({ 
          status: 'missing',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', document.requirement.id);

      if (error) throw error;

      toast({
        title: "Dokument abgelehnt",
        description: `${document.requirement.document_type.name_de} wurde abgelehnt.`
      });

      setRejectionReason('');
      fetchDocument();
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      toast({
        title: "Fehler",
        description: "Dokument konnte nicht abgelehnt werden.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDaysUntilExpiry = (validTo: string | null) => {
    if (!validTo) return null;
    const days = Math.ceil((new Date(validTo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'success';
      case 'in_review': return 'warning';
      case 'missing': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <FileCheck className="h-4 w-4" />;
      case 'in_review': return <Clock className="h-4 w-4" />;
      case 'missing': return <FileX className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Dokument nicht gefunden</h3>
        <p className="text-muted-foreground text-center">
          Das angeforderte Dokument existiert nicht oder Sie haben keine Berechtigung darauf zuzugreifen.
        </p>
        <Button onClick={() => navigate('/app/review-queue')}>
          Zurück zur Prüfungsqueue
        </Button>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(document.valid_to);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-professional">{document.requirement.document_type.name_de}</h1>
            <p className="text-muted-foreground">
              {document.requirement.project_sub.subcontractor.company_name} • {document.requirement.project_sub.project.name}
            </p>
          </div>
        </div>
        <StatusBadge 
          status={document.requirement.status as any} 
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Dokumentinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Dateiname</Label>
                  <p className="font-medium">{document.file_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dateigröße</Label>
                  <p className="font-medium">{formatFileSize(document.file_size)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">MIME-Type</Label>
                  <p className="font-medium">{document.mime_type || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dokumentennummer</Label>
                  <p className="font-medium">{document.document_number || 'Nicht angegeben'}</p>
                </div>
                {document.issuer && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Aussteller</Label>
                    <p className="font-medium">{document.issuer}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <Button variant="outline" asChild>
                  <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    Dokument ansehen
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={document.file_url} download={document.file_name}>
                    <Download className="h-4 w-4 mr-2" />
                    Herunterladen
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Gültigkeit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.valid_from || document.valid_to ? (
                <div className="space-y-3">
                  {document.valid_from && (
                    <div>
                      <Label className="text-muted-foreground">Gültig ab</Label>
                      <p className="font-medium">
                        {format(new Date(document.valid_from), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  )}
                  {document.valid_to && (
                    <div>
                      <Label className="text-muted-foreground">Gültig bis</Label>
                      <p className={`font-medium ${daysUntilExpiry && daysUntilExpiry < 30 ? 'text-warning' : ''}`}>
                        {format(new Date(document.valid_to), 'dd.MM.yyyy', { locale: de })}
                        {daysUntilExpiry !== null && (
                          <span className="ml-2 text-sm">
                            ({daysUntilExpiry > 0 ? `${daysUntilExpiry} Tage verbleibend` : 'Abgelaufen'})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Keine Gültigkeitsdaten angegeben</p>
              )}
            </CardContent>
          </Card>

          {/* Rejection Reason */}
          {document.requirement.rejection_reason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <XCircle className="mr-2 h-5 w-5" />
                  Ablehnungsgrund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{document.requirement.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getStatusIcon(document.requirement.status)}
                <span className="ml-2">Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBadge status={document.requirement.status as any} />
              
              {document.requirement.status === 'in_review' && (
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-success text-success-foreground hover:bg-success/90"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Genehmigen
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Ablehnen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dokument ablehnen</DialogTitle>
                        <DialogDescription>
                          Geben Sie einen Grund für die Ablehnung an.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rejection_reason">Grund für die Ablehnung *</Label>
                          <Textarea
                            id="rejection_reason"
                            placeholder="z.B. Dokument ist nicht lesbar, falscher Dokumenttyp, abgelaufen..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setRejectionReason('')}
                        >
                          Abbrechen
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleReject}
                          disabled={!rejectionReason.trim() || actionLoading}
                        >
                          Ablehnen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Projekt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{document.requirement.project_sub.project.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Code</Label>
                <p className="font-medium">{document.requirement.project_sub.project.code}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subcontractor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Nachunternehmer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Unternehmen</Label>
                <p className="font-medium">{document.requirement.project_sub.subcontractor.company_name}</p>
              </div>
              {document.requirement.project_sub.subcontractor.contact_name && (
                <div>
                  <Label className="text-muted-foreground">Ansprechpartner</Label>
                  <p className="font-medium">{document.requirement.project_sub.subcontractor.contact_name}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">E-Mail</Label>
                <p className="font-medium">{document.requirement.project_sub.subcontractor.contact_email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Zeitlinie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Hochgeladen</Label>
                <p className="font-medium">
                  {format(new Date(document.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </div>
              {document.reviewed_at && (
                <div>
                  <Label className="text-muted-foreground">Geprüft</Label>
                  <p className="font-medium">
                    {format(new Date(document.reviewed_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
              )}
              {document.requirement.due_date && (
                <div>
                  <Label className="text-muted-foreground">Fälligkeitsdatum</Label>
                  <p className="font-medium">
                    {format(new Date(document.requirement.due_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}