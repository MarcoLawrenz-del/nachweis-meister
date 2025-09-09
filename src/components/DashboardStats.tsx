import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Subcontractor } from '@/types';
import { useRealtimeKPIs } from '@/hooks/useRealtimeKPIs';
import { telemetry } from '@/lib/telemetry';
import { useAppAuth } from '@/hooks/useAppAuth';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle 
} from 'lucide-react';

interface DashboardStatsProps {
  subcontractors: Subcontractor[];
}

export function DashboardStats({ subcontractors }: DashboardStatsProps) {
  const { kpis, isLoading } = useRealtimeKPIs();
  const { profile } = useAppAuth();
  
  // Fallback to calculated stats if KPIs not available
  const stats = kpis || calculateStats(subcontractors);

  const handleKPIClick = (metric: string, value: number) => {
    telemetry.track('KPIClicked', {
      metric,
      value,
      source: 'dashboard'
    }, profile?.id, profile?.tenant_id);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => handleKPIClick('total_subcontractors', stats.total_subcontractors || stats.total || 0)}
        data-testid="subcontractor-total-card"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nachunternehmer
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="total-subcontractors">
            {isLoading ? '...' : (stats.total_subcontractors || stats.total || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Aktive Subunternehmer
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => handleKPIClick('expired_requirements', stats.expired_requirements || stats.expired || 0)}
        data-testid="expired-card"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Kritische Nachweise
          </CardTitle>
          <XCircle className="h-4 w-4 text-danger" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-danger" data-testid="expired-count">
            {isLoading ? '...' : (stats.expired_requirements || stats.expired || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Abgelaufene Dokumente
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => handleKPIClick('expiring_requirements', stats.expiring_requirements || stats.expiring || 0)}
        data-testid="expiring-card"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Läuft bald ab
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning" data-testid="expiring-count">
            {isLoading ? '...' : (stats.expiring_requirements || stats.expiring || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            In den nächsten 30 Tagen
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => handleKPIClick('compliance_rate', stats.compliance_rate || stats.complianceRate || 0)}
        data-testid="compliance-card"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Compliance Rate
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success" data-testid="compliance-rate">
            {isLoading ? '...' : (stats.compliance_rate || stats.complianceRate || 0)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Vollständige Nachweise
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateStats(subcontractors: Subcontractor[]) {
  let totalDocuments = 0;
  let expiredCount = 0;
  let expiringCount = 0;
  let validCount = 0;

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  subcontractors.forEach(sub => {
    Object.values(sub.documents).forEach(doc => {
      totalDocuments++;
      
      if (doc.status === 'expired') {
        expiredCount++;
      } else if (doc.status === 'expiring') {
        expiringCount++;
      } else if (doc.status === 'valid') {
        // Check if document is expiring within 30 days
        if (doc.expiryDate) {
          const expiryDate = new Date(doc.expiryDate);
          if (expiryDate <= thirtyDaysFromNow && expiryDate > today) {
            expiringCount++;
          } else {
            validCount++;
          }
        } else {
          validCount++;
        }
      }
    });
  });

  const complianceRate = totalDocuments > 0 
    ? Math.round((validCount / totalDocuments) * 100) 
    : 0;

  return {
    total_subcontractors: subcontractors.length,
    active_subcontractors: subcontractors.filter(s => s.name).length, // Placeholder
    inactive_subcontractors: 0, // Placeholder
    total_requirements: totalDocuments,
    missing_requirements: 0, // Placeholder
    submitted_requirements: 0, // Placeholder
    in_review_requirements: 0, // Placeholder
    valid_requirements: validCount,
    rejected_requirements: 0, // Placeholder
    expiring_requirements: expiringCount,
    expired_requirements: expiredCount,
    compliance_rate: complianceRate,
    last_updated: new Date().toISOString(),
    // Legacy support
    total: subcontractors.length,
    expired: expiredCount,
    expiring: expiringCount,
    valid: validCount,
    complianceRate
  };
}