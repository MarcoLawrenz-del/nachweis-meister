import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Play, 
  Pause, 
  Square, 
  Send, 
  Clock, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ReminderJob {
  id: string;
  state: 'active' | 'paused' | 'stopped';
  next_run_at: string;
  attempts: number;
  max_attempts: number;
  escalated: boolean;
  requirement_id: string;
}

interface EmailLog {
  id: string;
  subject: string;
  template_key: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  to_email: string;
  sent_at: string | null;
  created_at: string;
  preview_snippet: string | null;
}

interface ReminderSchedulerProps {
  requirementId: string;
  subcontractorId: string;
  onUpdate?: () => void;
}

export const ReminderScheduler = ({ requirementId, subcontractorId, onUpdate }: ReminderSchedulerProps) => {
  const [reminderJob, setReminderJob] = useState<ReminderJob | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReminderData();
  }, [requirementId]);

  const loadReminderData = async () => {
    try {
      // Load reminder job
      const { data: job } = await supabase
        .from('reminder_jobs')
        .select('*')
        .eq('requirement_id', requirementId)
        .single();

      setReminderJob(job as ReminderJob);

      // Load email logs
      const { data: logs } = await supabase
        .from('email_logs')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .eq('requirement_id', requirementId)
        .order('created_at', { ascending: false });

      setEmailLogs((logs || []) as EmailLog[]);
    } catch (error) {
      console.error('Error loading reminder data:', error);
    }
  };

  const handleReminderAction = async (action: 'start' | 'pause' | 'resume' | 'stop' | 'immediate') => {
    setIsLoading(true);
    
    try {
      if (action === 'immediate') {
        // Send immediate reminder
        const { error } = await supabase.functions.invoke('send-immediate-reminder', {
          body: { 
            requirementId,
            subcontractorId 
          }
        });

        if (error) throw error;

        toast({
          title: 'Erinnerung gesendet',
          description: 'Die sofortige Erinnerung wurde versendet.'
        });
      } else {
        // Update or create reminder job
        const updateData = {
          state: action === 'start' ? 'active' : action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'stopped',
          updated_at: new Date().toISOString()
        };

        if (reminderJob) {
          const { error } = await supabase
            .from('reminder_jobs')
            .update(updateData)
            .eq('id', reminderJob.id);

          if (error) throw error;
        } else if (action === 'start') {
          // Create new reminder job
          const nextRun = new Date();
          nextRun.setDate(nextRun.getDate() + 3); // T+3 days

          const { error } = await supabase
            .from('reminder_jobs')
            .insert({
              requirement_id: requirementId,
              state: 'active',
              next_run_at: nextRun.toISOString(),
              ...updateData
            });

          if (error) throw error;
        }

        toast({
          title: 'Erinnerung aktualisiert',
          description: `Erinnerungsplan wurde ${action === 'start' ? 'gestartet' : action === 'pause' ? 'pausiert' : action === 'resume' ? 'fortgesetzt' : 'gestoppt'}.`
        });
      }

      await loadReminderData();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error handling reminder action:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Die Aktion konnte nicht ausgeführt werden.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sent':
        return { icon: CheckCircle, variant: 'default' as const, label: 'Gesendet' };
      case 'delivered':
        return { icon: CheckCircle, variant: 'default' as const, label: 'Zugestellt' };
      case 'failed':
        return { icon: XCircle, variant: 'destructive' as const, label: 'Fehlgeschlagen' };
      case 'queued':
        return { icon: Clock, variant: 'secondary' as const, label: 'Warteschlange' };
      default:
        return { icon: Clock, variant: 'secondary' as const, label: status };
    }
  };

  const getJobStateInfo = (job: ReminderJob | null) => {
    if (!job) return { badge: 'Nicht aktiv', description: 'Keine Erinnerungen geplant' };
    
    switch (job.state) {
      case 'active':
        return { 
          badge: 'Aktiv', 
          description: `Nächste Erinnerung: ${format(new Date(job.next_run_at), 'dd.MM.yyyy HH:mm')}` 
        };
      case 'paused':
        return { badge: 'Pausiert', description: 'Erinnerungen sind pausiert' };
      case 'stopped':
        return { badge: 'Gestoppt', description: 'Erinnerungen wurden gestoppt' };
      default:
        return { badge: job.state, description: '' };
    }
  };

  const stateInfo = getJobStateInfo(reminderJob);

  return (
    <div className="space-y-6">
      {/* Reminder Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Erinnerungssteuerung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge variant="outline">{stateInfo.badge}</Badge>
              <p className="text-sm text-muted-foreground">{stateInfo.description}</p>
              {reminderJob?.escalated && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Eskaliert
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleReminderAction('immediate')}
                disabled={isLoading}
                variant="outline"
                size="sm"
                data-testid="btn-remind-now"
              >
                <Send className="h-4 w-4 mr-2" />
                Sofort erinnern
              </Button>
              
              {!reminderJob || reminderJob.state === 'stopped' ? (
                <Button
                  onClick={() => handleReminderAction('start')}
                  disabled={isLoading}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Starten
                </Button>
              ) : reminderJob.state === 'active' ? (
                <Button
                  onClick={() => handleReminderAction('pause')}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  data-testid="btn-remind-pause"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausieren
                </Button>
              ) : (
                <Button
                  onClick={() => handleReminderAction('resume')}
                  disabled={isLoading}
                  size="sm"
                  data-testid="btn-remind-resume"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Fortsetzen
                </Button>
              )}
              
              {reminderJob && reminderJob.state !== 'stopped' && (
                <Button
                  onClick={() => handleReminderAction('stop')}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                  data-testid="btn-remind-stop"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stoppen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Verlauf
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadReminderData}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Noch keine E-Mails versendet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Betreff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gesendet</TableHead>
                  <TableHead>Vorschau</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.map((log) => {
                  const statusConfig = getStatusConfig(log.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>{log.subject}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.sent_at ? format(new Date(log.sent_at), 'dd.MM.yyyy HH:mm') : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.preview_snippet || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};