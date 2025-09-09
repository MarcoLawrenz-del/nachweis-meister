import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  Pause,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RemindersTabProps {
  emailLogs: any[];
  onSendReminder: (requirementIds?: string[]) => Promise<boolean>;
}

export function RemindersTab({ emailLogs, onSendReminder }: RemindersTabProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendImmediate = async () => {
    setIsSending(true);
    await onSendReminder();
    setIsSending(false);
  };

  // Group emails by status
  const emailStats = emailLogs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      queued: { 
        label: 'Warteschlange', 
        variant: 'outline' as const, 
        icon: Clock,
        className: 'text-blue-600 border-blue-200'
      },
      sent: { 
        label: 'Gesendet', 
        variant: 'default' as const, 
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800'
      },
      delivered: { 
        label: 'Zugestellt', 
        variant: 'default' as const, 
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800'
      },
      failed: { 
        label: 'Fehlgeschlagen', 
        variant: 'destructive' as const, 
        icon: XCircle,
        className: 'bg-red-100 text-red-800'
      }
    };
    
    return configs[status] || configs.queued;
  };

  return (
    <div className="space-y-6">
      {/* Reminder Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Erinnerungen verwalten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Senden Sie sofortige Erinnerungen für fehlende oder ablaufende Dokumente.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button 
              onClick={handleSendImmediate}
              disabled={isSending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sende...' : 'Sofortige Erinnerung senden'}
            </Button>
            
            <Button variant="outline" disabled>
              <Pause className="h-4 w-4 mr-2" />
              Erinnerungen pausieren
            </Button>
            
            <Button variant="outline" disabled>
              <Square className="h-4 w-4 mr-2" />
              Alle stoppen
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center p-3 bg-muted/50 rounded">
              <div className="text-2xl font-bold">{emailStats.queued || 0}</div>
              <div className="text-sm text-muted-foreground">In Warteschlange</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {(emailStats.sent || 0) + (emailStats.delivered || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Erfolgreich</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{emailStats.failed || 0}</div>
              <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded">
              <div className="text-2xl font-bold">{emailLogs.length}</div>
              <div className="text-sm text-muted-foreground">Gesamt</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Verlauf ({emailLogs.length})
            </div>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Noch keine E-Mails versendet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Betreff</TableHead>
                  <TableHead>Template</TableHead>
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
                      <TableCell>
                        <div className="font-medium">{log.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          An: {log.to_email}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {log.template_key.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge variant={statusConfig.variant} className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(log.created_at), 'dd.MM.yyyy', { locale: de })}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(log.created_at), 'HH:mm', { locale: de })} Uhr
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {log.preview_snippet ? (
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {log.preview_snippet}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
}