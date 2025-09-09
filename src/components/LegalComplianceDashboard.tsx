import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  Shield, AlertTriangle, Clock, Eye, Users, AlertCircle, 
  Bell, Pause, Building2, FileText, Info, Filter
} from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface CriticalItem {
  id: string;
  company_name: string;
  project_name: string | null;
  document_name: string;
  due_date: string | null;
  status: 'expired' | 'expiring' | 'in_review';
  action_type: 'remind' | 'review' | 'pause';
  priority: number;
}

interface ComplianceStats {
  activeSubcontractors: number;
  expiredDocuments: number;
  expiringIn30Days: number;
  inReview: number;
}

type FilterType = 'all' | 'active' | 'expired' | 'expiring' | 'review';

export function LegalComplianceDashboard() {
  const [stats, setStats] = useState<ComplianceStats>({
    activeSubcontractors: 0,
    expiredDocuments: 0,
    expiringIn30Days: 0,
    inReview: 0
  });
  const [criticalList, setCriticalList] = useState<CriticalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
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
      
      // Fetch stats data
      const { data: subcontractors } = await supabase
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

      if (subcontractors) {
        // Calculate stats
        const activeCount = subcontractors.filter(s => s.status === 'active').length;
        let expiredCount = 0;
        let expiringCount = 0;
        let reviewCount = 0;
        const criticalItems: CriticalItem[] = [];

        const today = new Date();
        const in30Days = addDays(today, 30);

        subcontractors.forEach(sub => {
          sub.project_subs.forEach(ps => {
            ps.requirements.forEach(req => {
              const dueDate = req.due_date ? new Date(req.due_date) : null;
              
              if (req.status === 'in_review') {
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
          activeSubcontractors: activeCount,
          expiredDocuments: expiredCount,
          expiringIn30Days: expiringCount,
          inReview: reviewCount
        });

        // Sort by priority and take top 10
        setCriticalList(
          criticalItems
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 10)
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <Button size="sm" variant="outline" className="text-xs">
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
        return <Badge variant="secondary" className="text-xs">Läuft ab</Badge>;
      case 'in_review':
        return <Badge variant="outline" className="text-xs">In Prüfung</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
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
      {/* Onboarding-Hinweise (dezent) */}
      <div className="flex gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4" />
          <span>Nur Pflichtdokumente werden gewarnt</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4" />
          <span>Engagements optional – Compliance läuft auch global</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4" />
          <span>Monatliche Pflichten werden automatisch erinnert</span>
        </div>
      </div>

      {/* KPI-Kacheln (klickbar) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'active' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleKPIClick('active')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Aktive Nachunternehmer</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Anzahl der aktiven, arbeitsfähigen Nachunternehmer</p>
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
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'expired' ? 'ring-2 ring-destructive' : ''}`}
          onClick={() => handleKPIClick('expired')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Dokumente abgelaufen</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Anzahl bereits abgelaufener Pflichtdokumente</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-destructive">{stats.expiredDocuments}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'expiring' ? 'ring-2 ring-warning' : ''}`}
          onClick={() => handleKPIClick('expiring')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">≤30 Tage</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dokumente, die in den nächsten 30 Tagen ablaufen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-warning">{stats.expiringIn30Days}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'review' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleKPIClick('review')}
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
                        <p>Dokumente, die aktuell vom Team geprüft werden</p>
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

      {/* Critical-List (Top 10) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Kritische Fälle (Top 10)
              </CardTitle>
              <CardDescription>
                Dringendste Compliance-Risiken nach Priorität sortiert
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
          {criticalList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4" />
              Keine kritischen Fälle gefunden
            </div>
          ) : (
            <div className="space-y-3">
              {criticalList.map((item, index) => (
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

      {/* Rechtlicher Hinweis */}
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Rechtliche Compliance:</strong> Als Generalunternehmer sind Sie verpflichtet, 
          die Nachweise Ihrer Nachunternehmer zu prüfen und zu dokumentieren. 
          Fehlende oder abgelaufene Dokumente können zu Haftungsrisiken und Bauabzugssteuer führen.
        </AlertDescription>
      </Alert>
    </div>
  );
}