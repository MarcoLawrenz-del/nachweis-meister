import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template_key: string;
  status: 'sent' | 'failed' | 'pending';
  created_at: string;
  sent_at: string | null;
  preview_snippet: string | null;
  requirement: {
    document_type: {
      name_de: string;
    };
  } | null;
}

interface EmailLogTableProps {
  subcontractorId: string;
  requirementId?: string; // Optional: filter by specific requirement
}

export default function EmailLogTable({ subcontractorId, requirementId }: EmailLogTableProps) {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailLogs();
  }, [subcontractorId, requirementId]);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('email_logs')
        .select(`
          id,
          to_email,
          subject,
          template_key,
          status,
          created_at,
          sent_at,
          preview_snippet,
          requirement:requirements (
            document_type:document_types (
              name_de
            )
          )
        `)
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (requirementId) {
        query = query.eq('requirement_id', requirementId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEmailLogs((data || []).map(log => ({
        ...log,
        status: log.status as 'sent' | 'failed' | 'pending'
      })));
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
      toast({
        title: "Fehler beim Laden",
        description: "E-Mail-Verlauf konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-success text-success-foreground">
          <CheckCircle className="h-3 w-3 mr-1" />
          Gesendet
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Fehler
        </Badge>;
      case 'pending':
        return <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Ausstehend
        </Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const getTemplateBadge = (templateKey: string) => {
    switch (templateKey) {
      case 'invite_initial':
        return <Badge variant="outline">Einladung</Badge>;
      case 'reminder_soft':
        return <Badge className="bg-warning text-warning-foreground">Erinnerung</Badge>;
      case 'reminder_hard':
        return <Badge variant="destructive">Mahnung</Badge>;
      case 'escalation':
        return <Badge variant="destructive">Eskalation</Badge>;
      case 'monthly_refresh':
        return <Badge className="bg-blue-100 text-blue-800">Monatlich</Badge>;
      default:
        return <Badge variant="secondary">{templateKey}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            E-Mail-Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Lade E-Mail-Verlauf...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              E-Mail-Verlauf ({emailLogs.length})
            </CardTitle>
            <CardDescription>
              Alle gesendeten E-Mails an diesen Subunternehmer
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEmailLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {emailLogs.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine E-Mails versendet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Betreff</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Empfänger</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {format(new Date(log.created_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm', { locale: de })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{log.subject}</p>
                      {log.requirement && (
                        <p className="text-xs text-muted-foreground truncate">
                          {log.requirement.document_type.name_de}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTemplateBadge(log.template_key)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                    {log.sent_at && log.status === 'sent' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.sent_at), 'dd.MM. HH:mm', { locale: de })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{log.to_email}</span>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedEmail(log)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>E-Mail Details</DialogTitle>
                          <DialogDescription>
                            Detailinformationen zur gesendeten E-Mail
                          </DialogDescription>
                        </DialogHeader>
                        {selectedEmail && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Gesendet am:</strong>
                                <p>{format(new Date(selectedEmail.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                              </div>
                              <div>
                                <strong>Status:</strong>
                                <div className="mt-1">{getStatusBadge(selectedEmail.status)}</div>
                              </div>
                              <div>
                                <strong>Empfänger:</strong>
                                <p>{selectedEmail.to_email}</p>
                              </div>
                              <div>
                                <strong>Typ:</strong>
                                <div className="mt-1">{getTemplateBadge(selectedEmail.template_key)}</div>
                              </div>
                            </div>
                            <div>
                              <strong>Betreff:</strong>
                              <p className="mt-1 p-2 bg-muted rounded text-sm">{selectedEmail.subject}</p>
                            </div>
                            {selectedEmail.preview_snippet && (
                              <div>
                                <strong>Inhalt (Vorschau):</strong>
                                <p className="mt-1 p-2 bg-muted rounded text-sm">{selectedEmail.preview_snippet}</p>
                              </div>
                            )}
                            {selectedEmail.requirement && (
                              <div>
                                <strong>Dokument:</strong>
                                <p className="mt-1 text-sm">{selectedEmail.requirement.document_type.name_de}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}