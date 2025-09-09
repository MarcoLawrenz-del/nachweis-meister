import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useDemoData } from '@/hooks/useDemoData';
import { debug } from '@/lib/debug';
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
import { BRAND } from '@/config/brand';

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
  const { profile } = useAppAuth();
  const { isDemo, demoStats, demoCriticalItems } = useDemoData();

  useEffect(() => {
    debug.log('🔍 Dashboard useEffect - profile:', profile, 'isDemo:', isDemo);
    
    if (isDemo) {
      // Use demo data
      debug.log('🎯 Using demo data');
      setStats(demoStats);
      setCriticalItems(demoCriticalItems);
      setLoading(false);
      return;
    }
    
    if (profile) {
      debug.log('📊 Fetching dashboard data for tenant:', profile.tenant_id);
      fetchDashboardData();
    }
  }, [profile, isDemo]);

  const fetchDashboardData = async () => {
    debug.log('🚀 fetchDashboardData started, profile:', profile);
    if (!profile) {
      debug.log('❌ No profile found');
      return;
    }

    try {
      setLoading(true);
      debug.log('📈 Loading dashboard data...');

      // If no tenant_id, set stats to zero to show onboarding
      if (!profile.tenant_id) {
        debug.log('⚠️ No tenant_id found, showing empty stats');
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

      debug.log('🏢 Fetching data for tenant:', profile.tenant_id);

      // Fetch basic stats
      debug.log('📊 Fetching subcontractors and projects...');
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

      debug.log('📊 Subcontractors result:', subcontractorsResult);
      debug.log('📊 Projects result:', projectsResult);

      if (subcontractorsResult.error) {
        console.error('❌ Subcontractors error:', subcontractorsResult.error);
      }
      if (projectsResult.error) {
        console.error('❌ Projects error:', projectsResult.error);
      }

      // Fetch requirements with status counts
      debug.log('📋 Fetching requirements...');
      const { data: requirements, error: requirementsError } = await supabase
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

      debug.log('📋 Requirements result:', { data: requirements, error: requirementsError });

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

        debug.log('✅ Stats calculated:', {
          totalSubcontractors: subcontractorsResult.data?.length || 0,
          totalProjects: projectsResult.data?.length || 0,
          expiringSoon,
          expired,
          inReview,
          approved
        });

        // Fetch critical items (expiring or expired)
        debug.log('⚠️ Fetching critical requirements...');
        const { data: criticalRequirements, error: criticalError } = await supabase
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

        debug.log('⚠️ Critical requirements result:', { data: criticalRequirements, error: criticalError });

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
          debug.log('⚠️ Critical items set:', critical);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      debug.log('🏁 Dashboard data fetch completed');
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

  if (hasNoData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Willkommen bei {BRAND.name}!</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {BRAND.description} - {BRAND.tagline}
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="relative overflow-hidden border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors bg-white">
            <CardContent className="p-6 text-center">
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Schritt 1
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Nachunternehmer hinzufügen</h3>
              <p className="text-sm text-gray-600 mb-4">
                Fügen Sie Ihre ersten Nachunternehmer hinzu und verwalten Sie deren Kontaktdaten.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                <Link to="/app/subcontractors">
                  <Users className="w-4 h-4 mr-2" />
                  Nachunternehmer hinzufügen
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-dashed border-gray-200 bg-white">
            <CardContent className="p-6 text-center">
              <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Schritt 2
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-500">Projekt erstellen</h3>
              <p className="text-sm text-gray-500 mb-4">
                Erstellen Sie Ihr erstes Bauprojekt und weisen Sie Nachunternehmer zu.
              </p>
              <Button variant="outline" className="w-full border-gray-300" disabled>
                <FolderOpen className="w-4 h-4 mr-2" />
                Projekt erstellen
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-dashed border-gray-200 bg-white">
            <CardContent className="p-6 text-center">
              <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Schritt 3
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-500">Nachweise verwalten</h3>
              <p className="text-sm text-gray-500 mb-4">
                Überwachen Sie alle wichtigen Dokumente und Fristen automatisch.
              </p>
              <Button variant="outline" className="w-full border-gray-300" disabled>
                <FileText className="w-4 h-4 mr-2" />
                Nachweise prüfen
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Was Sie mit {BRAND.name} erreichen:</h2>
              <p className="text-gray-600">{BRAND.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Automatische Überwachung</h4>
                <p className="text-xs text-gray-600">Nie wieder abgelaufene Nachweise</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Rechtzeitige Erinnerungen</h4>
                <p className="text-xs text-gray-600">Frühzeitige Benachrichtigungen</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Vollständige Übersicht</h4>
                <p className="text-xs text-gray-600">Dashboard mit allen Kennzahlen</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Kritische Warnungen</h4>
                <p className="text-xs text-gray-600">Sofortige Handlungshinweise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Sofortiger Überblick über kritische Nachweise
          </p>
        </div>
      </div>

      {/* Immediate Action Required - Hero Section */}
      {(stats.expired > 0 || stats.expiringSoon > 0) && (
        <div className="bg-gradient-to-r from-danger/10 via-warning/5 to-danger/10 border border-danger/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-danger rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-danger mb-2">
                Sofortiger Handlungsbedarf
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {stats.expired > 0 && (
                  <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-danger" />
                      <span className="font-semibold text-danger text-lg">{stats.expired}</span>
                      <span className="text-danger-foreground/80">abgelaufene Nachweise</span>
                    </div>
                  </div>
                )}
                {stats.expiringSoon > 0 && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-warning" />
                      <span className="font-semibold text-warning text-lg">{stats.expiringSoon}</span>
                      <span className="text-warning-foreground/80">laufen bald ab</span>
                    </div>
                  </div>
                )}
              </div>
              <Button size="lg" className="bg-danger hover:bg-danger/90" asChild>
                <Link to="/app/review-queue">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Kritische Fälle bearbeiten
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No Critical Issues - Success State */}
      {stats.expired === 0 && stats.expiringSoon === 0 && stats.totalSubcontractors > 0 && (
        <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-success mb-1">
                Alles im grünen Bereich!
              </h2>
              <p className="text-success-foreground/80">
                Alle Nachweise sind aktuell und gültig.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Projects & Subcontractors */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Übersicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Projekte</span>
              </div>
              <span className="font-bold text-lg">{stats.totalProjects}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Nachunternehmer</span>
              </div>
              <span className="font-bold text-lg">{stats.totalSubcontractors}</span>
            </div>
          </CardContent>
        </Card>

        {/* Document Status */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Nachweis-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">Gültig</span>
                  </div>
                  <span className="font-bold text-lg text-success">{stats.approved}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">In Prüfung</span>
                  </div>
                  <span className="font-bold text-lg">{stats.inReview}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">Läuft ab</span>
                  </div>
                  <span className="font-bold text-lg text-warning">{stats.expiringSoon}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-danger" />
                    <span className="text-sm font-medium">Abgelaufen</span>
                  </div>
                  <span className="font-bold text-lg text-danger">{stats.expired}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Items - Compact View */}
      {criticalItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                Kritische Nachweise
              </CardTitle>
              <Badge variant="outline" className="border-danger text-danger">
                {criticalItems.length} Fälle
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.company_name}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          item.status === 'expired' 
                            ? 'border-danger text-danger' 
                            : 'border-warning text-warning'
                        }
                      >
                        {item.status === 'expired' ? 'Abgelaufen' : 'Läuft ab'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.project_name} • {item.document_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {item.due_date 
                        ? format(new Date(item.due_date), 'dd.MM.yyyy', { locale: de })
                        : 'Nicht gesetzt'
                      }
                    </div>
                    <div className={`text-xs ${
                      item.days_until_expiry < 0 
                        ? 'text-danger' 
                        : item.days_until_expiry <= 7
                          ? 'text-warning'
                          : 'text-muted-foreground'
                    }`}>
                      {item.days_until_expiry < 0 
                        ? `${Math.abs(item.days_until_expiry)} Tage überfällig`
                        : `${item.days_until_expiry} Tage verbleibend`
                      }
                    </div>
                  </div>
                </div>
              ))}
              {criticalItems.length > 3 && (
                <div className="pt-3 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/app/review-queue">
                      Alle {criticalItems.length} kritischen Fälle anzeigen
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Schnellaktionen</CardTitle>
          <CardDescription>
            Häufig verwendete Funktionen für die tägliche Arbeit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex-col items-start" asChild>
              <Link to="/app/subcontractors">
                <Users className="w-6 h-6 mb-2 self-center" />
                <div className="text-center">
                  <div className="font-semibold">Nachunternehmer</div>
                  <div className="text-xs text-muted-foreground">Verwalten & hinzufügen</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col items-start" asChild>
              <Link to="/app/projects">
                <FolderOpen className="w-6 h-6 mb-2 self-center" />
                <div className="text-center">
                  <div className="font-semibold">Projekte</div>
                  <div className="text-xs text-muted-foreground">Erstellen & bearbeiten</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col items-start" asChild>
              <Link to="/app/review-queue">
                <FileText className="w-6 h-6 mb-2 self-center" />
                <div className="text-center">
                  <div className="font-semibold">Prüfungen</div>
                  <div className="text-xs text-muted-foreground">Dokumente freigeben</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col items-start" asChild>
              <Link to="/app/settings">
                <Calendar className="w-6 h-6 mb-2 self-center" />
                <div className="text-center">
                  <div className="font-semibold">Einstellungen</div>
                  <div className="text-xs text-muted-foreground">System konfigurieren</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}