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
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
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

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchDashboardData();
    }
  }, [profile?.tenant_id]);

  const fetchDashboardData = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-professional">Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht über alle Nachweise und kritische Fälle
        </p>
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
          <div className="grid gap-3 md:grid-cols-3">
            <Button className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Nachunternehmer einladen
            </Button>
            <Button variant="outline" className="justify-start">
              <FolderOpen className="mr-2 h-4 w-4" />
              Neues Projekt
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Bulk-Erinnerungen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}