import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText,
  TrendingUp,
  Users,
  FolderOpen,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardStats {
  totalSubcontractors: number;
  totalProjects: number;
  expiringSoon: number;
  expired: number;
  inReview: number;
  approved: number;
}

interface CriticalItem {
  id: string;
  company_name: string;
  project_name: string;
  document_type: string;
  status: string;
  due_date: string | null;
  days_until_expiry: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSubcontractors: 0,
    totalProjects: 0,
    expiringSoon: 0,
    expired: 0,
    inReview: 0,
    approved: 0
  });
  const [criticalItems, setCriticalItems] = useState<CriticalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthContext();

  console.log('Dashboard rendering, profile:', profile);
  console.log('Dashboard stats:', stats);
  console.log('Dashboard loading:', loading);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // If no tenant_id, set stats to zero to show onboarding
      if (!profile.tenant_id) {
        setStats({
          totalSubcontractors: 0,
          totalProjects: 0,
          expiringSoon: 0,
          expired: 0,
          inReview: 0,
          approved: 0
        });
        setCriticalItems([]);
        setLoading(false);
        return;
      }

      // Fetch basic stats
      const [subcontractorsResult, projectsResult] = await Promise.all([
        supabase
          .from('subcontractors')
          .select('id')
          .eq('tenant_id', profile.tenant_id),
        supabase
          .from('projects')
          .select('id')
          .eq('tenant_id', profile.tenant_id)
      ]);

      // Fetch requirements with status counts
      const { data: requirements } = await supabase
        .from('requirements')
        .select(`
          *,
          project_subs!inner (
            projects!inner (tenant_id),
            subcontractors (company_name)
          ),
          document_types (name_de)
        `)
        .eq('project_subs.projects.tenant_id', profile.tenant_id);

      if (requirements) {
        const expiringSoon = requirements.filter(req => req.status === 'expiring').length;
        const expired = requirements.filter(req => req.status === 'expired').length;
        const inReview = requirements.filter(req => req.status === 'in_review').length;
        const approved = requirements.filter(req => req.status === 'valid').length;

        setStats({
          totalSubcontractors: subcontractorsResult.data?.length || 0,
          totalProjects: projectsResult.data?.length || 0,
          expiringSoon,
          expired,
          inReview,
          approved
        });

        // Fetch critical items (expiring or expired)
        const { data: criticalRequirements } = await supabase
          .from('requirements')
          .select(`
            id,
            status,
            due_date,
            project_subs!inner (
              projects!inner (name, tenant_id),
              subcontractors!inner (company_name)
            ),
            document_types!inner (name_de)
          `)
          .eq('project_subs.projects.tenant_id', profile.tenant_id)
          .in('status', ['expiring', 'expired'])
          .order('due_date', { ascending: true })
          .limit(10);

        if (criticalRequirements) {
          const critical = criticalRequirements.map((req: any) => ({
            id: req.id,
            company_name: req.project_subs?.subcontractors?.company_name || 'Unbekannt',
            project_name: req.project_subs?.projects?.name || 'Unbekannt',
            document_type: req.document_types?.name_de || 'Unbekannt',
            status: req.status,
            due_date: req.due_date,
            days_until_expiry: req.due_date 
              ? Math.ceil((new Date(req.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 0
          }));
          setCriticalItems(critical);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, className = "" }: {
    title: string;
    value: number;
    icon: any;
    trend?: string;
    className?: string;
  }) => (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard lädt...</h1>
          <p className="text-muted-foreground">Einen Moment bitte</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check if user has no data yet (onboarding needed)
  const hasNoData = !profile?.tenant_id || (stats.totalSubcontractors === 0 && stats.totalProjects === 0);
  
  console.log('hasNoData check:', hasNoData);
  console.log('profile?.tenant_id:', profile?.tenant_id);

  if (hasNoData) {
    console.log('Showing onboarding UI');
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-100 border-2 border-red-500 p-8 rounded-lg">
          <h1 className="text-4xl font-bold text-red-800 mb-4">🎉 NEUES ONBOARDING UI! 🎉</h1>
          <p className="text-xl text-red-700 mb-6">
            Willkommen bei Nachweis-Meister! Dies ist das neue MeisterTask-Design.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg border-2 border-blue-500">
              <h3 className="text-lg font-bold text-blue-800 mb-2">Schritt 1</h3>
              <p className="text-blue-700 mb-4">Nachunternehmer hinzufügen</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                <Link to="/app/subcontractors">
                  <Users className="w-4 h-4 mr-2" />
                  Nachunternehmer hinzufügen
                </Link>
              </Button>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-400">
              <h3 className="text-lg font-bold text-gray-600 mb-2">Schritt 2</h3>
              <p className="text-gray-600 mb-4">Projekt erstellen (später)</p>
              <Button variant="outline" className="w-full" disabled>
                Projekt erstellen
              </Button>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-400">
              <h3 className="text-lg font-bold text-gray-600 mb-2">Schritt 3</h3>
              <p className="text-gray-600 mb-4">Nachweise verwalten (später)</p>
              <Button variant="outline" className="w-full" disabled>
                Nachweise prüfen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-professional">Dashboard</h1>
          <p className="text-muted-foreground">
            Übersicht über alle Nachweise und kritische Fälle
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/subcontractors">
              <Users className="w-4 h-4 mr-2" />
              Nachunternehmer
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/app/projects">
              <FolderOpen className="w-4 h-4 mr-2" />
              Neues Projekt
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Nachunternehmer"
          value={stats.totalSubcontractors}
          icon={Users}
          trend="Registrierte Firmen"
        />
        <StatCard
          title="Projekte"
          value={stats.totalProjects}
          icon={FolderOpen}
          trend="Aktive Bauprojekte"
        />
        <StatCard
          title="Läuft bald ab"
          value={stats.expiringSoon}
          icon={Clock}
          trend="Innerhalb 30 Tage"
          className="border-warning/20 bg-warning/5"
        />
        <StatCard
          title="Abgelaufen"
          value={stats.expired}
          icon={XCircle}
          trend="Sofortiger Handlungsbedarf"
          className="border-danger/20 bg-danger/5"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="In Prüfung"
          value={stats.inReview}
          icon={FileText}
          trend="Warten auf Freigabe"
        />
        <StatCard
          title="Freigegeben"
          value={stats.approved}
          icon={CheckCircle}
          trend="Gültige Nachweise"
          className="border-success/20 bg-success/5"
        />
      </div>

      {/* Critical Issues */}
      {criticalItems.length > 0 && (
        <Card className="border-danger/20">
          <CardHeader>
            <CardTitle className="flex items-center text-danger">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Kritische Nachweise ({criticalItems.length})
            </CardTitle>
            <CardDescription>
              Dokumente mit sofortigem oder dringendem Handlungsbedarf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nachunternehmer</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Dokument</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fällig</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalItems.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.company_name}
                    </TableCell>
                    <TableCell>{item.project_name}</TableCell>
                    <TableCell>{item.document_type}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          item.status === 'expired' 
                            ? 'border-danger text-danger bg-danger/10' 
                            : 'border-warning text-warning bg-warning/10'
                        }
                      >
                        {item.status === 'expired' ? 'Abgelaufen' : 'Läuft ab'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {item.due_date 
                            ? format(new Date(item.due_date), 'dd.MM.yyyy', { locale: de })
                            : 'Nicht gesetzt'
                          }
                        </span>
                        <span className={`text-xs ${
                          item.days_until_expiry < 0 
                            ? 'text-danger' 
                            : item.days_until_expiry <= 7 
                            ? 'text-warning' 
                            : 'text-muted-foreground'
                        }`}>
                          {item.days_until_expiry < 0 
                            ? `${Math.abs(item.days_until_expiry)} Tage überfällig`
                            : item.days_until_expiry === 0
                            ? 'Heute fällig'
                            : `${item.days_until_expiry} Tage verbleibend`
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Erinnern
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {criticalItems.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="outline">
                  Alle {criticalItems.length} kritischen Fälle anzeigen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Schnellaktionen
            </CardTitle>
            <CardDescription>
              Häufig verwendete Funktionen für die tägliche Arbeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button className="justify-start h-12" asChild>
                <Link to="/app/subcontractors">
                  <Users className="mr-2 h-4 w-4" />
                  Nachunternehmer verwalten
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-12" asChild>
                <Link to="/app/projects">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Neues Projekt erstellen
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-12" asChild>
                <Link to="/app/review">
                  <FileText className="mr-2 h-4 w-4" />
                  Prüfungsqueue öffnen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nächste Schritte</CardTitle>
            <CardDescription>
              Empfohlene Aktionen für bessere Organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.totalSubcontractors < 3 && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-primary mr-2" />
                    <span className="text-sm font-medium">Weitere Nachunternehmer hinzufügen</span>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/app/subcontractors">Hinzufügen</Link>
                  </Button>
                </div>
              )}
              
              {stats.totalProjects < 2 && (
                <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border border-accent/20">
                  <div className="flex items-center">
                    <FolderOpen className="w-4 h-4 text-accent mr-2" />
                    <span className="text-sm font-medium">Zweites Projekt anlegen</span>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/app/projects">Erstellen</Link>
                  </Button>
                </div>
              )}

              {stats.inReview > 0 && (
                <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-warning mr-2" />
                    <span className="text-sm font-medium">{stats.inReview} Nachweise prüfen</span>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/app/review">Prüfen</Link>
                  </Button>
                </div>
              )}

              {stats.totalSubcontractors >= 3 && stats.totalProjects >= 2 && stats.inReview === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-sm text-success font-medium">Alles unter Kontrolle!</p>
                  <p className="text-xs text-muted-foreground">Ihr System läuft optimal.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}