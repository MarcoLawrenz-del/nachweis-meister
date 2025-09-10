import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, FileCheck, AlertCircle, Clock, User, FileText, Calendar, Building2, AlertTriangle } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';

interface Requirement {
  id: string;
  status: 'missing' | 'uploaded' | 'in_review' | 'valid' | 'expired';
  due_date: string | null;
  created_at: string;
  last_reminded_at: string | null;
  rejection_reason: string | null;
  escalated: boolean;
  review_priority: string | null;
  assigned_reviewer_id: string | null;
  project_sub: {
    project: {
      name: string;
      code: string;
      tenant_id: string;
    };
    subcontractor: {
      company_name: string;
      contact_name: string;
      contact_email: string;
    };
  };
  document_type: {
    name_de: string;
    code: string;
  };
  documents: Array<{
    id: string;
    file_name: string;
    uploaded_at: string;
    file_url: string;
  }>;
  assigned_reviewer?: {
    name: string;
    email: string;
  };
}

export default function ReviewQueue() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'escalated' | 'my_reviews'>('pending');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    escalated: 0,
    my_reviews: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequirements();
  }, [filter]);

  const fetchRequirements = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('requirements')
        .select(`
          *,
          project_sub:project_subs!inner(
            project:projects!inner(name, code, tenant_id),
            subcontractor:subcontractors!inner(company_name, contact_name, contact_email)
          ),
          document_type:document_types!inner(name_de, code),
          documents(id, file_name, uploaded_at, file_url),
          assigned_reviewer:users(name, email)
        `)
        .order('updated_at', { ascending: false });

      if (filter === 'pending') {
        query = query.in('status', ['uploaded', 'in_review']);
      } else if (filter === 'escalated') {
        query = query.eq('escalated', true);
      } else if (filter === 'my_reviews') {
        query = query.eq('assigned_reviewer_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const filteredData = (data || []).map(item => ({
        ...item,
        status: item.status as 'missing' | 'uploaded' | 'in_review' | 'valid' | 'expired'
      }));
      setRequirements(filteredData);

      // Calculate stats
      const allRequirements = await supabase
        .from('requirements')
        .select(`
          *,
          project_sub:project_subs!inner(
            project:projects!inner(tenant_id)
          )
        `);

      if (allRequirements.data) {
        const pending = allRequirements.data.filter(r => ['uploaded', 'in_review'].includes(r.status)).length;
        const escalated = allRequirements.data.filter(r => r.escalated).length;
        const myReviews = allRequirements.data.filter(r => r.assigned_reviewer_id === user.id).length;

        setStats({
          total: allRequirements.data.length,
          pending,
          escalated,
          my_reviews: myReviews,
        });
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = (requirement: Requirement) => {
    navigate(`/app/documents/${requirement.id}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nicht gesetzt';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getLatestDocument = (documents: Requirement['documents']) => {
    if (documents.length === 0) return null;
    return documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];
  };

  if (isLoading) {
    return <div className="p-6">Lade Prüfungsqueue...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prüfungsqueue</h1>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Alle ({stats.total})
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Ausstehend ({stats.pending})
          </Button>
          <Button 
            variant={filter === 'my_reviews' ? 'default' : 'outline'}
            onClick={() => setFilter('my_reviews')}
          >
            Meine Prüfungen ({stats.my_reviews})
          </Button>
          <Button 
            variant={filter === 'escalated' ? 'default' : 'outline'}
            onClick={() => setFilter('escalated')}
          >
            Eskaliert ({stats.escalated})
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {requirements.map((requirement) => {
          const latestDoc = getLatestDocument(requirement.documents);
          
          return (
            <Card key={requirement.id} className="w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {requirement.project_sub.project.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {requirement.project_sub.subcontractor.company_name} • {requirement.document_type.name_de}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {requirement.escalated && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Eskaliert
                      </Badge>
                    )}
                    {requirement.review_priority === 'high' && (
                      <Badge variant="secondary">Hohe Priorität</Badge>
                    )}
                    <StatusBadge status={requirement.status} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Projekt:</span>
                    <span>{requirement.project_sub.project.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Kontakt:</span>
                    <span>{requirement.project_sub.subcontractor.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fällig:</span>
                    <span className={isOverdue(requirement.due_date) ? 'text-destructive font-medium' : ''}>
                      {formatDate(requirement.due_date)}
                    </span>
                  </div>
                </div>

                {requirement.assigned_reviewer && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Zugewiesener Prüfer:</span>
                    <span>{requirement.assigned_reviewer.name}</span>
                  </div>
                )}

                {latestDoc && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4" />
                    <span className="flex-1">{latestDoc.file_name}</span>
                    <span className="text-sm text-muted-foreground">
                      Hochgeladen: {formatDate(latestDoc.uploaded_at)}
                    </span>
                  </div>
                )}

                {requirement.rejection_reason && (
                  <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      <strong>Ablehnungsgrund:</strong> {requirement.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleViewDocument(requirement)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Prüfen & Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {requirements.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Keine Anforderungen {filter === 'pending' ? 'zur Prüfung' : filter === 'escalated' ? 'eskaliert' : filter === 'my_reviews' ? 'zugewiesen' : ''} gefunden.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}