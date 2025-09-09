import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Edit,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ComplianceFlags } from '@/components/ComplianceFlags';

interface Subcontractor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string;
  phone: string | null;
  address: string | null;
  country_code: string;
  notes: string | null;
  created_at: string;
  requires_employees?: boolean | null;
  has_non_eu_workers?: boolean | null;
  employees_not_employed_in_germany?: boolean | null;
  company_type: string;
  status: string;
  compliance_status: string;
}

interface ProjectAssignment {
  id: string;
  overall_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  project: {
    id: string;
    name: string;
    code: string;
    address: string | null;
  };
  requirements_summary: {
    total: number;
    missing: number;
    in_review: number;
    valid: number;
    expiring: number;
    expired: number;
  };
}

interface RecentDocument {
  id: string;
  file_name: string;
  uploaded_at: string;
  requirement: {
    document_type: {
      name_de: string;
    };
  };
  project: {
    name: string;
    code: string;
  };
}

export default function SubcontractorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    address: '',
    country_code: 'DE',
    notes: ''
  });
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id && id) {
      Promise.all([
        fetchSubcontractor(),
        fetchProjectAssignments(),
        fetchRecentDocuments()
      ]);
    }
  }, [profile?.tenant_id, id]);

  const fetchSubcontractor = async () => {
    if (!profile?.tenant_id || !id) return;

    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (error) throw error;
      setSubcontractor(data);
      
      // Set edit form data
      setEditData({
        company_name: data.company_name,
        contact_name: data.contact_name || '',
        contact_email: data.contact_email,
        phone: data.phone || '',
        address: data.address || '',
        country_code: data.country_code,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Error fetching subcontractor:', error);
      toast({
        title: "Fehler",
        description: "Nachunternehmer konnte nicht geladen werden.",
        variant: "destructive"
      });
      navigate('/app/subcontractors');
    }
  };

  const fetchProjectAssignments = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('project_subs')
        .select(`
          id,
          overall_status,
          created_at,
          approved_at,
          project:projects (
            id,
            name,
            code,
            address
          ),
          requirements (
            status
          )
        `)
        .eq('subcontractor_id', id);

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
          created_at: ps.created_at,
          approved_at: ps.approved_at,
          project: ps.project,
          requirements_summary: summary
        };
      }) || [];

      setProjectAssignments(processedData);
    } catch (error) {
      console.error('Error fetching project assignments:', error);
    }
  };

  const fetchRecentDocuments = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          uploaded_at,
          requirement:requirements (
            document_type:document_types (
              name_de
            ),
            project_sub:project_subs (
              project:projects (
                name,
                code
              )
            )
          )
        `)
        .eq('requirement.project_sub.subcontractor_id', id)
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const processedDocuments = data?.map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        uploaded_at: doc.uploaded_at,
        requirement: {
          document_type: doc.requirement.document_type
        },
        project: doc.requirement.project_sub.project
      })) || [];

      setRecentDocuments(processedDocuments);
    } catch (error) {
      console.error('Error fetching recent documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubcontractor = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({
          company_name: editData.company_name,
          contact_name: editData.contact_name || null,
          contact_email: editData.contact_email,
          phone: editData.phone || null,
          address: editData.address || null,
          country_code: editData.country_code,
          notes: editData.notes || null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Nachunternehmer aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert."
      });

      setIsEditDialogOpen(false);
      fetchSubcontractor();
    } catch (error: any) {
      console.error('Error updating subcontractor:', error);
      toast({
        title: "Fehler",
        description: "Nachunternehmer konnte nicht aktualisiert werden.",
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

  const getComplianceStatus = (summary: ProjectAssignment['requirements_summary']) => {
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

  const getTotalStats = () => {
    const totalRequirements = projectAssignments.reduce((acc, pa) => acc + pa.requirements_summary.total, 0);
    const totalIssues = projectAssignments.reduce((acc, pa) => acc + pa.requirements_summary.expired + pa.requirements_summary.missing, 0);
    const totalValid = projectAssignments.reduce((acc, pa) => acc + pa.requirements_summary.valid, 0);
    const approvedProjects = projectAssignments.filter(pa => pa.overall_status === 'approved').length;

    return {
      totalRequirements,
      totalIssues,
      totalValid,
      approvedProjects,
      complianceRate: totalRequirements > 0 ? Math.round((totalValid / totalRequirements) * 100) : 0
    };
  };

  if (loading || !subcontractor) {
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
          {[...Array(4)].map((_, i) => (
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

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/app/subcontractors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-professional">{subcontractor.company_name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">
                Seit {format(new Date(subcontractor.created_at), 'dd.MM.yyyy', { locale: de })}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {subcontractor.country_code}
            </Badge>
          </div>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nachunternehmer bearbeiten</DialogTitle>
              <DialogDescription>
                Aktualisieren Sie die Kontaktdaten des Nachunternehmers.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Firmenname *</Label>
                <Input
                  id="company_name"
                  value={editData.company_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, company_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Ansprechpartner</Label>
                <Input
                  id="contact_name"
                  value={editData.contact_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">E-Mail *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={editData.contact_email}
                    onChange={(e) => setEditData(prev => ({ ...prev, contact_email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country_code">Land</Label>
                <Select
                  value={editData.country_code}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, country_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DE">Deutschland</SelectItem>
                    <SelectItem value="AT">Österreich</SelectItem>
                    <SelectItem value="CH">Schweiz</SelectItem>
                    <SelectItem value="PL">Polen</SelectItem>
                    <SelectItem value="CZ">Tschechien</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={editData.address}
                  onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={editData.notes}
                  onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateSubcontractor}>
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedProjects} genehmigt
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance-Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalValid} von {stats.totalRequirements} gültig
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offene Probleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Fehlende/Abgelaufene Dokumente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Letzte Aktivität</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Dokumente hochgeladen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Kontaktinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subcontractor.contact_name && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>{subcontractor.contact_name}</span>
              </div>
            )}
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
              <a href={`mailto:${subcontractor.contact_email}`} className="text-primary hover:underline">
                {subcontractor.contact_email}
              </a>
            </div>
            {subcontractor.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                <a href={`tel:${subcontractor.phone}`} className="text-primary hover:underline">
                  {subcontractor.phone}
                </a>
              </div>
            )}
            {subcontractor.address && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" />
                <span className="whitespace-pre-line">{subcontractor.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {subcontractor.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Notizen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm">{subcontractor.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Compliance Flags */}
        <ComplianceFlags
          subcontractorId={subcontractor.id}
          currentFlags={{
            requires_employees: subcontractor.requires_employees,
            has_non_eu_workers: subcontractor.has_non_eu_workers,
            employees_not_employed_in_germany: subcontractor.employees_not_employed_in_germany,
          }}
          onFlagsUpdate={(flags) => {
            setSubcontractor(prev => ({ ...prev, ...flags }));
          }}
          onCompute={() => {
            // Refetch project assignments to update compliance status
            fetchProjectAssignments();
            fetchRecentDocuments();
          }}
        />
      </div>

      {/* Project Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Projektzuordnungen ({projectAssignments.length})
          </CardTitle>
          <CardDescription>
            Alle Projekte, denen {subcontractor.company_name} zugeordnet ist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projekt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Zugeordnet am</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.project.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{assignment.project.code}</Badge>
                        {assignment.project.address && (
                          <span className="truncate max-w-[200px]">{assignment.project.address}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(assignment.overall_status)}
                    {assignment.approved_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Genehmigt: {format(new Date(assignment.approved_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getComplianceStatus(assignment.requirements_summary)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {assignment.requirements_summary.valid}/{assignment.requirements_summary.total} Dokumente
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {format(new Date(assignment.created_at), 'dd.MM.yyyy', { locale: de })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/app/requirements/${assignment.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Dokumente
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/app/projects/${assignment.project.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Projekt
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Letzte Aktivitäten
            </CardTitle>
            <CardDescription>
              Die zuletzt hochgeladenen Dokumente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocuments.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.requirement.document_type.name_de} • {doc.project.code}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}