import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Eye,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send
} from 'lucide-react';
import { RequirementWithDocument } from '@/hooks/useSubcontractorProfile';
import { RequirementStatus } from '@/types/compliance';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/lib/routes';

interface DocumentsTabProps {
  requirements: RequirementWithDocument[];
  emailLogs: any[];
  onAction: (action: string, requirementId: string) => void;
  onReview: (requirementId: string, action: 'approve' | 'reject', data: any) => Promise<boolean>;
  onSendReminder: (requirementIds?: string[]) => Promise<boolean>;
  projectId?: string;
}

export function DocumentsTab({ requirements, emailLogs, onAction, onReview, onSendReminder, projectId }: DocumentsTabProps) {
  const navigate = useNavigate();
  const { id: subId } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'submitted' | 'in_review' | 'valid' | 'rejected'>('all');
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Filter requirements
  const filteredRequirements = requirements.filter(req => {
    // Search filter
    const matchesSearch = req.document_types.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.document_types.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'mandatory' && req.document_types.required_by_default) ||
                       (typeFilter === 'optional' && !req.document_types.required_by_default);
    
    // Review filter (for review workflow integration)
    const matchesReview = reviewFilter === 'all' || req.status === reviewFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesReview;
  });

  // Handle reminder sending
  const handleSendReminder = async () => {
    setIsSendingReminder(true);
    try {
      await onSendReminder();
      setShowReminderPanel(false);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Status configuration
  const getStatusConfig = (status: RequirementStatus) => {
    const configs = {
      missing: { 
        label: 'Fehlend', 
        variant: 'outline' as const, 
        icon: XCircle, 
        className: 'text-red-600 border-red-200' 
      },
      submitted: { 
        label: 'Eingereicht', 
        variant: 'outline' as const, 
        icon: Upload, 
        className: 'text-blue-600 border-blue-200' 
      },
      in_review: { 
        label: 'In Prüfung', 
        variant: 'outline' as const, 
        icon: Clock, 
        className: 'text-blue-800 border-blue-300' 
      },
      valid: { 
        label: 'Gültig', 
        variant: 'default' as const, 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-200' 
      },
      rejected: { 
        label: 'Abgelehnt', 
        variant: 'destructive' as const, 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800' 
      },
      expiring: { 
        label: 'Läuft ab', 
        variant: 'outline' as const, 
        icon: AlertTriangle, 
        className: 'text-yellow-600 border-yellow-200' 
      },
      expired: { 
        label: 'Abgelaufen', 
        variant: 'destructive' as const, 
        icon: AlertTriangle, 
        className: 'bg-red-100 text-red-800' 
      }
    };
    
    return configs[status];
  };

  // Get available actions for each requirement with proper state transitions
  const getActions = (requirement: RequirementWithDocument) => {
    const actions = [];
    
    switch (requirement.status) {
      case 'missing':
        // Only allow upload request - no review option for missing documents
        actions.push({
          label: 'Upload anfordern',
          action: () => onAction('request_upload', requirement.id),
          variant: 'default' as const,
          icon: Upload
        });
        break;
        
      case 'submitted':
        // Document submitted - can be reviewed or viewed
        actions.push({
          label: 'Prüfen & Details',
          action: () => onAction('review', requirement.id),
          variant: 'outline' as const,
          icon: Eye
        });
        if (requirement.documents.length > 0) {
          actions.push({
            label: 'Anzeigen',
            action: () => onAction('view_document', requirement.id),
            variant: 'ghost' as const,
            icon: FileText
          });
        }
        break;
        
      case 'in_review':
        // Currently in review - can be reviewed or viewed
        actions.push({
          label: 'Prüfen & Details',
          action: () => onAction('review', requirement.id),
          variant: 'default' as const,
          icon: Eye
        });
        if (requirement.documents.length > 0) {
          actions.push({
            label: 'Anzeigen',
            action: () => onAction('view_document', requirement.id),
            variant: 'ghost' as const,
            icon: FileText
          });
        }
        break;
        
      case 'valid':
        // Valid document - can only be viewed
        if (requirement.documents.length > 0) {
          actions.push({
            label: 'Anzeigen',
            action: () => onAction('view_document', requirement.id),
            variant: 'outline' as const,
            icon: FileText
          });
        }
        break;
        
      case 'rejected':
        // Rejected - transitions back to missing, request new upload
        actions.push({
          label: 'Korrektur anfordern',
          action: () => onAction('request_correction', requirement.id),
          variant: 'destructive' as const,
          icon: XCircle
        });
        break;
        
      case 'expiring':
        // Expiring - request renewal
        actions.push({
          label: 'Verlängerung anfordern',
          action: () => onAction('request_renewal', requirement.id),
          variant: 'outline' as const,
          icon: Clock
        });
        if (requirement.documents.length > 0) {
          actions.push({
            label: 'Anzeigen',
            action: () => onAction('view_document', requirement.id),
            variant: 'ghost' as const,
            icon: FileText
          });
        }
        break;
        
      case 'expired':
        // Expired - request new upload (transitions to missing)
        actions.push({
          label: 'Neu anfordern',
          action: () => onAction('request_upload', requirement.id),
          variant: 'default' as const,
          icon: Upload
        });
        break;
    }
    
    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Suche
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReminderPanel(true)}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Erinnerung senden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Dokumenttyp suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="missing">Fehlend</SelectItem>
                <SelectItem value="in_review">In Prüfung</SelectItem>
                <SelectItem value="valid">Gültig</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="mandatory">Pflichtdokumente</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Review Filter Chips */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm font-medium">Prüfstatus:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Alle' },
                { value: 'submitted', label: 'Eingereicht' },
                { value: 'in_review', label: 'In Prüfung' },
                { value: 'valid', label: 'Gültig' },
                { value: 'rejected', label: 'Abgelehnt' }
              ].map((filter) => (
                <Badge
                  key={filter.value}
                  variant={reviewFilter === filter.value ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => setReviewFilter(filter.value as any)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumente ({filteredRequirements.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nachweis</TableHead>
                <TableHead>Pflicht/Optional</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gültig bis</TableHead>
                <TableHead>Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequirements.map((requirement) => {
                const statusConfig = getStatusConfig(requirement.status);
                const actions = getActions(requirement);
                const StatusIcon = statusConfig.icon;
                const latestDocument = requirement.documents[0]; // Most recent document

                return (
                  <TableRow key={requirement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{requirement.document_types.name_de}</div>
                        <div className="text-sm text-muted-foreground">
                          {requirement.document_types.code}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={requirement.document_types.required_by_default ? 'default' : 'outline'}>
                        {requirement.document_types.required_by_default ? 'Pflicht' : 'Optional'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={statusConfig.variant} className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {requirement.rejection_reason && (
                        <div className="text-sm text-red-600 mt-1">
                          {requirement.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {requirement.valid_to ? (
                        <div className="text-sm">
                          {format(new Date(requirement.valid_to), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    
                     <TableCell>
                        <div className="flex gap-2">
                          {actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                              <Button
                                key={index}
                                variant={action.variant}
                                size="sm"
                                onClick={action.action}
                                className="flex items-center gap-1"
                              >
                                <Icon className="h-3 w-3" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      </TableCell>
                  </TableRow>
                );
              })}
              
               {filteredRequirements.length === 0 && requirements.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-12">
                     <div className="flex flex-col items-center gap-4">
                       <FileText className="h-12 w-12 text-muted-foreground" />
                       <div className="text-center">
                         <h3 className="text-lg font-medium mb-2">Noch keine Dokumente angefordert</h3>
                         <p className="text-muted-foreground mb-4">
                           Wählen Sie ein Dokumentenpaket aus, um Anforderungen zu erstellen.
                         </p>
                          <Button 
                            onClick={() => navigate(routes.subPackage(projectId!, subId))}
                            className="gap-2"
                          >
                           <Upload className="h-4 w-4" />
                           Dokumente anfordern
                         </Button>
                       </div>
                     </div>
                   </TableCell>
                 </TableRow>
               )}
               {filteredRequirements.length === 0 && requirements.length > 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                     Keine Dokumente mit den aktuellen Filtern gefunden.
                   </TableCell>
                 </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Reminder Panel Dialog */}
      {showReminderPanel && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Erinnerung senden
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReminderPanel(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Möchten Sie eine Erinnerung für ausstehende Dokumente senden?
                  </p>
                  <div className="text-sm">
                    <strong>Ausstehende Dokumente:</strong>
                    <ul className="mt-2 space-y-1">
                      {requirements
                        .filter(req => ['missing', 'submitted', 'expired'].includes(req.status))
                        .slice(0, 3)
                        .map(req => (
                          <li key={req.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            {req.document_types.name_de}
                          </li>
                        ))}
                      {requirements.filter(req => ['missing', 'submitted', 'expired'].includes(req.status)).length > 3 && (
                        <li className="text-muted-foreground">
                          ... und {requirements.filter(req => ['missing', 'submitted', 'expired'].includes(req.status)).length - 3} weitere
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowReminderPanel(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleSendReminder}
                    disabled={isSendingReminder}
                  >
                    {isSendingReminder ? 'Sendet...' : 'Erinnerung senden'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
}