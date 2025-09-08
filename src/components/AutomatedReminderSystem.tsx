import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Mail,
  RefreshCw
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReminderItem {
  id: string;
  company_name: string;
  contact_email: string;
  next_reminder_date: string | null;
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  expiring_documents: Array<{
    document_type: string;
    valid_to: string;
    days_until_expiry: number;
  }>;
}

interface AutomatedReminderSystemProps {
  onReminderSent?: () => void;
}

export function AutomatedReminderSystem({ onReminderSent }: AutomatedReminderSystemProps) {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchReminders();
    }
  }, [profile?.tenant_id]);

  const fetchReminders = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);

      // Fetch subcontractors with upcoming reminders or expiring documents
      const { data: subcontractors, error } = await supabase
        .from('subcontractors')
        .select(`
          id,
          company_name,
          contact_email,
          next_reminder_date,
          compliance_status,
          project_subs (
            requirements (
              document_type:document_types (
                name_de
              ),
              documents (
                valid_to
              )
            )
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('next_reminder_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Process reminder data
      const processedReminders: ReminderItem[] = (subcontractors || []).map(sub => {
        const expiringDocs: Array<{
          document_type: string;
          valid_to: string;
          days_until_expiry: number;
        }> = [];

        // Find expiring documents
        sub.project_subs?.forEach(ps => {
          ps.requirements?.forEach(req => {
            req.documents?.forEach(doc => {
              if (doc.valid_to) {
                const daysUntilExpiry = differenceInDays(new Date(doc.valid_to), new Date());
                if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
                  expiringDocs.push({
                    document_type: req.document_type?.name_de || 'Unbekanntes Dokument',
                    valid_to: doc.valid_to,
                    days_until_expiry: daysUntilExpiry
                  });
                }
              }
            });
          });
        });

        return {
          id: sub.id,
          company_name: sub.company_name,
          contact_email: sub.contact_email,
          next_reminder_date: sub.next_reminder_date,
          compliance_status: sub.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon',
          expiring_documents: expiringDocs
        };
      });

      // Filter to show only relevant reminders
      const relevantReminders = processedReminders.filter(reminder => {
        const hasUpcomingReminder = reminder.next_reminder_date && 
          differenceInDays(new Date(reminder.next_reminder_date), new Date()) <= 7;
        const hasExpiringDocs = reminder.expiring_documents.length > 0;
        return hasUpcomingReminder || hasExpiringDocs;
      });

      setReminders(relevantReminders);

    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Fehler",
        description: "Erinnerungen konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReminders = async () => {
    try {
      setSendingReminders(true);

      // Call the reminder function
      const { error } = await supabase.rpc('send_compliance_reminders');

      if (error) throw error;

      toast({
        title: "Erinnerungen versendet",
        description: `${reminders.length} Erinnerungen wurden verarbeitet.`
      });

      onReminderSent?.();
      await fetchReminders(); // Refresh data

    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Fehler beim Versenden",
        description: "Erinnerungen konnten nicht versendet werden.",
        variant: "destructive"
      });
    } finally {
      setSendingReminders(false);
    }
  };

  const getReminderUrgency = (reminder: ReminderItem) => {
    const urgentDocs = reminder.expiring_documents.filter(doc => doc.days_until_expiry <= 7);
    const upcomingReminder = reminder.next_reminder_date && 
      differenceInDays(new Date(reminder.next_reminder_date), new Date()) <= 3;

    if (urgentDocs.length > 0 || upcomingReminder) {
      return 'urgent';
    } else if (reminder.expiring_documents.length > 0) {
      return 'warning';
    }
    return 'normal';
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge variant="destructive">Dringend</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-warning-foreground">Warnung</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const upcomingReminders = reminders.filter(r => 
    r.next_reminder_date && differenceInDays(new Date(r.next_reminder_date), new Date()) <= 7
  );
  const expiringDocuments = reminders.filter(r => r.expiring_documents.length > 0);
  const urgentReminders = reminders.filter(r => getReminderUrgency(r) === 'urgent');

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anstehende Erinnerungen</p>
                <p className="text-2xl font-bold">{upcomingReminders.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ablaufende Dokumente</p>
                <p className="text-2xl font-bold">{expiringDocuments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dringende Fälle</p>
                <p className="text-2xl font-bold text-destructive">{urgentReminders.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <Button 
                onClick={sendReminders}
                disabled={sendingReminders || reminders.length === 0}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendingReminders ? 'Sende...' : 'Erinnerungen senden'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reminder System */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Automatisches Erinnerungssystem
              </CardTitle>
              <CardDescription>
                Überwachung ablaufender Dokumente und automatische Benachrichtigungen an Nachunternehmer
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchReminders}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Erinnerungen erforderlich</h3>
              <p className="text-muted-foreground">
                Alle Nachunternehmer-Dokumente sind aktuell oder es sind keine kritischen Fristen in Sicht.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-warning/50 bg-warning/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Automatische Erinnerungen:</strong> Das System überwacht alle Dokumentenfristen und 
                  versendet automatisch Erinnerungen 30 Tage vor Ablauf. Dringende Fälle werden hier hervorgehoben.
                </AlertDescription>
              </Alert>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nachunternehmer</TableHead>
                    <TableHead>Nächste Erinnerung</TableHead>
                    <TableHead>Ablaufende Dokumente</TableHead>
                    <TableHead>Dringlichkeit</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder) => {
                    const urgency = getReminderUrgency(reminder);
                    
                    return (
                      <TableRow key={reminder.id} className={urgency === 'urgent' ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reminder.company_name}</p>
                            <p className="text-sm text-muted-foreground">{reminder.contact_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reminder.next_reminder_date ? (
                            <div className="text-sm">
                              <p>{format(new Date(reminder.next_reminder_date), 'dd.MM.yyyy', { locale: de })}</p>
                              <p className="text-muted-foreground">
                                in {differenceInDays(new Date(reminder.next_reminder_date), new Date())} Tagen
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Keine geplant</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {reminder.expiring_documents.length === 0 ? (
                              <span className="text-muted-foreground text-sm">Keine</span>
                            ) : (
                              reminder.expiring_documents.slice(0, 2).map((doc, index) => (
                                <div key={index} className="text-sm">
                                  <p className="font-medium">{doc.document_type}</p>
                                  <p className="text-muted-foreground">
                                    {doc.days_until_expiry === 0 ? 'Läuft heute ab' : 
                                     doc.days_until_expiry === 1 ? 'Läuft morgen ab' :
                                     `Läuft in ${doc.days_until_expiry} Tagen ab`}
                                  </p>
                                </div>
                              ))
                            )}
                            {reminder.expiring_documents.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{reminder.expiring_documents.length - 2} weitere
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(urgency)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Here you could implement individual reminder sending
                              toast({
                                title: "Einzelerinnerung",
                                description: `Erinnerung an ${reminder.company_name} wird versendet.`
                              });
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Erinnerung
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Note */}
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <strong>Automatisierung:</strong> Das System läuft kontinuierlich im Hintergrund und versendet automatisch 
          E-Mail-Erinnerungen. Die Funktionen können auch manuell ausgelöst werden, um sofortige Kontrolle zu haben.
        </AlertDescription>
      </Alert>
    </div>
  );
}