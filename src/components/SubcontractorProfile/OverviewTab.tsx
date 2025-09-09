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

  // Get next best actions
  const getNextAction = (requirement: RequirementWithDocument) => {
    switch (requirement.status) {
      case 'missing':
        return {
          label: 'Upload anfordern',
          action: () => onActionClick('request_upload', requirement.id),
          icon: Upload,
          variant: 'default' as const,
          color: 'text-blue-600'
        };
      case 'submitted':
      case 'in_review':
        return {
          label: 'Prüfen',
          action: () => onActionClick('review', requirement.id),
          icon: Eye,
          variant: 'outline' as const,
          color: 'text-orange-600'
        };
      case 'expiring':
        return {
          label: 'Erneuern',
          action: () => onActionClick('request_renewal', requirement.id),
          icon: RotateCcw,
          variant: 'outline' as const,
          color: 'text-yellow-600'
        };
      case 'expired':
        return {
          label: 'Neu anfordern',
          action: () => onActionClick('request_upload', requirement.id),
          icon: AlertTriangle,
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      case 'rejected':
        return {
          label: 'Korrektur anfordern',
          action: () => onActionClick('request_correction', requirement.id),
          icon: XCircle,
          variant: 'outline' as const,
          color: 'text-red-600'
        };
      default:
        return null;
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

      {/* Priority Actions */}
      {priorityRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Sofortige Maßnahmen erforderlich ({priorityRequirements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityRequirements.map((requirement) => {
                const action = getNextAction(requirement);
                if (!action) return null;

                return (
                  <div key={requirement.id} 
                       className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={action.color}>
                          {requirement.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <h4 className="font-medium">{requirement.document_types.name_de}</h4>
                      </div>
                      
                      {requirement.due_date && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Fällig: {formatDistanceToNow(new Date(requirement.due_date), { 
                            addSuffix: true, 
                            locale: de 
                          })}
                        </div>
                      )}

                      {requirement.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Ablehnungsgrund: {requirement.rejection_reason}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant={action.variant}
                      size="sm"
                      onClick={action.action}
                      className="ml-4 shrink-0"
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Requirements Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Anforderungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requirements
              .filter(r => r.document_types.required_by_default)
              .map((requirement) => {
                const action = getNextAction(requirement);
                
                return (
                  <div key={requirement.id} 
                       className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={requirement.status === 'valid' ? 'default' : 'outline'}
                        className={requirement.status === 'valid' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {requirement.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="font-medium">{requirement.document_types.name_de}</span>
                    </div>
                    
                    {action && requirement.status !== 'valid' && (
                      <Button variant="ghost" size="sm" onClick={action.action}>
                        <action.icon className="h-4 w-4" />
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