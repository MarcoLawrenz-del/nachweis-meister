import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  History, 
  Download, 
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReviewHistoryEntry {
  id: string;
  requirement_id: string;
  reviewer_id: string;
  action: 'approved' | 'rejected' | 'assigned' | 'escalated' | 'updated';
  old_status: string | null;
  new_status: string | null;
  comment: string | null;
  created_at: string;
  reviewer: {
    name: string;
    email: string;
  };
  requirement: {
    document_type: {
      name_de: string;
      code: string;
    };
  };
}

interface ReviewHistoryProps {
  projectSubId: string;
}

export function ReviewHistory({ projectSubId }: ReviewHistoryProps) {
  const [history, setHistory] = useState<ReviewHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ReviewHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchReviewHistory();
  }, [projectSubId]);

  useEffect(() => {
    applyFilters();
  }, [history, searchTerm, actionFilter, statusFilter]);

  const fetchReviewHistory = async () => {
    try {
      setLoading(true);

      // First get all requirements for this project_sub
      const { data: requirements } = await supabase
        .from('requirements')
        .select('id')
        .eq('project_sub_id', projectSubId);

      const requirementIds = requirements?.map(r => r.id) || [];
      
      if (requirementIds.length === 0) {
        setHistory([]);
        return;
      }

      // Then get review history for those requirements
      const { data: historyData, error: historyError } = await supabase
        .from('review_history')
        .select('*')
        .in('requirement_id', requirementIds)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Get unique reviewer IDs
      const reviewerIds = [...new Set(historyData?.map(h => h.reviewer_id) || [])];
      
      // Get reviewer data
      const { data: reviewers } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', reviewerIds);

      // Get requirement data with document types
      const { data: requirementsData } = await supabase
        .from('requirements')
        .select(`
          id,
          document_type:document_types (
            name_de,
            code
          )
        `)
        .in('id', requirementIds);

      // Build the combined data
      const enrichedHistory = (historyData || []).map(entry => {
        const reviewer = reviewers?.find(r => r.id === entry.reviewer_id);
        const requirement = requirementsData?.find(r => r.id === entry.requirement_id);
        
        return {
          ...entry,
          action: entry.action as ReviewHistoryEntry['action'],
          reviewer: reviewer || { name: 'Unbekannt', email: '' },
          requirement: requirement || { document_type: { name_de: 'Unbekannt', code: '' } }
        };
      });

      setHistory(enrichedHistory);
    } catch (error) {
      console.error('Error fetching review history:', error);
      toast({
        title: "Fehler",
        description: "Review-Historie konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.reviewer.name.toLowerCase().includes(term) ||
        entry.reviewer.email.toLowerCase().includes(term) ||
        entry.requirement.document_type.name_de.toLowerCase().includes(term) ||
        entry.requirement.document_type.code.toLowerCase().includes(term) ||
        (entry.comment && entry.comment.toLowerCase().includes(term))
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(entry => entry.action === actionFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => 
        entry.new_status === statusFilter || 
        entry.old_status === statusFilter
      );
    }

    setFilteredHistory(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Zeitstempel',
      'Dokument',
      'Aktion',
      'Alter Status',
      'Neuer Status',
      'Prüfer',
      'E-Mail',
      'Kommentar/Grund'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(entry => [
        format(new Date(entry.created_at), 'dd.MM.yyyy HH:mm', { locale: de }),
        `"${entry.requirement.document_type.name_de}"`,
        getActionText(entry.action),
        entry.old_status || '',
        entry.new_status || '',
        `"${entry.reviewer.name}"`,
        entry.reviewer.email,
        `"${entry.comment || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `review_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export erfolgreich",
      description: "Review-Historie wurde als CSV-Datei heruntergeladen."
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'assigned':
        return <UserPlus className="h-4 w-4 text-info" />;
      case 'updated':
      default:
        return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'approved':
        return 'Freigegeben';
      case 'rejected':
        return 'Abgelehnt';
      case 'escalated':
        return 'Eskaliert';
      case 'assigned':
        return 'Zugewiesen';
      case 'updated':
      default:
        return 'Aktualisiert';
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground">Gültig</Badge>;
      case 'in_review':
        return <Badge variant="secondary">In Prüfung</Badge>;
      case 'expired':
        return <Badge variant="destructive">Abgelaufen</Badge>;
      case 'expiring':
        return <Badge className="bg-warning text-warning-foreground">Läuft ab</Badge>;
      case 'missing':
        return <Badge variant="outline">Fehlend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
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
              <History className="mr-2 h-5 w-5" />
              Review-Historie ({filteredHistory.length})
            </CardTitle>
            <CardDescription>
              Vollständige Nachvollziehbarkeit aller Freigaben und Ablehnungen
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} disabled={filteredHistory.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <Input
              placeholder="Suche nach Prüfer, Dokument oder Kommentar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Aktion filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              <SelectItem value="approved">Freigegeben</SelectItem>
              <SelectItem value="rejected">Abgelehnt</SelectItem>
              <SelectItem value="escalated">Eskaliert</SelectItem>
              <SelectItem value="assigned">Zugewiesen</SelectItem>
              <SelectItem value="updated">Aktualisiert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="valid">Gültig</SelectItem>
              <SelectItem value="in_review">In Prüfung</SelectItem>
              <SelectItem value="expired">Abgelaufen</SelectItem>
              <SelectItem value="expiring">Läuft ab</SelectItem>
              <SelectItem value="missing">Fehlend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zeitstempel</TableHead>
              <TableHead>Dokument</TableHead>
              <TableHead>Aktion</TableHead>
              <TableHead>Status-Änderung</TableHead>
              <TableHead>Prüfer</TableHead>
              <TableHead>Kommentar/Grund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {history.length === 0 
                    ? "Noch keine Review-Historie vorhanden" 
                    : "Keine Einträge entsprechen den Filterkriterien"
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {format(new Date(entry.created_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(entry.created_at), 'HH:mm', { locale: de })} Uhr
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{entry.requirement.document_type.name_de}</p>
                      <p className="text-xs text-muted-foreground">{entry.requirement.document_type.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action)}
                      <span className="text-sm font-medium">{getActionText(entry.action)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {entry.old_status && getStatusBadge(entry.old_status)}
                      {entry.old_status && entry.new_status && (
                        <span className="text-muted-foreground">→</span>
                      )}
                      {entry.new_status && getStatusBadge(entry.new_status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{entry.reviewer.name}</p>
                      <p className="text-muted-foreground text-xs">{entry.reviewer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.comment && (
                      <div className="text-sm text-muted-foreground max-w-xs">
                        <p className="line-clamp-2">{entry.comment}</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}