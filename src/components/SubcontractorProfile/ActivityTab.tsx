import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Mail, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface ActivityTabProps {
  emailLogs: any[];
}

export function ActivityTab({ emailLogs }: ActivityTabProps) {
  // Generate activity items from email logs only (remove hardcoded demo data)
  const activities = emailLogs.map(log => ({
    id: log.id,
    type: 'email',
    action: 'E-Mail gesendet',
    description: `${log.template_key} an ${log.to_email}`,
    timestamp: log.created_at,
    status: log.status
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'document':
        return FileText;
      case 'status':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'sent':
        return 'bg-success-50 text-success-600';
      case 'failed':
      case 'error':
        return 'bg-danger-50 text-danger-600';
      case 'pending':
      case 'queued':
        return 'bg-warn-50 text-warn-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Aktivitätsverlauf
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Aktivitäten vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <Badge variant="outline" className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(activity.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}