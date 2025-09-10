import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useToast } from '@/hooks/use-toast';
import { Bell, Clock, Pause, Play, StopCircle, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReminderJob {
  id: string;
  requirement_id: string;
  state: 'active' | 'paused' | 'completed' | 'failed';
  next_run_at: string;
  attempts: number;
  max_attempts: number;
  escalated: boolean;
  created_at: string;
  updated_at: string;
  requirements: {
    document_types: {
      name_de: string;
    };
    project_subs: {
      subcontractors: {
        company_name: string;
        contact_email: string;
      };
    };
  };
}

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  status: 'queued' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
  subcontractors: {
    company_name: string;
  };
}

export default function Reminders() {
  const [reminderJobs, setReminderJobs] = useState<ReminderJob[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'logs'>('jobs');
  const { profile } = useAppAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchReminderData();
    }
  }, [profile]);

  const fetchReminderData = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);

      // Fetch reminder jobs
      const { data: jobsData } = await supabase
        .from('reminder_jobs')
        .select(`
          *,
          requirements!inner(
            document_types(name_de),
            project_subs!inner(
              subcontractors!inner(company_name, contact_email)
            )
          )
        `)
        .order('next_run_at', { ascending: true })
        .limit(50);

      // Fetch recent email logs
      const { data: logsData } = await supabase
        .from('email_logs')
        .select(`
          *,
          subcontractors(company_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      setReminderJobs((jobsData || []) as ReminderJob[]);
      setEmailLogs((logsData || []) as EmailLog[]);
    } catch (error) {
      console.error('Error fetching reminder data:', error);
      toast({
        title: "Fehler",
        description: "Erinnerungsdaten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      
      switch (action) {
        case 'pause':
          updates.state = 'paused';
          break;
        case 'resume':
          updates.state = 'active';
          break;
        case 'stop':
          updates.state = 'completed';
          break;
      }

      const { error } = await supabase
        .from('reminder_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Aktion erfolgreich",
        description: `Erinnerung wurde ${action === 'pause' ? 'pausiert' : action === 'resume' ? 'fortgesetzt' : 'gestoppt'}.`
      });

      fetchReminderData();
    } catch (error) {
      console.error('Error updating reminder job:', error);
      toast({
        title: "Fehler",
        description: "Aktion konnte nicht ausgeführt werden.",
        variant: "destructive"
      });
    }
  };

  const sendImmediateReminder = async (requirementId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-immediate-reminder', {
        body: { requirement_id: requirementId }
      });

      if (error) throw error;

      toast({
        title: "Erinnerung gesendet",
        description: "Sofortige Erinnerung wurde versendet."
      });

      fetchReminderData();
    } catch (error) {
      console.error('Error sending immediate reminder:', error);
      toast({
        title: "Fehler",
        description: "Erinnerung konnte nicht gesendet werden.",
        variant: "destructive"
      });
    }
  };

  const getJobStatusBadge = (job: ReminderJob) => {
    if (job.escalated) {
      return <Badge variant="destructive">Eskaliert</Badge>;
    }
    
    switch (job.state) {
      case 'active':
        return <Badge variant="default">Aktiv</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausiert</Badge>;
      case 'completed':
        return <Badge variant="outline">Abgeschlossen</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">{job.state}</Badge>;
    }
  };

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-success text-success-foreground">Gesendet</Badge>;
      case 'queued':
        return <Badge variant="secondary">Warteschlange</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Erinnerungen</h1>
          <p className="text-muted-foreground">Lädt...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeJobs = reminderJobs.filter(job => job.state === 'active').length;
  const pausedJobs = reminderJobs.filter(job => job.state === 'paused').length;
  const escalatedJobs = reminderJobs.filter(job => job.escalated).length;
  const recentEmails = emailLogs.filter(log => {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return new Date(log.created_at) > dayAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Erinnerungen</h1>
        <p className="text-muted-foreground">
          Überwachen und steuern Sie automatische Erinnerungen für fehlende Nachweise
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Erinnerungen</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">Laufende Prozesse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausiert</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pausedJobs}</div>
            <p className="text-xs text-muted-foreground">Temporär gestoppt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eskaliert</CardTitle>
            <StopCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{escalatedJobs}</div>
            <p className="text-xs text-muted-foreground">Maximale Versuche erreicht</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-Mails (24h)</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEmails}</div>
            <p className="text-xs text-muted-foreground">Versendete Nachrichten</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'jobs' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('jobs')}
          className="rounded-b-none"
        >
          Erinnerungszyklen
        </Button>
        <Button
          variant={activeTab === 'logs' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('logs')}
          className="rounded-b-none"
        >
          E-Mail-Verlauf
        </Button>
      </div>

      {activeTab === 'jobs' && (
        <Card>
          <CardHeader>
            <CardTitle>Erinnerungszyklen</CardTitle>
            <CardDescription>
              Aktive und pausierte Erinnerungsprozesse für fehlende Nachweise
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reminderJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine aktiven Erinnerungen gefunden.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead>Nachweis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nächste Erinnerung</TableHead>
                    <TableHead>Versuche</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminderJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {job.requirements.project_subs.subcontractors.company_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.requirements.project_subs.subcontractors.contact_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{job.requirements.document_types.name_de}</TableCell>
                      <TableCell>{getJobStatusBadge(job)}</TableCell>
                      <TableCell>
                        {job.state === 'active' ? (
                          <div className="text-sm">
                            {format(new Date(job.next_run_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={job.attempts >= job.max_attempts ? 'text-destructive' : ''}>
                          {job.attempts}/{job.max_attempts}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendImmediateReminder(job.requirement_id)}
                            disabled={job.state === 'completed'}
                            data-testid="btn-remind-now"
                          >
                            <Bell className="w-3 h-3 mr-1" />
                            Sofort
                          </Button>
                          {job.state === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJobAction(job.id, 'pause')}
                              data-testid="btn-remind-pause"
                            >
                              <Pause className="w-3 h-3 mr-1" />
                              Pausieren
                            </Button>
                          )}
                          {job.state === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJobAction(job.id, 'resume')}
                              data-testid="btn-remind-resume"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Fortsetzen
                            </Button>
                          )}
                          {job.state !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJobAction(job.id, 'stop')}
                              data-testid="btn-remind-stop"
                            >
                              <StopCircle className="w-3 h-3 mr-1" />
                              Stopp
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>E-Mail-Verlauf</CardTitle>
            <CardDescription>
              Chronologische Übersicht aller versendeten Erinnerungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine E-Mail-Logs gefunden.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Empfänger</TableHead>
                    <TableHead>Betreff</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                        {log.sent_at && (
                          <div className="text-xs text-muted-foreground">
                            Gesendet: {format(new Date(log.sent_at), 'HH:mm', { locale: de })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.subcontractors.company_name}</div>
                          <div className="text-sm text-muted-foreground">{log.to_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                      <TableCell>{getEmailStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}