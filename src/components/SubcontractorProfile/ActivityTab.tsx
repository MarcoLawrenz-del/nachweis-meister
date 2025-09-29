import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Mail, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface ActivityTabProps {
  emailLogs: any[];
  contractorId: string;
}

export function ActivityTab({ emailLogs, contractorId }: ActivityTabProps) {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        
        // Load email logs
        const { data: emailData, error: emailError } = await supabase
          .from('email_logs')
          .select('*')
          .eq('subcontractor_id', contractorId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (emailError) {
          console.error('Error loading email logs:', emailError);
        }

        // Load recent requirement changes
        const { data: reqData, error: reqError } = await supabase
          .from('requirements')
          .select(`
            id,
            status,
            updated_at,
            document_types (name_de),
            project_subs!inner (subcontractor_id)
          `)
          .eq('project_subs.subcontractor_id', contractorId)
          .order('updated_at', { ascending: false })
          .limit(10);

        if (reqError) {
          console.error('Error loading requirements:', reqError);
        }

        // Combine and format activities
        const activities = [
          ...(emailData || []).map(log => ({
            id: `email-${log.id}`,
            type: 'email',
            action: 'E-Mail gesendet',
            description: `${log.subject} an ${log.to_email}`,
            timestamp: log.created_at,
            status: log.status
          })),
          ...(reqData || []).map(req => ({
            id: `req-${req.id}`,
            type: 'requirement',
            action: 'Status geändert',
            description: `${req.document_types?.name_de}: ${req.status}`,
            timestamp: req.updated_at,
            status: req.status
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error loading activity:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contractorId) {
      loadActivity();
    }
  }, [contractorId]);

  // Generate activity items from real data
  const activities = recentActivity;

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
        {loading ? (
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