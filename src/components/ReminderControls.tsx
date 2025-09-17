import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendReminderMissing } from '@/services/email';
import { 
  Play, 
  Pause, 
  Square, 
  Mail, 
  MoreVertical,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ReminderJob {
  id: string;
  state: 'active' | 'paused' | 'completed' | 'escalated';
  next_run_at: string | null;
  attempts: number;
  max_attempts: number;
  escalated: boolean;
}

interface ReminderControlsProps {
  requirementId: string;
  subcontractorId: string;
  reminderJob?: ReminderJob | null;
  onJobUpdate?: () => void;
}

export default function ReminderControls({ 
  requirementId, 
  subcontractorId, 
  reminderJob, 
  onJobUpdate 
}: ReminderControlsProps) {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'stop' | 'immediate' | null;
    title: string;
    description: string;
  }>({ type: null, title: '', description: '' });
  const { toast } = useToast();

  const handleReminderAction = async (action: 'pause' | 'resume' | 'stop' | 'immediate') => {
    try {
      setLoading(true);

      if (action === 'immediate') {
      // Send immediate reminder via stub
      await sendReminderMissing({
        contractorId: subcontractorId,
        email: "", // Email will be fetched in the stub
        missingDocs: [requirementId]
      });

        toast({
          title: "Sofortige Erinnerung gesendet",
          description: "Die Erinnerung wurde erfolgreich versendet."
        });
      } else {
        // Update reminder job state
        let newState: string;
        let nextRunAt: string | null = null;

        switch (action) {
          case 'pause':
            newState = 'paused';
            break;
          case 'resume':
            newState = 'active';
            // Set next run to now + 1 hour for immediate resumption
            nextRunAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            break;
          case 'stop':
            newState = 'completed';
            break;
          default:
            throw new Error('Unknown action');
        }

        if (reminderJob) {
          // Update existing job
          const updateData: any = { 
            state: newState,
            updated_at: new Date().toISOString()
          };
          
          if (nextRunAt) {
            updateData.next_run_at = nextRunAt;
          }

          const { error } = await supabase
            .from('reminder_jobs')
            .update(updateData)
            .eq('id', reminderJob.id);

          if (error) throw error;
        } else if (action === 'resume') {
          // Create new job if resuming and none exists
          const { error } = await supabase
            .from('reminder_jobs')
            .insert({
              requirement_id: requirementId,
              state: 'active',
              next_run_at: nextRunAt,
              attempts: 0,
              max_attempts: 5
            });

          if (error) throw error;
        }

        toast({
          title: "Reminder-Status aktualisiert",
          description: `Reminder wurde ${action === 'pause' ? 'pausiert' : action === 'resume' ? 'fortgesetzt' : 'gestoppt'}.`
        });
      }

      onJobUpdate?.();
    } catch (error: any) {
      console.error('Error handling reminder action:', error);
      toast({
        title: "Fehler",
        description: error.message || "Aktion konnte nicht ausgeführt werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setConfirmAction({ type: null, title: '', description: '' });
    }
  };

  const getStateInfo = () => {
    if (!reminderJob) {
      return {
        badge: <Badge variant="secondary">Inaktiv</Badge>,
        description: "Kein automatischer Reminder aktiv"
      };
    }

    switch (reminderJob.state) {
      case 'active':
        return {
          badge: <Badge className="bg-success text-success-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Aktiv
          </Badge>,
          description: reminderJob.next_run_at 
            ? `Nächste Erinnerung: ${new Date(reminderJob.next_run_at).toLocaleString('de-DE')}`
            : "Aktiv"
        };
      case 'paused':
        return {
          badge: <Badge variant="secondary">
            <Pause className="h-3 w-3 mr-1" />
            Pausiert
          </Badge>,
          description: "Automatische Erinnerungen pausiert"
        };
      case 'escalated':
        return {
          badge: <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Eskaliert
          </Badge>,
          description: "An Projektleitung eskaliert"
        };
      case 'completed':
        return {
          badge: <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Abgeschlossen
          </Badge>,
          description: "Reminder-Flow beendet"
        };
      default:
        return {
          badge: <Badge variant="outline">Unbekannt</Badge>,
          description: "Status unbekannt"
        };
    }
  };

  const stateInfo = getStateInfo();

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          {stateInfo.badge}
          <span className="text-xs text-muted-foreground">{stateInfo.description}</span>
          {reminderJob && reminderJob.attempts > 0 && (
            <span className="text-xs text-muted-foreground">
              Versuche: {reminderJob.attempts}/{reminderJob.max_attempts}
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(!reminderJob || reminderJob.state === 'paused' || reminderJob.state === 'completed') && (
              <DropdownMenuItem onClick={() => handleReminderAction('resume')}>
                <Play className="h-4 w-4 mr-2" />
                Fortsetzen
              </DropdownMenuItem>
            )}

            {reminderJob?.state === 'active' && (
              <DropdownMenuItem onClick={() => handleReminderAction('pause')}>
                <Pause className="h-4 w-4 mr-2" />
                Pausieren
              </DropdownMenuItem>
            )}

            {reminderJob && reminderJob.state !== 'completed' && (
              <DropdownMenuItem 
                onClick={() => setConfirmAction({
                  type: 'stop',
                  title: 'Reminder stoppen',
                  description: 'Möchten Sie den automatischen Reminder-Flow wirklich beenden? Diese Aktion kann nicht rückgängig gemacht werden.'
                })}
                className="text-destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Stoppen
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              onClick={() => setConfirmAction({
                type: 'immediate',
                title: 'Sofortige Erinnerung',
                description: 'Möchten Sie jetzt sofort eine Erinnerung an den Subunternehmer senden?'
              })}
            >
              <Mail className="h-4 w-4 mr-2" />
              Sofort erinnern
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog 
        open={confirmAction.type !== null} 
        onOpenChange={(open) => !open && setConfirmAction({ type: null, title: '', description: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction.type && handleReminderAction(confirmAction.type)}
              disabled={loading}
            >
              {loading ? 'Wird ausgeführt...' : 'Bestätigen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}