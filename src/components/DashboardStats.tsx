import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Subcontractor } from '@/types';
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
  const stats = calculateStats(subcontractors);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nachunternehmer
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Aktive Subunternehmer
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Kritische Nachweise
          </CardTitle>
          <XCircle className="h-4 w-4 text-danger" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-danger">{stats.expired}</div>
          <p className="text-xs text-muted-foreground">
            Abgelaufene Dokumente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Läuft bald ab
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{stats.expiring}</div>
          <p className="text-xs text-muted-foreground">
            In den nächsten 30 Tagen
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Compliance Rate
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{stats.complianceRate}%</div>
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
    total: subcontractors.length,
    expired: expiredCount,
    expiring: expiringCount,
    valid: validCount,
    complianceRate
  };
}