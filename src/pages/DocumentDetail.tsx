import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Calendar, User, Building2, Download, Eye, Clock, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ReviewActions } from '@/components/ReviewActions';
import { ReviewerAssignment } from '@/components/ReviewerAssignment';
import HelpTooltip from '@/components/HelpTooltip';

export function DocumentDetail() {
  const { id } = useParams();
  const [requirement, setRequirement] = useState<any>(null);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequirement();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser(data);
    }
  };

  const fetchRequirement = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          *,
          project_sub:project_subs!inner(
            project:projects!inner(name, code, address, tenant_id),
            subcontractor:subcontractors!inner(
              company_name, 
              contact_name, 
              contact_email, 
              phone, 
              address
            )
          ),
          document_type:document_types!inner(name_de, description_de, code),
          documents(*),
          assigned_reviewer:users(name, email, role),
          reviewed_by_user:users!requirements_reviewed_by_fkey(name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequirement(data);
      
      // Fetch review history
      const { data: history } = await supabase
        .from('review_history')
        .select(`
          *,
          reviewer:users!review_history_reviewer_id_fkey(name, email)
        `)
        .eq('requirement_id', id)
        .order('created_at', { ascending: false });
        
      setReviewHistory(history || []);
    } catch (error) {
      console.error('Error fetching requirement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nicht gesetzt';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Nicht gesetzt';
    return new Date(dateString).toLocaleString('de-DE');
  };

  const canReview = () => {
    if (!currentUser || !requirement) return false;
    
    // Can review if assigned as reviewer or has admin/owner role
    return (
      requirement.assigned_reviewer_id === currentUser.id ||
      ['owner', 'admin'].includes(currentUser.role)
    );
  };

  const canAssignReviewer = () => {
    if (!currentUser) return false;
    return ['owner', 'admin', 'staff'].includes(currentUser.role);
  };

  const getActionLabel = (action: string) => {
    const labels = {
      'assigned': 'Zugewiesen',
      'approved': 'Genehmigt',
      'rejected': 'Abgelehnt',
      'escalated': 'Eskaliert',
      'updated': 'Aktualisiert',
    };
    return labels[action as keyof typeof labels] || action;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return <div className="p-6">Lade Dokument...</div>;
  }

  if (!requirement) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Dokument nicht gefunden</h2>
        <p className="text-muted-foreground mb-4">Das angeforderte Dokument existiert nicht oder Sie haben keine Berechtigung.</p>
        <Button onClick={() => navigate('/app/review')}>Zurück zur Prüfungsqueue</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/app/review')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{requirement.document_type.name_de}</h1>
          <p className="text-muted-foreground">
            {requirement.project_sub.subcontractor.company_name} • {requirement.project_sub.project.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Grundinformationen */}
        <Card>
          <CardHeader>
            <CardTitle>Grundinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={requirement.status} />
                  {requirement.escalated && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Eskaliert
                    </Badge>
                  )}
                  {requirement.review_priority === 'high' && (
                    <Badge variant="secondary">Hohe Priorität</Badge>
                  )}
                </div>
              </div>
            <div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Dokumenttyp</label>
                <HelpTooltip documentTypeCode={requirement.document_type.code} />
              </div>
              <p className="mt-1">{requirement.document_type.name_de}</p>
            </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fälligkeitsdatum</label>
                <p className={`mt-1 ${isOverdue(requirement.due_date) ? 'text-destructive font-medium' : ''}`}>
                  {formatDate(requirement.due_date)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Erstellt am</label>
                <p className="mt-1">{formatDate(requirement.created_at)}</p>
              </div>
            </div>
            
            {requirement.assigned_reviewer && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Zugewiesener Prüfer</label>
                <p className="mt-1">{requirement.assigned_reviewer.name} ({requirement.assigned_reviewer.email})</p>
              </div>
            )}

            {requirement.reviewed_by_user && requirement.reviewed_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Geprüft von</label>
                <p className="mt-1">{requirement.reviewed_by_user.name} am {formatDateTime(requirement.reviewed_at)}</p>
              </div>
            )}

            {requirement.rejection_reason && (
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <label className="text-sm font-medium text-destructive">Ablehnungsgrund</label>
                <p className="mt-1 text-sm text-destructive">{requirement.rejection_reason}</p>
              </div>
            )}

            {requirement.escalation_reason && (
              <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <label className="text-sm font-medium text-warning">Eskalationsgrund</label>
                <p className="mt-1 text-sm text-warning">{requirement.escalation_reason}</p>
              </div>
            )}
            
            {requirement.document_type.description_de && (
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Beschreibung</label>
                  <HelpTooltip documentTypeCode={requirement.document_type.code} />
                </div>
                <div className="mt-1 text-sm bg-muted/30 p-3 rounded-lg">
                  <p>{requirement.document_type.description_de}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 <strong>Tipp:</strong> Klicken Sie auf das Hilfe-Symbol für offizielle Informationen zu diesem Dokumenttyp.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projekt- und Subunternehmer-Informationen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Projekt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Projektname</label>
                <p className="mt-1">{requirement.project_sub.project.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Projektcode</label>
                <p className="mt-1">{requirement.project_sub.project.code}</p>
              </div>
              {requirement.project_sub.project.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                  <p className="mt-1">{requirement.project_sub.project.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Subunternehmer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unternehmen</label>
                <p className="mt-1">{requirement.project_sub.subcontractor.company_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Kontaktperson</label>
                <p className="mt-1">{requirement.project_sub.subcontractor.contact_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-Mail</label>
                <p className="mt-1">{requirement.project_sub.subcontractor.contact_email}</p>
              </div>
              {requirement.project_sub.subcontractor.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefon</label>
                  <p className="mt-1">{requirement.project_sub.subcontractor.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dokumente */}
        {requirement.documents && requirement.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hochgeladene Dokumente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requirement.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Hochgeladen am {formatDate(doc.uploaded_at)}
                          {doc.file_size && ` • ${Math.round(doc.file_size / 1024)} KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Anzeigen
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = doc.file_url;
                          a.download = doc.file_name;
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Actions */}
        {canReview() && requirement.status === 'uploaded' && (
          <ReviewActions 
            requirementId={requirement.id}
            onActionComplete={fetchRequirement}
          />
        )}

        {/* Reviewer Assignment */}
        {canAssignReviewer() && (
          <ReviewerAssignment 
            requirementId={requirement.id}
            currentReviewerId={requirement.assigned_reviewer_id}
            tenantId={requirement.project_sub.project.tenant_id}
            onAssignmentComplete={fetchRequirement}
          />
        )}

        {/* Review History */}
        {reviewHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Prüfungsverlauf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 border-l-2 border-muted">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getActionLabel(entry.action)}</span>
                        <Badge variant="outline">{entry.action}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        von {entry.reviewer?.name} • {formatDateTime(entry.created_at)}
                      </p>
                      {entry.old_status && entry.new_status && (
                        <p className="text-sm">
                          Status: {entry.old_status} → {entry.new_status}
                        </p>
                      )}
                      {entry.comment && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">
                          {entry.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}