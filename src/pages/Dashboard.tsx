import { Link } from "react-router-dom";
import { Plus, FileText, Upload, Users, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateOrgKPIs, getRecentlyRequested, getExpiringDocs } from "@/services/orgAggregates";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useEffect, useState } from "react";
import { subscribe as subscribeContractors } from "@/services/contractors.store";
import { subscribe as subscribeContractorDocs } from "@/services/contractorDocs.store";

function KPICard({ title, value, icon: Icon, variant = "default" }: {
  title: string;
  value: number;
  icon: any;
  variant?: "default" | "warning" | "success";
}) {
  const colorClass = variant === "warning" ? "text-orange-600" : 
                    variant === "success" ? "text-green-600" : 
                    "text-primary";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(() => calculateOrgKPIs());
  const [recentlyRequested, setRecentlyRequested] = useState(() => getRecentlyRequested());
  const [expiringDocs, setExpiringDocs] = useState(() => getExpiringDocs());

  // Update data when stores change
  useEffect(() => {
    const updateData = () => {
      setKpis(calculateOrgKPIs());
      setRecentlyRequested(getRecentlyRequested());
      setExpiringDocs(getExpiringDocs());
    };

    const unsubscribeContractors = subscribeContractors(updateData);
    
    // Subscribe to all contractor docs changes (we need to track all contractors)
    const unsubscribers: (() => void)[] = [unsubscribeContractors];
    
    // Note: We can't easily subscribe to all contractor docs changes without knowing IDs
    // For now, we'll rely on manual refresh or the data updating when navigating
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd.MM.yyyy", { locale: de });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd.MM.yyyy HH:mm", { locale: de });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Überblick über Ihre Organisation</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/subcontractors/new">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Nachunternehmer
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/subcontractors">
              <FileText className="w-4 h-4 mr-2" />
              Dokumente anfordern
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload (Demo)
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Aktive Nachunternehmer"
          value={kpis.activeContractors}
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Fehlende Pflichtdokumente"
          value={kpis.missingRequiredDocs}
          icon={AlertTriangle}
          variant="warning"
        />
        <KPICard
          title="In Prüfung"
          value={kpis.inReview}
          icon={Clock}
          variant="default"
        />
        <KPICard
          title="Laufen ab (≤30 Tage)"
          value={kpis.expiring}
          icon={CheckCircle2}
          variant="warning"
        />
      </div>

      {/* Tables */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recently Requested */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Zuletzt angefordert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyRequested.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nachunternehmer</TableHead>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentlyRequested.map((item) => (
                    <TableRow key={item.contractor.id}>
                      <TableCell className="font-medium">
                        {item.contractor.company_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(item.lastRequestedAt)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/subcontractors/${item.contractor.id}`}>
                            Dokumente anfordern
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Dokumentenanfragen
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Bald ablaufend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringDocs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dokument</TableHead>
                    <TableHead>Nachunternehmer</TableHead>
                    <TableHead>Läuft ab</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringDocs.map((item, index) => (
                    <TableRow key={`${item.contractor.id}-${item.documentTypeId}-${index}`}>
                      <TableCell className="font-medium">
                        {item.documentName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.contractor.company_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {formatDate(item.validUntil)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/subcontractors/${item.contractor.id}`}>
                            Erinnerung senden
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Keine ablaufenden Dokumente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}