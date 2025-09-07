import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Building, 
  MapPin,
  Users,
  AlertTriangle,
  Eye,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  code: string;
  address: string | null;
  created_at: string;
  subcontractor_count: number;
  critical_count: number;
  expiring_count: number;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    code: '',
    address: ''
  });
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchProjects();
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.address && project.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProjects(filtered);
  }, [projects, searchTerm]);

  const fetchProjects = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);

      // Fetch projects with subcontractor and requirement stats
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          code,
          address,
          created_at,
          project_subs (
            id,
            requirements (
              status
            )
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to calculate stats
      const processedProjects = projectsData?.map(project => {
        const allRequirements = project.project_subs.flatMap(ps => ps.requirements);
        const criticalCount = allRequirements.filter(req => req.status === 'expired').length;
        const expiringCount = allRequirements.filter(req => req.status === 'expiring').length;

        return {
          id: project.id,
          name: project.name,
          code: project.code,
          address: project.address,
          created_at: project.created_at,
          subcontractor_count: project.project_subs.length,
          critical_count: criticalCount,
          expiring_count: expiringCount
        };
      }) || [];

      setProjects(processedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Fehler",
        description: "Projekte konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          tenant_id: profile.tenant_id,
          name: newProject.name,
          code: newProject.code,
          address: newProject.address || null
        });

      if (error) throw error;

      toast({
        title: "Projekt erstellt",
        description: `Projekt "${newProject.name}" wurde erfolgreich erstellt.`
      });

      setNewProject({ name: '', code: '', address: '' });
      setIsDialogOpen(false);
      fetchProjects();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Fehler",
        description: error.message.includes('duplicate') 
          ? "Ein Projekt mit diesem Code existiert bereits."
          : "Projekt konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-professional">Projekte</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Bauprojekte und deren Nachunternehmer
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neues Projekt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateProject}>
              <DialogHeader>
                <DialogTitle>Neues Projekt erstellen</DialogTitle>
                <DialogDescription>
                  Erfassen Sie die grundlegenden Informationen für Ihr neues Bauprojekt.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Projektname *</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Sanierung Kita Sonnenweg"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Projekt-Code *</Label>
                  <Input
                    id="code"
                    placeholder="z.B. KITA-2024-001"
                    value={newProject.code}
                    onChange={(e) => setNewProject(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    placeholder="z.B. Sonnenweg 15, 10115 Berlin"
                    value={newProject.address}
                    onChange={(e) => setNewProject(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Projekt erstellen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Projektübersicht ({projects.length})
              </CardTitle>
              <CardDescription>
                Alle Ihre Bauprojekte mit Status-Informationen
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Projekte durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Projekte gefunden</h3>
              <p className="text-muted-foreground mb-4">
                {projects.length === 0 
                  ? "Erstellen Sie Ihr erstes Projekt, um mit der Nachunternehmer-Verwaltung zu beginnen."
                  : "Ihre Suche ergab keine Treffer. Versuchen Sie andere Suchbegriffe."
                }
              </p>
              {projects.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erstes Projekt erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="text-center">Nachunternehmer</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {project.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start max-w-xs">
                        {project.address ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">
                              {project.address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Keine Adresse hinterlegt
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{project.subcontractor_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        {project.critical_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {project.critical_count} abgelaufen
                          </Badge>
                        )}
                        {project.expiring_count > 0 && (
                          <Badge className="bg-warning text-warning-foreground text-xs">
                            {project.expiring_count} läuft ab
                          </Badge>
                        )}
                        {project.critical_count === 0 && project.expiring_count === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Alle aktuell
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(project.created_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/projects/${project.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Link>
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