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
  
  // Get docs from store
  const docs = useContractorDocuments(subId);

  // Calculate KPIs from ContractorDocument[]
  const missing = docs.filter(d => d.requirement === "required" && ["missing", "rejected", "expired"].includes(d.status)).length;
  const reviewing = docs.filter(d => ["submitted", "in_review"].includes(d.status)).length;
  const expiring = docs.filter(d => d.status === "accepted" && d.validUntil && isExpiring(new Date(d.validUntil), 30)).length;
  const valid = docs.filter(d => d.status === "accepted" && (!d.validUntil || !isExpiring(new Date(d.validUntil), 30))).length;
  const requiredCount = docs.filter(d => d.requirement === "required").length;
  const showComplete = requiredCount > 0 && missing === 0 && reviewing === 0 && expiring === 0 && valid > 0;
  const agg = aggregateContractorStatusById(subId);

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
            agg === "complete" ? "default" : 
            agg === "attention" ? "secondary" : 
            "destructive"
          } className={
            agg === "complete" ? "bg-green-100 text-green-800 border-green-200" :
            agg === "attention" ? "bg-amber-100 text-amber-800 border-amber-200" :
            "bg-red-100 text-red-800 border-red-200"
          }>
            {agg === "complete" ? "Vollständig" : 
             agg === "attention" ? "Aufmerksamkeit" : 
             "Fehlt"}
          </Badge>
        </div>
      </div>

      {/* Complete Banner */}
      {showComplete && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            🎉 Alles vollständig! Alle erforderlichen Dokumente sind eingereicht und gültig.
          </AlertDescription>
        </Alert>
      )}

      {/* No Required Documents Message */}
      {requiredCount === 0 && (
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

      {/* Was fehlt jetzt? Section */}
      {priorityRequirements.length > 0 ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Was fehlt jetzt?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityRequirements.map((requirement) => {
              const { actionLabel, actionIcon: ActionIcon, variant, color } = getNextAction(requirement);
              return (
                <div
                  key={requirement.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{requirement.document_types.name_de}</h3>
                      <StatusBadge status={requirement.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {requirement.document_types.description_de}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant={variant}
                      size="sm"
                      onClick={() => onActionClick(actionLabel.toLowerCase().replace(' ', '_'), requirement.id)}
                      className={`flex items-center gap-2 ${color}`}
                    >
                      <ActionIcon className="h-4 w-4" />
                      {actionLabel}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Alles vollständig!</h3>
            <p className="text-green-700">Für diesen Nachunternehmer sind aktuell keine Pflichtnachweise erforderlich.</p>
          </CardContent>
        </Card>
      )}

      {/* All Requirements Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Pflichtanforderungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requirements
              .filter(r => r.document_types.required_by_default)
              .map((requirement) => {
                const { actionLabel, actionIcon: ActionIcon, variant } = getNextAction(requirement);
                
                return (
                  <div key={requirement.id} 
                       className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={requirement.status} />
                      <span className="font-medium">{requirement.document_types.name_de}</span>
                    </div>
                    
                    {requirement.status !== 'valid' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onActionClick(actionLabel.toLowerCase().replace(' ', '_'), requirement.id)}
                      >
                        <ActionIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity Timeline */}
      {reviewHistory && reviewHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviewHistory.slice(0, 5).map((activity, index) => {
                const activityConfig = {
                  approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Genehmigt' },
                  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Abgelehnt' },
                  submitted: { icon: Upload, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Eingereicht' },
                  default: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Aktivität' }
                };
                
                const config = activityConfig[activity.status as keyof typeof activityConfig] || activityConfig.default;
                const ActivityIcon = config.icon;
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${config.bg}`}>
                      <ActivityIcon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{config.label}</p>
                        <Badge variant="outline" className="text-xs">
                          {formatDistanceToNow(new Date(activity.created_at), { 
                            addSuffix: true, 
                            locale: de 
                          })}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.document_name || 'Dokument'} - {activity.reviewer_name || 'System'}
                      </p>
                      {activity.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {activity.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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