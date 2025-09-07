import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Plus, 
  Search, 
  Building2, 
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Send,
  Eye,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  code: string;
  address: string | null;
  created_at: string;
}

interface Subcontractor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string;
}

interface ProjectSubcontractor {
  id: string;
  overall_status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  created_at: string;
  subcontractor: Subcontractor;
  requirements_summary: {
    total: number;
    missing: number;
    in_review: number;
    valid: number;
    expiring: number;
    expired: number;
  };
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projectSubs, setProjectSubs] = useState<ProjectSubcontractor[]>([]);
  const [availableSubcontractors, setAvailableSubcontractors] = useState<Subcontractor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id && id) {
      Promise.all([
        fetchProject(),
        fetchProjectSubcontractors(),
        fetchAvailableSubcontractors()
      ]);
    }
  }, [profile?.tenant_id, id]);

  const fetchProject = async () => {
    if (!profile?.tenant_id || !id) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht geladen werden.",
        variant: "destructive"
      });
      navigate('/projects');
    }
  };

  const fetchProjectSubcontractors = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('project_subs')
        .select(`
          id,
          overall_status,
          approved_at,
          created_at,
          subcontractor:subcontractors (
            id,
            company_name,
            contact_name,
            contact_email
          ),
          requirements (
            status
          )
        `)
        .eq('project_id', id);

      if (error) throw error;

      const processedData = data?.map(ps => {
        const requirements = ps.requirements || [];
        const summary = {
          total: requirements.length,
          missing: requirements.filter(r => r.status === 'missing').length,
          in_review: requirements.filter(r => r.status === 'in_review').length,
          valid: requirements.filter(r => r.status === 'valid').length,
          expiring: requirements.filter(r => r.status === 'expiring').length,
          expired: requirements.filter(r => r.status === 'expired').length,
        };

        return {
          id: ps.id,
          overall_status: ps.overall_status as 'pending' | 'approved' | 'rejected',
          approved_at: ps.approved_at,
          created_at: ps.created_at,
          subcontractor: ps.subcontractor,
          requirements_summary: summary
        };
      }) || [];

      setProjectSubs(processedData);
    } catch (error) {
      console.error('Error fetching project subcontractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSubcontractors = async () => {
    if (!profile?.tenant_id || !id) return;

    try {
      // Get subcontractors not yet assigned to this project
      const { data: assignedSubs } = await supabase
        .from('project_subs')
        .select('subcontractor_id')
        .eq('project_id', id);

      const assignedIds = assignedSubs?.map(ps => ps.subcontractor_id) || [];

      let query = supabase
        .from('subcontractors')
        .select('id, company_name, contact_name, contact_email')
        .eq('tenant_id', profile.tenant_id);

      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAvailableSubcontractors(data || []);
    } catch (error) {
      console.error('Error fetching available subcontractors:', error);
    }
  };

  const handleAssignSubcontractor = async () => {
    if (!selectedSubcontractor || !id) return;

    try {
      // First, assign subcontractor to project
      const { data: projectSub, error: assignError } = await supabase
        .from('project_subs')
        .insert({
          project_id: id,
          subcontractor_id: selectedSubcontractor,
          overall_status: 'pending'
        })
        .select()
        .single();

      if (assignError) throw assignError;

      // Then, create default requirements
      const { data: documentTypes, error: docTypesError } = await supabase
        .from('document_types')
        .select('id')
        .eq('required_by_default', true);

      if (docTypesError) throw docTypesError;

      const requirements = documentTypes.map(dt => ({
        project_sub_id: projectSub.id,
        document_type_id: dt.id,
        status: 'missing' as const
      }));

      const { error: reqError } = await supabase
        .from('requirements')
        .insert(requirements);

      if (reqError) throw reqError;

      toast({
        title: "Nachunternehmer zugeordnet",
        description: "Nachunternehmer wurde erfolgreich dem Projekt zugeordnet."
      });

      setIsDialogOpen(false);
      setSelectedSubcontractor('');
      Promise.all([
        fetchProjectSubcontractors(),
        fetchAvailableSubcontractors()
      ]);
    } catch (error: any) {
      console.error('Error assigning subcontractor:', error);
      toast({
        title: "Fehler",
        description: "Nachunternehmer konnte nicht zugeordnet werden.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveSubcontractor = async (projectSubId: string, companyName: string) => {
    if (!confirm(`Möchten Sie ${companyName} wirklich aus diesem Projekt entfernen?`)) return;

    try {
      const { error } = await supabase
        .from('project_subs')
        .delete()
        .eq('id', projectSubId);

      if (error) throw error;

      toast({
        title: "Nachunternehmer entfernt",
        description: `${companyName} wurde aus dem Projekt entfernt.`
      });

      Promise.all([
        fetchProjectSubcontractors(),
        fetchAvailableSubcontractors()
      ]);
    } catch (error: any) {
      console.error('Error removing subcontractor:', error);
      toast({
        title: "Fehler",
        description: "Nachunternehmer konnte nicht entfernt werden.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="secondary">Ausstehend</Badge>;
    }
  };

  const getComplianceStatus = (summary: ProjectSubcontractor['requirements_summary']) => {
    if (summary.expired > 0 || summary.missing > 0) {
      const issues = summary.expired + summary.missing;
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {issues} Probleme
        </Badge>
      );
    }
    if (summary.expiring > 0) {
      return (
        <Badge className="bg-warning text-warning-foreground text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {summary.expiring} läuft ab
        </Badge>
      );
    }
    if (summary.in_review > 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Eye className="h-3 w-3 mr-1" />
          In Prüfung
        </Badge>
      );
    }
    return (
      <Badge className="bg-success text-success-foreground text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Vollständig
      </Badge>
    );
  };

  if (loading || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          <div className="space-y-1 flex-1">
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-professional">{project.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Badge variant="outline" className="font-mono">{project.code}</Badge>
            {project.address && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{project.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nachunternehmer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectSubs.length}</div>
            <p className="text-xs text-muted-foreground">
              Zugeordnete Firmen
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kritische Probleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {projectSubs.reduce((acc, ps) => acc + ps.requirements_summary.expired + ps.requirements_summary.missing, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Fehlende/Abgelaufene Dokumente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Genehmigungsstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {projectSubs.filter(ps => ps.overall_status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Von {projectSubs.length} genehmigt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Subcontractors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Zugeordnete Nachunternehmer ({projectSubs.length})
              </CardTitle>
              <CardDescription>
                Nachunternehmer und deren Compliance-Status für dieses Projekt
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={availableSubcontractors.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nachunternehmer zuordnen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nachunternehmer zuordnen</DialogTitle>
                  <DialogDescription>
                    Wählen Sie einen Nachunternehmer für dieses Projekt aus.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedSubcontractor} onValueChange={setSelectedSubcontractor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nachunternehmer auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcontractors.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          <div>
                            <div className="font-medium">{sub.company_name}</div>
                            {sub.contact_name && (
                              <div className="text-sm text-muted-foreground">{sub.contact_name}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleAssignSubcontractor}
                    disabled={!selectedSubcontractor}
                  >
                    Zuordnen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {projectSubs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Nachunternehmer zugeordnet</h3>
              <p className="text-muted-foreground mb-4">
                Fügen Sie Nachunternehmer zu diesem Projekt hinzu, um mit der Compliance-Verfolgung zu beginnen.
              </p>
              {availableSubcontractors.length > 0 ? (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Nachunternehmer zuordnen
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Erstellen Sie zuerst Nachunternehmer, bevor Sie sie Projekten zuordnen können.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nachunternehmer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Dokumente</TableHead>
                  <TableHead>Zugeordnet</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectSubs.map((ps) => (
                  <TableRow key={ps.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ps.subcontractor.company_name}</p>
                        {ps.subcontractor.contact_name && (
                          <p className="text-sm text-muted-foreground">{ps.subcontractor.contact_name}</p>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {ps.subcontractor.contact_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ps.overall_status)}
                    </TableCell>
                    <TableCell>
                      {getComplianceStatus(ps.requirements_summary)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ps.requirements_summary.valid}/{ps.requirements_summary.total} gültig
                        {ps.requirements_summary.in_review > 0 && (
                          <div className="text-muted-foreground">
                            {ps.requirements_summary.in_review} in Prüfung
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(ps.created_at), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/requirements/${ps.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Dokumente
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveSubcontractor(ps.id, ps.subcontractor.company_name)}
                          className="text-destructive hover:text-destructive"
                        >
                          Entfernen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}