import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ComplianceStatusBadge, ComplianceIndicator } from './ComplianceStatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  FileText, 
  Scale,
  Building2,
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface LegalDocument {
  code: string;
  name_de: string;
  description_de: string;
  required_by_default: boolean;
  sort_order: number;
}

interface SubcontractorCompliance {
  id: string;
  company_name: string;
  status: 'active' | 'inactive';
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  activation_date: string | null;
  next_reminder_date: string | null;
  last_compliance_check: string;
  mandatory_docs_complete: number;
  total_mandatory_docs: number;
  expiring_docs_count: number;
}

interface ComplianceStats {
  totalSubcontractors: number;
  activeSubcontractors: number;
  compliantSubcontractors: number;
  expiringSubcontractors: number;
  nonCompliantSubcontractors: number;
  complianceRate: number;
  upcomingReminders: number;
}

export function LegalComplianceDashboard() {
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [subcontractorsCompliance, setSubcontractorsCompliance] = useState<SubcontractorCompliance[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    totalSubcontractors: 0,
    activeSubcontractors: 0,
    compliantSubcontractors: 0,
    expiringSubcontractors: 0,
    nonCompliantSubcontractors: 0,
    complianceRate: 0,
    upcomingReminders: 0
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthContext();

  useEffect(() => {
    if (profile?.tenant_id) {
      Promise.all([
        fetchLegalDocuments(),
        fetchSubcontractorsCompliance()
      ]);
    }
  }, [profile?.tenant_id]);

  const fetchLegalDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setLegalDocuments(data || []);
    } catch (error) {
      console.error('Error fetching legal documents:', error);
    }
  };

  const fetchSubcontractorsCompliance = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subcontractors')
        .select(`
          id,
          company_name,
          status,
          compliance_status,
          activation_date,
          next_reminder_date,
          last_compliance_check
        `)
        .eq('tenant_id', profile.tenant_id);

      if (error) throw error;

      const processedData: SubcontractorCompliance[] = data?.map(sub => ({
        ...sub,
        status: sub.status as 'active' | 'inactive',
        compliance_status: sub.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon',
        mandatory_docs_complete: 0, // Will be calculated
        total_mandatory_docs: 0,    // Will be calculated
        expiring_docs_count: 0      // Will be calculated
      })) || [];

      // Calculate stats
      const totalSubcontractors = processedData.length;
      const activeSubcontractors = processedData.filter(s => s.status === 'active').length;
      const compliantSubcontractors = processedData.filter(s => s.compliance_status === 'compliant').length;
      const expiringSubcontractors = processedData.filter(s => s.compliance_status === 'expiring_soon').length;
      const nonCompliantSubcontractors = processedData.filter(s => s.compliance_status === 'non_compliant').length;
      const complianceRate = totalSubcontractors > 0 ? Math.round((compliantSubcontractors / totalSubcontractors) * 100) : 0;
      const upcomingReminders = processedData.filter(s => 
        s.next_reminder_date && new Date(s.next_reminder_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        totalSubcontractors,
        activeSubcontractors,
        compliantSubcontractors,
        expiringSubcontractors,
        nonCompliantSubcontractors,
        complianceRate,
        upcomingReminders
      });

      setSubcontractorsCompliance(processedData);
    } catch (error) {
      console.error('Error fetching subcontractors compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const mandatoryDocuments = legalDocuments.filter(doc => doc.required_by_default);
  const optionalDocuments = legalDocuments.filter(doc => !doc.required_by_default);

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
      {/* Legal Warning Alert */}
      <Alert className="border-destructive/50 bg-destructive/5">
        <Scale className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Rechtlicher Hinweis:</strong> Diese Dokumente sind gesetzlich erforderlich, um Haftungsrisiken zu minimieren. 
          Fehlen diese, kann der Hauptunternehmer den Werklohn zurückhalten (§ Zurückbehaltungsrecht). 
          Der Generalunternehmer haftet für Sozialabgaben, Mindestlohn etc., wenn Dokumente fehlen.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance-Rate</p>
                <p className="text-2xl font-bold">{stats.complianceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <Progress value={stats.complianceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktive Nachunternehmer</p>
                <p className="text-2xl font-bold">{stats.activeSubcontractors}</p>
              </div>
              <Users className="h-8 w-8 text-professional" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              von {stats.totalSubcontractors} gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kritische Fälle</p>
                <p className="text-2xl font-bold text-destructive">{stats.nonCompliantSubcontractors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nicht compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anstehende Erinnerungen</p>
                <p className="text-2xl font-bold text-warning">{stats.upcomingReminders}</p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In den nächsten 7 Tagen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legal Documents Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mandatory Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-destructive" />
              Pflichtdokumente (Rechtlich erforderlich)
            </CardTitle>
            <CardDescription>
              Diese Dokumente sind gesetzlich vorgeschrieben und müssen für alle Nachunternehmer vorliegen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mandatoryDocuments.map((doc, index) => (
              <div key={doc.code} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{doc.name_de}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{doc.description_de}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Optional Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
              Empfohlene Dokumente (Optional)
            </CardTitle>
            <CardDescription>
              Rechtlich nicht zwingend erforderlich, aber empfohlen für zusätzliche Sicherheit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {optionalDocuments.map((doc, index) => (
              <div key={doc.code} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{doc.name_de}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{doc.description_de}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Subcontractors Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Nachunternehmer Compliance-Status
          </CardTitle>
          <CardDescription>
            Überblick über den rechtlichen Compliance-Status aller Nachunternehmer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subcontractorsCompliance.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Nachunternehmer vorhanden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subcontractorsCompliance.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <ComplianceIndicator complianceStatus={sub.compliance_status} />
                    <div>
                      <h4 className="font-medium">{sub.company_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Status: {sub.status === 'active' ? 'Aktiv' : 'Inaktiv'}</span>
                        {sub.activation_date && (
                          <span>• Aktiviert: {format(new Date(sub.activation_date), 'dd.MM.yyyy', { locale: de })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ComplianceStatusBadge 
                      complianceStatus={sub.compliance_status}
                      subcontractorStatus={sub.status}
                      size="sm"
                    />
                    {sub.next_reminder_date && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Erinnerung: {format(new Date(sub.next_reminder_date), 'dd.MM.', { locale: de })}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}