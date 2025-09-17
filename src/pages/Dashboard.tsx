import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useDemoData } from '@/hooks/useDemoData';
import { debug } from '@/lib/debug';
import { Link } from 'react-router-dom';
import { WORDING } from '@/content/wording';
import { 
  Shield, AlertTriangle, Clock, Eye, Users, AlertCircle, 
  Bell, Pause, Building2, FileText, Info, Filter, XCircle,
  TrendingUp, FolderOpen, CheckCircle
} from 'lucide-react';
import { DashboardStats } from '@/components/DashboardStats';
import { StatusToggleDemo } from '@/components/StatusToggleDemo';

type FilterType = 'all' | 'active';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSubcontractors: 0,
    activeSubcontractors: 0,
    totalProjects: 0,
    warningCount: 0,
    errorCount: 0,
    pendingRequests: 0
  });

  const [criticalItems, setCriticalItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('active');
  const { profile } = useAppAuth();
  const { isDemo, demoStats, demoCriticalItems } = useDemoData();

  // Filter active/inactive subcontractors
  useEffect(() => {
    fetchDashboardData();
  }, [profile, isDemo, filter]);

  const fetchDashboardData = async () => {
    debug.log('🚀 fetchDashboardData started, profile:', profile);
    if (!profile) {
      debug.log('❌ No profile found');
      return;
    }

    try {
      setLoading(true);
      debug.log('📈 Loading dashboard data...');

      if (isDemo) {
        debug.log('🎯 Dashboard: Using demo data');
        const demoStats = {
          totalSubcontractors: 5,
          activeSubcontractors: 4,
          totalProjects: 3,
          warningCount: 2,
          errorCount: 1,
          pendingRequests: 3
        };
        setStats(demoStats);
        setCriticalItems([]);
        setLoading(false);
        return;
      }

      // For local auth, show empty state
      debug.log('🏢 Using local auth - showing empty state to avoid Supabase calls');
      const defaultStats = {
        totalSubcontractors: 0,
        activeSubcontractors: 0, 
        totalProjects: 0,
        warningCount: 0,
        errorCount: 0,
        pendingRequests: 0
      };
      setStats(defaultStats);
      setCriticalItems([]);
      setLoading(false);
      
    } catch (error: any) {
      console.error('Error in fetchDashboardData:', error);
      setStats({
        totalSubcontractors: 0,
        activeSubcontractors: 0,
        totalProjects: 0,
        warningCount: 0,
        errorCount: 0,
        pendingRequests: 0
      });
      setCriticalItems([]);
      setLoading(false);
    }
  };

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
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-12"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-professional">Dashboard</h1>
          <p className="text-muted-foreground">
            Überblick über Compliance-Status und aktuelle Aktivitäten
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Alle ({stats.totalSubcontractors})
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
            className="text-xs"
          >
            Aktive ({stats.activeSubcontractors})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nachunternehmer
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubcontractors}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSubcontractors} aktiv
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Laufende Projekte
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnungen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warningCount}</div>
            <p className="text-xs text-muted-foreground">
              Erfordern Aufmerksamkeit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Zur Bearbeitung
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {stats.totalSubcontractors === 0 && !isDemo && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Willkommen bei subfix!</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Fügen Sie Ihren ersten Nachunternehmer hinzu, um mit der Compliance-Verwaltung zu beginnen.
            </p>
            <Link to="/app/subcontractors">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Ersten Nachunternehmer hinzufügen
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Critical Items */}
      {criticalItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Handlungsbedarf
            </CardTitle>
            <CardDescription>
              Dokumente, die Ihre Aufmerksamkeit erfordern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.company_name}</span>
                      {item.project_name && (
                        <Badge variant="secondary" className="text-xs">
                          {item.project_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {item.document_name}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <Badge 
                        variant={item.status === 'missing' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {item.status === 'missing' ? 'Fehlt' : item.status}
                      </Badge>
                      {item.due_date && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Fällig: {item.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Ansehen
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Banner */}
      {isDemo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Sie befinden sich im Demo-Modus. Die angezeigten Daten sind Beispieldaten.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}