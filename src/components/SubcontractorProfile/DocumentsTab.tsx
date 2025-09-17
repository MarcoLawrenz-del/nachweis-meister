import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { RequirementWithDocument } from '@/hooks/useSubcontractorProfile';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/lib/ROUTES';
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import { setDocumentStatus } from "@/services/contractors";
import { isExpired, isExpiring, computeValidUntil } from "@/utils/validity";
import { useContractorDocuments } from "@/hooks/useContractorDocuments";

interface DocumentsTabProps {
  requirements: RequirementWithDocument[];
  emailLogs: any[];
  onAction: (action: string, requirementId: string) => void;
  onReview: (requirementId: string, action: 'approve' | 'reject', data: any) => Promise<boolean>;
  onSendReminder: (requirementIds?: string[]) => Promise<boolean>;
  projectId?: string;
  profile?: any;
  contractorId: string;
}

export function DocumentsTab({ requirements, emailLogs, onAction, onReview, onSendReminder, projectId, profile, contractorId }: DocumentsTabProps) {
  const navigate = useNavigate();
  const { id: subId } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRejectDialog, setShowRejectDialog] = useState<{ documentTypeId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');
  const [validityDates, setValidityDates] = useState<Record<string, string>>({});
  
  // Load docs from store
  const docs = useContractorDocuments(contractorId);

  // Filter documents
  const filteredDocs = docs.filter(doc => {
    const docType = DOCUMENT_TYPES.find(t => t.id === doc.documentTypeId);
    if (!docType) return false;
    
    // Search filter
    const matchesSearch = docType.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         docType.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle accept document
  const handleAccept = async (doc: any) => {
    const docType = DOCUMENT_TYPES.find(t => t.id === doc.documentTypeId)!;
    let validUntil = validityDates[doc.documentTypeId];
    
    // Auto-calculate validity if not set
    if (!validUntil && docType.validity.kind !== "none") {
      const computed = computeValidUntil(docType.validity);
      validUntil = computed ? computed.toISOString().split('T')[0] : null;
    }
    
    await setDocumentStatus({
      contractorId,
      documentTypeId: doc.documentTypeId,
      status: "accepted",
      validUntil
    });
  };

  // Handle reject document
  const handleReject = async () => {
    if (!showRejectDialog) return;
    
    await setDocumentStatus({
      contractorId,
      documentTypeId: showRejectDialog.documentTypeId,
      status: "rejected",
      reason: rejectReason
    });
    
    console.info("[stub] sendRejection", { 
      contractorId, 
      documentTypeId: showRejectDialog.documentTypeId, 
      reason: rejectReason, 
      message: rejectMessage 
    });
    
    setShowRejectDialog(null);
    setRejectReason('');
    setRejectMessage('');
  };

  // Handle request again
  const handleRequestAgain = async (doc: any) => {
    await setDocumentStatus({
      contractorId,
      documentTypeId: doc.documentTypeId,
      status: "missing"
    });
    
    console.info("[stub] sendReminderMissing", { 
      contractorId, 
      documentTypeId: doc.documentTypeId 
    });
  };

  // Status configuration
  const getStatusConfig = (status: string) => {
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
        icon: FileText, 
        className: 'text-blue-800 border-blue-300' 
      },
      accepted: { 
        label: 'Angenommen', 
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
      expired: { 
        label: 'Abgelaufen', 
        variant: 'destructive' as const, 
        icon: AlertTriangle, 
        className: 'bg-red-100 text-red-800' 
      }
    };
    
    return configs[status as keyof typeof configs] || configs.missing;
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
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="missing">Fehlend</SelectItem>
                <SelectItem value="submitted">Eingereicht</SelectItem>
                <SelectItem value="in_review">In Prüfung</SelectItem>
                <SelectItem value="accepted">Angenommen</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumente ({filteredDocs.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokument</TableHead>
                <TableHead>Pflicht/Optional</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gültig bis</TableHead>
                <TableHead>Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => {
                const docType = DOCUMENT_TYPES.find(t => t.id === doc.documentTypeId);
                if (!docType) return null;
                
                const statusConfig = getStatusConfig(doc.status);
                const StatusIcon = statusConfig.icon;
                
                // Check validity states
                const validUntilDate = doc.validUntil ? new Date(doc.validUntil) : null;
                const expired = validUntilDate && isExpired(validUntilDate);
                const expiring = validUntilDate && !expired && isExpiring(validUntilDate, 30);

                return (
                  <TableRow key={doc.documentTypeId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{docType.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {docType.id}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={doc.requirement === 'required' ? 'default' : 'outline'}>
                        {doc.requirement === 'required' ? 'Pflicht' : 'Optional'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={statusConfig.variant} className={statusConfig.className}>
                          {expired ? 'Abgelaufen' : expiring ? 'Läuft ab' : statusConfig.label}
                        </Badge>
                        {expiring && !expired && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            Läuft ab
                          </Badge>
                        )}
                      </div>
                      {doc.rejectionReason && (
                        <div className="text-sm text-red-600 mt-1">
                          {doc.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        type="date"
                        value={validityDates[doc.documentTypeId] || (doc.validUntil ? doc.validUntil.split('T')[0] : '')}
                        onChange={(e) => setValidityDates(prev => ({ ...prev, [doc.documentTypeId]: e.target.value }))}
                        className="w-40"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        {doc.status === 'submitted' || doc.status === 'in_review' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAccept(doc)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Annehmen
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setShowRejectDialog({ documentTypeId: doc.documentTypeId })}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              Ablehnen
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRequestAgain(doc)}
                            className="flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Erneut anfordern
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Keine Dokumente gefunden</h3>
                        <p className="text-muted-foreground">
                          {docs.length === 0 ? 'Noch keine Dokumente angefordert.' : 'Keine Dokumente entsprechen den aktuellen Filtern.'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Reject Dialog */}
      {showRejectDialog && (
        <Dialog open={!!showRejectDialog} onOpenChange={() => setShowRejectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dokument ablehnen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Grund der Ablehnung *</label>
                <Textarea
                  placeholder="Bitte geben Sie den Grund für die Ablehnung an..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Zusätzliche Nachricht (optional)</label>
                <Textarea
                  placeholder="Weitere Hinweise für den Nachunternehmer..."
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(null)}>
                Abbrechen
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Ablehnen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}