import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload,
  Eye,
  RotateCcw,
  FileText,
  Calendar
} from 'lucide-react';
import { KPIData, RequirementWithDocument } from '@/hooks/useSubcontractorProfile';
import { RequirementStatus } from '@/types/compliance';
import { StatusBadge } from '@/components/StatusBadge';
import { WORDING } from '@/content/wording';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface OverviewTabProps {
  kpis: KPIData;
  requirements: RequirementWithDocument[];
  onActionClick: (action: string, requirementId?: string) => void;
}

export function OverviewTab({ kpis, requirements, onActionClick }: OverviewTabProps) {
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
          variant: 'default' as const,
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
      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Fehlend</p>
                <p className="text-2xl font-bold text-red-600">{kpis.missing}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{kpis.expiring}</p>
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
                <p className="text-2xl font-bold text-blue-600">{kpis.in_review + kpis.submitted}</p>
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
                <p className="text-2xl font-bold text-green-600">{kpis.valid}</p>
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
            Compliance-Fortschritt
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
    </div>
  );
}