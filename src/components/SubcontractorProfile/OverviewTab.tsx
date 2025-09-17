import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/lib/routes';
import { ComplianceFlags } from '@/components/ComplianceFlags';

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
  const navigate = useNavigate();
  const { id: subId } = useParams<{ id: string }>();
  const wording = getWording('de'); // Can be made dynamic based on user preference
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Calculate KPIs from requirements instead of using hardcoded values
  const actualKpis = {
    missing: requirements.filter(r => r.status === 'missing').length,
    submitted: requirements.filter(r => r.status === 'submitted').length,
    in_review: requirements.filter(r => r.status === 'in_review').length,
    valid: requirements.filter(r => r.status === 'valid').length,
    rejected: requirements.filter(r => r.status === 'rejected').length,
    expiring: requirements.filter(r => r.status === 'expiring').length,
    expired: requirements.filter(r => r.status === 'expired').length
  };
  // Calculate completion percentage
  const totalMandatory = requirements.filter(r => r.document_types.required_by_default).length;
  const completedMandatory = requirements.filter(r => 
    r.document_types.required_by_default && r.status === 'valid'
  ).length;
  const completionPercentage = totalMandatory > 0 ? (completedMandatory / totalMandatory) * 100 : 0;

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
      {/* Header with Package Wizard CTA */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Übersicht</h2>
          <p className="text-muted-foreground">
            Compliance-Status und nächste Schritte
          </p>
        </div>
        {projectId && (
          <Button
            variant="outline"
            onClick={() => navigate(routes.subPackage(projectId, subId))}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {wording.overview.headerCta}
          </Button>
        )}
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{wording.overview.missing}</p>
                <p className="text-2xl font-bold text-red-600">{actualKpis.missing}</p>
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
                <p className="text-sm font-medium">{wording.overview.expiring}</p>
                <p className="text-2xl font-bold text-yellow-600">{actualKpis.expiring + actualKpis.expired}</p>
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
                <p className="text-sm font-medium">{wording.overview.inReview}</p>
                <p className="text-2xl font-bold text-blue-600">{actualKpis.in_review + actualKpis.submitted}</p>
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
                <p className="text-sm font-medium">{wording.overview.valid}</p>
                <p className="text-2xl font-bold text-green-600">{actualKpis.valid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
              {wording.overview.progress}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pflichtdokumente ({completedMandatory} von {totalMandatory})
              </span>
              <span className="text-sm font-medium">
                {Math.round(completionPercentage)}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            
            {completionPercentage === 100 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  ✅ Alle Pflichtdokumente sind vollständig und gültig!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {totalMandatory - completedMandatory} Pflichtdokument(e) fehlen oder sind ungültig.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

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
            <p className="text-green-700">Für diese beauftragte Firma sind aktuell keine Pflichtnachweise erforderlich.</p>
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

      {/* Advanced Compliance Settings (Collapsible) */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Erweiterte Compliance-Einstellungen
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnung:</strong> Diese Einstellungen sind nur für Sonderfälle gedacht. 
                  Änderungen können zu unvollständigen Compliance-Prüfungen führen.
                </AlertDescription>
              </Alert>
              
              {profile && (
                <ComplianceFlags
                  subcontractorId={profile.id}
                  currentFlags={{
                    requires_employees: profile.requires_employees,
                    has_non_eu_workers: profile.has_non_eu_workers,
                    employees_not_employed_in_germany: profile.employees_not_employed_in_germany
                  }}
                  onFlagsUpdate={() => {
                    // Flags update will trigger automatic requirement recalculation
                  }}
                />
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}