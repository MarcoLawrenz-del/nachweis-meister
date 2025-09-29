import { Link } from "react-router-dom";
import { Plus, FileText, Upload, Users, AlertTriangle, Clock, CheckCircle2, Settings, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useEffect, useState } from "react";
import { NewSubcontractorWizard } from "@/components/NewSubcontractorWizard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ActivityFeedSupabase } from "@/components/ActivityFeedSupabase";
import { useAppMode } from '@/hooks/useAppMode';
import { supabase } from '@/integrations/supabase/client';

function NavigationCard({ 
  title, 
  description, 
  icon: Icon, 
  to, 
  variant = "default" 
}: {
  title: string;
  description: string;
  icon: any;
  to: string;
  variant?: "default" | "primary";
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Navigation handled by Link component
    }
  };

  return (
    <Link to={to} className="block">
      <Card 
        className={`cursor-pointer transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none ${
          variant === 'primary' ? 'border-primary bg-primary/5' : ''
        }`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Icon className={`h-8 w-8 ${variant === 'primary' ? 'text-primary' : 'text-muted-foreground'}`} />
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    activeContractors: 0,
    missingRequiredDocs: 0,
    inReview: 0,
    expiring: 0
  });
  const [recentlyRequested, setRecentlyRequested] = useState<any[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [showNewSubcontractorWizard, setShowNewSubcontractorWizard] = useState(false);
  const { isDemo } = useAppMode();
  const [loading, setLoading] = useState(true);

  // Load Supabase data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load active subcontractors count
        const { data: subcontractors, error: subError } = await supabase
          .from('subcontractors')
          .select('id, status')
          .eq('status', 'active');

        if (subError) throw subError;

        // Load missing requirements count
        const { data: missingReqs, error: missingError } = await supabase
          .from('requirements')
          .select(`
            id,
            status,
            project_subs!inner (
              subcontractor_id,
              project_id,
              subcontractors!inner (status)
            )
          `)
          .in('status', ['missing', 'expired', 'rejected'])
          .eq('project_subs.subcontractors.status', 'active');

        if (missingError) throw missingError;

        // Load in_review requirements count
        const { data: reviewReqs, error: reviewError } = await supabase
          .from('requirements')
          .select(`
            id,
            status,
            project_subs!inner (
              subcontractor_id,
              project_id,
              subcontractors!inner (status)
            )
          `)
          .in('status', ['in_review', 'submitted'])
          .eq('project_subs.subcontractors.status', 'active');

        if (reviewError) throw reviewError;

        // Load expiring documents count
        const { data: expiringReqs, error: expiringError } = await supabase
          .from('requirements')
          .select(`
            id,
            status,
            documents (valid_to),
            project_subs!inner (
              subcontractor_id,
              project_id,
              subcontractors!inner (status)
            )
          `)
          .eq('status', 'valid')
          .eq('project_subs.subcontractors.status', 'active');

        if (expiringError) throw expiringError;

        // Count expiring docs (valid_to within 30 days)
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiringCount = expiringReqs?.filter(req => 
          req.documents.some(doc => 
            doc.valid_to && 
            new Date(doc.valid_to) <= thirtyDaysFromNow &&
            new Date(doc.valid_to) > now
          )
        ).length || 0;

        setKpis({
          activeContractors: subcontractors?.length || 0,
          missingRequiredDocs: missingReqs?.length || 0,
          inReview: reviewReqs?.length || 0,
          expiring: expiringCount
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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
        
        {/* Primary Action Button */}
        <Button 
          size="lg" 
          onClick={() => setShowNewSubcontractorWizard(true)}
          className="button-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Nachunternehmer
        </Button>
      </div>


      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/subcontractors" className="block">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none" tabIndex={0}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktive Nachunternehmer
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {kpis.activeContractors}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/subcontractors" className="block">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none" tabIndex={0}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fehlende Pflichtdokumente
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warn-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warn-600">
                {kpis.missingRequiredDocs}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/subcontractors" className="block">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none" tabIndex={0}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Prüfung
              </CardTitle>
              <Clock className="h-4 w-4 text-info-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info-600">
                {kpis.inReview}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/subcontractors" className="block">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none" tabIndex={0}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Laufen ab (≤30 Tage)
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-warn-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warn-600">
                {kpis.expiring}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tables */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Activity Feed */}
        {isDemo ? (
          <ActivityFeed className="lg:col-span-1" />
        ) : (
          <ActivityFeedSupabase className="lg:col-span-1" />
        )}
        
        <div className="lg:col-span-2 space-y-6">
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
                          <Link 
                            to={`/app/subcontractors/${item.contractor.id}`}
                            className="text-foreground hover:underline cursor-pointer font-medium"
                          >
                            {item.contractor.company_name}
                          </Link>
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
                           <Badge variant="outline" className="text-warn-600 border-warn-600/20">
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

       {/* NewSubcontractorWizard Dialog */}
       {showNewSubcontractorWizard && (
         <NewSubcontractorWizard
            isOpen={showNewSubcontractorWizard}
            onClose={() => setShowNewSubcontractorWizard(false)}
            onSuccess={() => setShowNewSubcontractorWizard(false)}
          />
       )}
     </div>
   );
 }