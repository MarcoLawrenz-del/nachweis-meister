import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload,
  Eye,
  RotateCcw,
  FileText,
  Calendar,
  TrendingUp,
  ChevronDown,
  Settings,
  User
} from 'lucide-react';
import { KPIData, RequirementWithDocument } from '@/hooks/useSubcontractorProfile';
import { RequirementStatus } from '@/types/compliance';
import { StatusBadge } from '@/components/StatusBadge';
import { WORDING } from '@/content/wording';
import { getWording } from '@/lib/wording';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import { aggregateContractorStatusById, type ContractorDocument } from "@/services/contractors";
import { isExpiring } from "@/utils/validity";
import RequestDocumentsDialog from "@/components/RequestDocumentsDialog";
import { useContractorDocuments } from "@/hooks/useContractorDocuments";

interface OverviewTabProps {
  kpis: KPIData;
  requirements: RequirementWithDocument[];
  reviewHistory: any[];
  profile: any;
  onActionClick: (action: string, requirementId?: string) => void;
  onUpdateProfile: (updates: any) => Promise<boolean>;
  projectId?: string;
}

export function OverviewTab({ kpis, requirements, reviewHistory, profile, onActionClick, onUpdateProfile, projectId }: OverviewTabProps) {
  const { id: urlSubId } = useParams();
  const subId = urlSubId!;
  const wording = getWording('de');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  // Get docs from store (with safety fallback)
  const docs = useContractorDocuments(subId) ?? [];

  // Get aggregated status and counts from centralized function
  const agg = aggregateContractorStatusById(subId);
  const { status, counts, hasRequired } = agg;
  
  // Use counts from aggregation
  const missing = counts.missing;
  const reviewing = counts.reviewing; 
  const expiring = counts.expiring;
  const valid = counts.valid;
  const showComplete = hasRequired && status === "complete";

  const getNextAction = (requirement: RequirementWithDocument) => {
    switch (requirement.status) {
      case 'missing':
        return {
          actionLabel: 'Upload anfordern',
          actionIcon: Upload,
          variant: 'primary' as const,
          color: 'text-blue-600'
        };
      case 'submitted':
      case 'in_review':
        return {
          actionLabel: 'Prüfen',
          actionIcon: Eye,
          variant: 'outline' as const,
          color: 'text-orange-600'
        };
      case 'expiring':
        return {
          actionLabel: 'Erneuern',
          actionIcon: RotateCcw,
          variant: 'outline' as const,
          color: 'text-yellow-600'
        };
      case 'expired':
        return {
          actionLabel: 'Neu anfordern',
          actionIcon: AlertTriangle,
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      case 'rejected':
        return {
          actionLabel: 'Korrektur anfordern',
          actionIcon: XCircle,
          variant: 'outline' as const,
          color: 'text-red-600'
        };
      default:
        return {
          actionLabel: 'Verwalten',
          actionIcon: FileText,
          variant: 'ghost' as const,
          color: 'text-gray-600'
        };
    }
  };

  // Priority requirements (need immediate action)
  const priorityRequirements = requirements
    .filter(r => r.document_types.required_by_default && 
      ['missing', 'expired', 'rejected', 'expiring'].includes(r.status))
    .sort((a, b) => {
      const priority = { expired: 1, missing: 2, rejected: 3, expiring: 4 };
      return (priority[a.status as keyof typeof priority] || 5) - 
             (priority[b.status as keyof typeof priority] || 5);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Übersicht</h2>
          <p className="text-muted-foreground">
            Compliance-Status und nächste Schritte
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRequestDialog(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Dokumente anfordern
        </Button>
      </div>

      {/* Aggregated Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <Badge variant={
            status === "complete" ? "default" : 
            status === "attention" ? "secondary" : 
            "destructive"
          } className={
            status === "complete" ? "bg-green-100 text-green-800 border-green-200" :
            status === "attention" ? "bg-amber-100 text-amber-800 border-amber-200" :
            "bg-red-100 text-red-800 border-red-200"
          }>
            {status === "complete" ? "Vollständig" : 
             status === "attention" ? "Aufmerksamkeit" : 
             "Fehlt"}
          </Badge>
        </div>
      </div>

      {/* No Required Documents Message */}
      {!hasRequired && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            Noch keine Pflichtdokumente angefordert.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Fehlend</p>
                <p className="text-2xl font-bold text-red-600">{missing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">In Prüfung</p>
                <p className="text-2xl font-bold text-blue-600">{reviewing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Läuft ab</p>
                <p className="text-2xl font-bold text-yellow-600">{expiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Gültig</p>
                <p className="text-2xl font-bold text-green-600">{valid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next 3 Open Required Documents */}
      {priorityRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Nächste Schritte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityRequirements.slice(0, 3).map((requirement) => (
              <div
                key={requirement.id}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{requirement.document_types.name_de}</h3>
                  <StatusBadge status={requirement.status} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequestDialog(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Anfordern
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Request Documents Dialog */}
      {showRequestDialog && (
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl">
            <RequestDocumentsDialog
              contractorId={subId}
              contractorEmail={profile?.contact_email}
              onClose={() => setShowRequestDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}