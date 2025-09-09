import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Upload,
  Eye,
  FileText,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ActivityTabProps {
  reviewHistory: any[];
}

export function ActivityTab({ reviewHistory }: ActivityTabProps) {
  // Get activity icon and color
  const getActivityConfig = (action: string) => {
    const configs = {
      approved: { 
        icon: CheckCircle, 
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Genehmigt'
      },
      rejected: { 
        icon: XCircle, 
        color: 'text-red-600',
        bg: 'bg-red-100',
        label: 'Abgelehnt'
      },
      submitted: { 
        icon: Upload, 
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        label: 'Eingereicht'
      },
      assigned: { 
        icon: UserPlus, 
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        label: 'Zugewiesen'
      },
      escalated: { 
        icon: AlertTriangle, 
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        label: 'Eskaliert'
      },
      updated: { 
        icon: FileText, 
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        label: 'Aktualisiert'
      }
    };
    
    return configs[action] || configs.updated;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aktivitätsverlauf ({reviewHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Noch keine Aktivitäten vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewHistory.map((activity, index) => {
                const config = getActivityConfig(activity.action);
                const ActivityIcon = config.icon;
                const isLast = index === reviewHistory.length - 1;

                return (
                  <div key={activity.id} className="relative">
                    <div className="flex gap-4">
                      {/* Timeline indicator */}
                      <div className="relative flex flex-col items-center">
                        <div className={`p-2 rounded-full ${config.bg}`}>
                          <ActivityIcon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        {!isLast && (
                          <div className="w-px h-8 bg-border mt-2" />
                        )}
                      </div>

                      {/* Activity content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={config.color}>
                                {config.label}
                              </Badge>
                              
                              {activity.requirements?.document_types && (
                                <span className="font-medium text-sm">
                                  {activity.requirements.document_types.name_de}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              Reviewer ID: {activity.reviewer_id}
                              <span>•</span>
                              <span>
                                {format(new Date(activity.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(activity.created_at), 'HH:mm', { locale: de })}
                          </div>
                        </div>

                        {/* Status changes */}
                        {activity.old_status && activity.new_status && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Status: 
                            <Badge variant="outline" className="mx-2">
                              {activity.old_status}
                            </Badge>
                            →
                            <Badge variant="outline" className="mx-2">
                              {activity.new_status}
                            </Badge>
                          </div>
                        )}

                        {/* Comments */}
                        {activity.comment && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm">{activity.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitäts-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(
              reviewHistory.reduce((acc, activity) => {
                acc[activity.action] = (acc[activity.action] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ) as [string, number][]).map(([action, count]) => {
              const config = getActivityConfig(action);
              const ActivityIcon = config.icon;
              
              return (
                <div key={action} className="text-center p-3 border rounded-lg">
                  <div className={`p-2 rounded-full ${config.bg} w-fit mx-auto mb-2`}>
                    <ActivityIcon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="font-bold text-lg">{count}</div>
                  <div className="text-sm text-muted-foreground">{config.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}