import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
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
import { format, isBefore, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { BRAND } from '@/config/brand';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface DashboardStats {
  totalSubcontractors: number;
  totalProjects: number;
  expiringSoon: number;
  expired: number;
  inReview: number;
  missing: number;
  activeSubcontractors: number;
}

interface CriticalItem {
  id: string;
  company_name: string;
  project_name: string | null;
  document_name: string;
  due_date: string | null;
  status: 'expired' | 'expiring' | 'in_review' | 'missing';
  action_type: 'remind' | 'review' | 'pause';
  priority: number;
}

type FilterType = 'all' | 'active' | 'missing' | 'expired' | 'expiring' | 'review';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSubcontractors: 0,
    totalProjects: 0,
    expiringSoon: 0,
    expired: 0,
    inReview: 0,
    missing: 0,
    activeSubcontractors: 0
  });
  const [criticalItems, setCriticalItems] = useState<CriticalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('active'); // Default: nur aktive Engagements
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
  }, [profile, isDemo, filter]); // Add filter as dependency

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
          missing: 0,
          activeSubcontractors: 0
        });
        setCriticalItems([]);
        setLoading(false);
        return;
      }

      debug.log('🏢 Fetching data for tenant:', profile.tenant_id);

      // Fetch comprehensive data including subcontractors with requirements (only active for default filter)
      let subcontractorQuery = supabase
        .from('subcontractors')
        .select(`
          id, company_name, status, compliance_status,
          project_subs!inner(
            id, status, project_id,
            projects(id, name),
            requirements!inner(
              id, status, due_date, assigned_reviewer_id,
              document_types(id, name_de)
            )
          )
        `)
        .eq('tenant_id', profile.tenant_id);
        
      // Apply active filter by default to only show active subcontractors
      if (filter === 'active') {
        subcontractorQuery = subcontractorQuery.eq('status', 'active');
      }
      
      const { data: subcontractors } = await subcontractorQuery;

      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('tenant_id', profile.tenant_id);

      if (subcontractors) {
        // Calculate comprehensive stats
        const activeCount = subcontractors.filter(s => s.status === 'active').length;
        let expiredCount = 0;
        let expiringCount = 0;
        let reviewCount = 0;
        let missingCount = 0;
        const criticalItems: CriticalItem[] = [];

        const today = new Date();
        const in30Days = addDays(today, 30);

        subcontractors.forEach(sub => {
          // Only process requirements for active subcontractors or when filter allows all
          if (sub.status !== 'active' && filter === 'active') {
            return; // Skip inactive subcontractors in active filter
          }
          
          sub.project_subs.forEach(ps => {
            ps.requirements.forEach(req => {
              const dueDate = req.due_date ? new Date(req.due_date) : null;
              
              if (req.status === 'missing') {
                missingCount++;
                criticalItems.push({
                  id: req.id,
                  company_name: sub.company_name,
                  project_name: ps.projects?.name || null,
                  document_name: req.document_types.name_de,
                  due_date: req.due_date,
                  status: 'missing',
                  action_type: 'remind',
                  priority: 4
                });
              } else if (req.status === 'in_review') {
                reviewCount++;
                criticalItems.push({
                  id: req.id,
                  company_name: sub.company_name,
                  project_name: ps.projects?.name || null,
                  document_name: req.document_types.name_de,
                  due_date: req.due_date,
                  status: 'in_review',
                  action_type: 'review',
                  priority: 2
                });
              } else if (dueDate && isBefore(dueDate, today)) {
                expiredCount++;
                criticalItems.push({
                  id: req.id,
                  company_name: sub.company_name,
                  project_name: ps.projects?.name || null,
                  document_name: req.document_types.name_de,
                  due_date: req.due_date,
                  status: 'expired',
                  action_type: 'remind',
                  priority: 1
                });
              } else if (dueDate && isBefore(dueDate, in30Days)) {
                expiringCount++;
                criticalItems.push({
                  id: req.id,
                  company_name: sub.company_name,
                  project_name: ps.projects?.name || null,
                  document_name: req.document_types.name_de,
                  due_date: req.due_date,
                  status: 'expiring',
                  action_type: 'remind',
                  priority: 3
                });
              }
            });
          });
        });

        setStats({
          totalSubcontractors: subcontractors.length,
          totalProjects: projects?.length || 0,
          activeSubcontractors: activeCount,
          missing: missingCount,
          expired: expiredCount,
          expiringSoon: expiringCount,
          inReview: reviewCount
        });

        // Sort by priority and take top 10
        setCriticalItems(
          criticalItems
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 10)
        );
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

  const handleKPIClick = (filterType: FilterType) => {
    setFilter(filterType);
  };

  const getActionButton = (item: CriticalItem) => {
    switch (item.action_type) {
      case 'remind':
        return (
          <Button size="sm" variant="outline" className="text-xs">
            <Bell className="w-3 h-3 mr-1" />
            Erinnern
          </Button>
        );
      case 'review':
        return (
          <Button size="sm" variant="outline" className="text-xs" data-testid="btn-pruefen">
            <Eye className="w-3 h-3 mr-1" />
            Prüfen
          </Button>
        );
      case 'pause':
        return (
          <Button size="sm" variant="outline" className="text-xs">
            <Pause className="w-3 h-3 mr-1" />
            Pausieren
          </Button>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Abgelaufen</Badge>;
      case 'expiring':
        return <Badge variant="secondary" className="text-xs bg-warning text-warning-foreground">Läuft ab</Badge>;
      case 'in_review':
        return <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">In Prüfung</Badge>;
      case 'missing':
        return <Badge variant="secondary" className="text-xs">Fehlend</Badge>;
      default:
        return null;
    }
  };

  // Check if user has no data yet (onboarding needed)
  const hasNoData = !profile?.tenant_id || (stats.totalSubcontractors === 0 && stats.totalProjects === 0);

  if (hasNoData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Users className="w-8 h-8 text-primary-foreground" />
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
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                Schritt 1
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">{WORDING.terms.subcontractor} hinzufügen</h3>
              <p className="text-sm text-gray-600 mb-4">
                Fügen Sie Ihre ersten {WORDING.terms.subcontractor} hinzu und verwalten Sie deren Kontaktdaten.
              </p>
              <Button className="w-full" asChild>
                <Link to="/app/subcontractors">
                  <Users className="w-4 h-4 mr-2" />
                  {WORDING.terms.subcontractor} hinzufügen
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
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Automatische Überwachung</h4>
                <p className="text-xs text-gray-600">Nie wieder abgelaufene Nachweise</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Rechtzeitige Erinnerungen</h4>
                <p className="text-xs text-gray-600">Frühzeitige Benachrichtigungen</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Vollständige Übersicht</h4>
                <p className="text-xs text-gray-600">Dashboard mit allen Kennzahlen</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-gray-900">Kritische Warnungen</h4>
                <p className="text-xs text-gray-600">Sofortige Handlungshinweise</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-blue-200 text-center">
              <p className="text-xs text-gray-500">
                📘 Benötigen Sie Hilfe mit Dokumenten? 
                <a href="https://www.deutsche-verbindungsstelle-krankenversicherung-ausland.de/buerger/faq_a1" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 underline ml-1">
                  A1-Bescheinigung
                </a> •
                <a href="https://www.zoll.de/DE/Fachthemen/Arbeit/Mindestlohn/Anmeldung-Dienstleistung/anmeldung-dienstleistung_node.html" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 underline ml-1">
                  GZD-Meldung
                </a> •
                <a href="https://www.make-it-in-germany.com/de/visum-aufenthalt/arten/arbeit" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 underline ml-1">
                  Arbeitserlaubnis
                </a>
              </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Pflichtnachweise automatisch einsammeln.</h1>
          <p className="text-muted-foreground">
            Nur erforderliche Nachweise. Automatische Erinnerungen. Klarer Status.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <Info className="w-3 h-3 mr-1" />
              Nur Pflichtnachweise werden angefordert und als fehlend gewarnt
            </Badge>
          </div>
        </div>
        
        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor="engagement-filter" className="text-sm font-medium">
            Anzeigen:
          </Label>
          <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Nur aktive Engagements
                </div>
              </SelectItem>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Alle {WORDING.terms.subcontractor}
                </div>
              </SelectItem>
              <SelectItem value="missing">Fehlende Nachweise</SelectItem>
              <SelectItem value="expired">Abgelaufene Dokumente</SelectItem>
              <SelectItem value="expiring">Auslaufende Dokumente</SelectItem>
              <SelectItem value="review">In Prüfung</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI-Kacheln (klickbar) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'active' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleKPIClick('active')}
          data-testid="kpi-firmen"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                 <div className="flex items-center gap-2">
                   <p className="text-sm font-medium text-muted-foreground">Aktive beauftragte Firmen</p>
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger>
                         <Info className="w-4 h-4 text-muted-foreground" />
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Nachunternehmer mit vollständiger Compliance, die sofort eingesetzt werden können</p>
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                 </div>
                <p className="text-2xl font-bold">{stats.activeSubcontractors}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'missing' ? 'ring-2 ring-muted-foreground' : ''}`}
          onClick={() => handleKPIClick('missing')}
          data-testid="kpi-fehlend"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Fehlende Nachweise</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Pflichtdokumente, die noch nicht hochgeladen wurden</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-muted-foreground">{stats.missing}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'expired' ? 'ring-2 ring-destructive' : ''}`}
          onClick={() => handleKPIClick('expired')}
          data-testid="kpi-abgelaufen"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Abgelaufen</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dokumente, deren Gültigkeit bereits überschritten ist - sofortiger Handlungsbedarf</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'expiring' ? 'ring-2 ring-warning' : ''}`}
          onClick={() => handleKPIClick('expiring')}
          data-testid="kpi-30tage"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">≤ 30 Tage</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Nachweise, die in den nächsten 30 Tagen erneuert werden müssen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-warning">{stats.expiringSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'review' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleKPIClick('review')}
          data-testid="kpi-inpruefung"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">In Prüfung</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hochgeladene Dokumente, die eine Freigabe durch Ihr Team benötigen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.inReview}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Immediate Action Required - Hero Section for critical cases */}
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
                Rechtliche Risiken - Sofortmaßnahmen erforderlich
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {stats.expired > 0 && (
                  <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-danger" />
                      <span className="font-semibold text-danger text-lg">{stats.expired}</span>
                      <span className="text-danger-foreground/80">rechtlich kritische Fälle</span>
                    </div>
                  </div>
                )}
                {stats.expiringSoon > 0 && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-warning" />
                      <span className="font-semibold text-warning text-lg">{stats.expiringSoon}</span>
                      <span className="text-warning-foreground/80">benötigen Verlängerung</span>
                    </div>
                  </div>
                )}
              </div>
              <Button size="lg" className="bg-danger hover:bg-danger/90" asChild>
                <Link to="/app/review">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Rechtliche Risiken bearbeiten
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Critical-List (Top 10) */}
      <Card data-testid="critical-list">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Prioritätenliste Compliance
              </CardTitle>
              <CardDescription>
                Die 10 wichtigsten Nachweise sortiert nach Dringlichkeit und rechtlichem Risiko
              </CardDescription>
            </div>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFilter('all')}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {criticalItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4" />
              <p className="font-medium">Alle Nachweise aktuell</p>
              <p className="text-sm">Ihr Unternehmen erfüllt alle rechtlichen Anforderungen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalItems
                .filter(item => {
                  if (filter === 'all') return true;
                  if (filter === 'expired') return item.status === 'expired';
                  if (filter === 'expiring') return item.status === 'expiring';
                  if (filter === 'missing') return item.status === 'missing';
                  if (filter === 'review') return item.status === 'in_review';
                  return true;
                })
                .map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium truncate">{item.company_name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground truncate">
                          {item.project_name || 'Global'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm truncate">{item.document_name}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {item.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.due_date), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    )}
                    {getActionButton(item)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Critical Issues - Success State */}
      {(stats.expired === 0 && stats.expiringSoon === 0 && stats.missing === 0) && (
        <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-success mb-2">
                Rechtssichere Projektabwicklung
              </h2>
              <p className="text-success-foreground/80 mb-4">
                Alle {WORDING.terms.requiredDoc}e sind gültig und aktuell. Ihre {WORDING.terms.subcontractor} können 
                ohne rechtliche Risiken eingesetzt werden.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="border-success/20 text-success hover:bg-success/10" asChild>
                  <Link to="/app/subcontractors">
                    <Users className="w-4 h-4 mr-2" />
                    Alle {WORDING.terms.subcontractor} verwalten
                  </Link>
                </Button>
                <Button variant="outline" className="border-success/20 text-success hover:bg-success/10" asChild>
                  <Link to="/app/projects">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Projekte ansehen
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rechtlicher Hinweis */}
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Rechtliche Hinweise:</strong> Als Generalunternehmer tragen Sie die Verantwortung für die 
          ordnungsgemäße Dokumentation aller Nachunternehmer. Unvollständige Nachweise können zu 
          Haftungsrisiken, Bußgeldern und Bauabzugssteuer-Problemen führen.
        </AlertDescription>
      </Alert>
    </div>
  );
}