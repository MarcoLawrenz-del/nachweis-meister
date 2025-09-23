import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  Search, 
  Filter,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Eye,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { RequirementWithDocument } from '@/hooks/useSubcontractorProfile';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/lib/ROUTES';
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import { setDocumentStatus, getContractor } from "@/services/contractors";
import { sendReminderMissingLegacy as sendReminderMissing, getEmailErrorMessage } from "@/services/email";
import { isExpired, isExpiring, computeValidUntil } from "@/utils/validity";
import { useContractorDocuments } from "@/hooks/useContractorDocuments";
import RequestDocumentsDialog from "@/components/RequestDocumentsDialog";
import { useToast } from "@/hooks/use-toast";
import { getContractorMeta, getDocs, setContractorMeta, markUploaded } from "@/services/contractorDocs.store";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { displayName, isCustomDoc } from "@/utils/customDocs";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { exportContractorBundle } from "@/utils/export";

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
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');
  const [validityDates, setValidityDates] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [collapsedRejections, setCollapsedRejections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Load docs from store
  const docs = useContractorDocuments(contractorId);
  
  // Load meta data
  const meta = getContractorMeta(contractorId);

  // Filter documents
  const filteredDocs = docs.filter(doc => {
    const docType = DOCUMENT_TYPES.find(t => t.id === doc.documentTypeId);
    const docName = displayName(doc.documentTypeId, docType?.label || '', doc.customName, doc.label);
    
    // Search filter
    const matchesSearch = docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentTypeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle validity date change
  const handleValidityDateChange = async (docTypeId: string, newDate: string) => {
    try {
      await setDocumentStatus({
        contractorId,
        documentTypeId: docTypeId,
        status: "accepted",
        validUntil: newDate
      });
      
      setValidityDates(prev => ({ ...prev, [docTypeId]: newDate }));
      
      toast({
        title: "Gültigkeitsdatum gespeichert",
        description: "Das Datum wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Das Datum konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const contractor = profile || getContractor(contractorId);
      const contractorName = contractor?.company_name || contractor?.companyName || 'Unbekannt';
      
      // Get documents with file data
      const documentsToExport = docs
        .filter(doc => doc.fileUrl && doc.status === 'accepted')
        .map(doc => {
          const docType = DOCUMENT_TYPES.find(t => t.id === doc.documentTypeId);
          const docName = displayName(doc.documentTypeId, docType?.label || '', doc.customName, doc.label);
          
          // Convert data URL to blob if available
          let blob: Blob | undefined;
          if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
            const byteString = atob(doc.fileUrl.split(',')[1]);
            const mimeString = doc.fileUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            blob = new Blob([ab], { type: mimeString });
          }
          
          return {
            name: `${docName}.${doc.fileType?.split('/')[1] || 'pdf'}`,
            blob
          };
        });

      await exportContractorBundle({
        contractorName,
        documents: documentsToExport
      });
      
      toast({
        title: "Export erfolgreich",
        description: `${documentsToExport.length} Dokumente exportiert.`,
      });
    } catch (error) {
      toast({
        title: "Export-Fehler",
        description: "Die Dokumente konnten nicht exportiert werden.",
        variant: "destructive"
      });
    }
  };
  const handleAccept = async (doc: any) => {
    const docType = DOCUMENT_TYPES.find(t => t.id === doc.documentTypeId);
    let validUntil = validityDates[doc.documentTypeId];
    
    // Auto-calculate validity if not set
    if (!validUntil && docType?.validity && docType.validity.kind !== "none") {
      const computed = computeValidUntil(docType.validity);
      validUntil = computed ? computed.toISOString().split('T')[0] : null;
    }
    
    await setDocumentStatus({
      contractorId,
      documentTypeId: doc.documentTypeId,
      status: "accepted",
      validUntil
    });
    
    const docName = displayName(doc.documentTypeId, docType?.label || '', doc.customName, doc.label);
    
    toast({
      title: "Dokument akzeptiert",
      description: `${docName} wurde erfolgreich akzeptiert.`,
    });
  };

  // Handle reject document
  const handleReject = async () => {
    if (!showRejectDialog) return;
    
    const rejectDocType = DOCUMENT_TYPES.find(t => t.id === showRejectDialog.documentTypeId);
    const rejectedDoc = getDocs(contractorId).find(d => d.documentTypeId === showRejectDialog.documentTypeId);
    const rejectDocName = displayName(showRejectDialog.documentTypeId, rejectDocType?.label || '', rejectedDoc?.customName, rejectedDoc?.label);
    
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
    
    toast({
      title: "Ablehnung gesendet",
      description: `Die Ablehnung für ${rejectDocName} wurde gesendet.`,
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
    
    // Get email from profile
    const contractorEmail = profile?.contact_email;
    
    // Find missing required docs for this contractor
    const allDocs = getDocs(contractorId);
    const missingDocs = allDocs
      .filter(d => d.requirement === 'required' && ['missing', 'rejected', 'expired'].includes(d.status))
      .map(d => {
        const docType = DOCUMENT_TYPES.find(t => t.id === d.documentTypeId);
        return displayName(d.documentTypeId, docType?.label || '', d.customName, d.label);
      });
    
    try {
      await sendReminderMissing({ 
        contractorId, 
        email: contractorEmail ?? "",
        missingDocs
      });
      
      toast({
        title: "Erinnerung versendet",
        description: `${missingDocs.length} Dokument(e) angefordert`
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Senden",
        description: getEmailErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = async () => {
    const contractor = getContractor(contractorId);
    const email = contractor?.email;
    
    if (!email) {
      toast({
        title: "Warnung",
        description: "Keine E-Mail hinterlegt – Erinnerung nicht gesendet.",
        variant: "default"
      });
      return;
    }

    // Get missing required documents
    const missingDocs = docs
      .filter(doc => doc.requirement === "required" && 
        ["missing", "rejected", "expired"].includes(doc.status))
      .map(doc => {
        const docType = DOCUMENT_TYPES.find(dt => dt.id === doc.documentTypeId);
        return displayName(doc.documentTypeId, docType?.label || doc.documentTypeId, doc.customName, doc.label);
      });

    if (missingDocs.length === 0) {
      toast({
        title: "Keine Erinnerung erforderlich",
        description: "Alle erforderlichen Dokumente sind vollständig.",
        variant: "default"
      });
      return;
    }

    try {
      const result = await sendReminderMissing({
        contractorId: contractorId,
        email: email,
        missingDocs: missingDocs,
        message: `Bitte reichen Sie die folgenden fehlenden Dokumente nach: ${missingDocs.join(', ')}`
      });
      
      // Update lastRequestedAt after successful send
      setContractorMeta(contractorId, { lastRequestedAt: new Date().toISOString() });
      
      toast({
        title: result.isStub ? "Im Demo-Modus gesendet (Stub)" : "Erinnerung versendet",
        description: `Erinnerung für ${missingDocs.length} Dokument(e) an ${email} gesendet.`,
        variant: "default"
      });
    } catch (error: any) {
      console.warn('Failed to send reminder:', error);
      toast({
        title: "Fehler beim Senden",
        description: getEmailErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  // Handle admin file upload
  const handleAdminFileUpload = async (doc: any, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        markUploaded({
          contractorId,
          type: doc.documentTypeId,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl
          },
          uploadedBy: 'admin',
          accept: false
        });
        
        const docType = DOCUMENT_TYPES.find(t => t.id === doc.documentTypeId);
        const docName = displayName(doc.documentTypeId, docType?.label || '', doc.customName, doc.label);
        
        toast({
          title: "Datei hochgeladen",
          description: `${docName} wurde hochgeladen und ist in Prüfung.`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload-Fehler",
        description: "Die Datei konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
    }
  };

  // Status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      missing: { 
        label: 'Fehlend', 
        variant: 'outline' as const, 
        icon: XCircle, 
        className: 'bg-warn-50 text-warn-600 border-warn-600/20' 
      },
      submitted: { 
        label: 'Eingereicht', 
        variant: 'outline' as const, 
        icon: Upload, 
        className: 'bg-info-50 text-info-600 border-info-600/20' 
      },
      in_review: { 
        label: 'In Prüfung', 
        variant: 'outline' as const, 
        icon: FileText, 
        className: 'bg-info-50 text-info-600 border-info-600/20' 
      },
      accepted: { 
        label: 'Angenommen', 
        variant: 'default' as const, 
        icon: CheckCircle, 
        className: 'bg-success-50 text-success-600 border-success-600/20' 
      },
      rejected: { 
        label: 'Abgelehnt', 
        variant: 'destructive' as const, 
        icon: XCircle, 
        className: 'bg-danger-50 text-danger-600 border-danger-600/20' 
      },
      expired: { 
        label: 'Abgelaufen', 
        variant: 'destructive' as const, 
        icon: AlertTriangle, 
        className: 'bg-danger-50 text-danger-600 border-danger-600/20' 
      }
    };
    
    return configs[status as keyof typeof configs] || configs.missing;
  };

  return (
    <TooltipProvider>
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
              onClick={handleSendReminder}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Dokumente anfordern
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
            <div className="flex items-center gap-2">
              {meta.lastRequestedAt && (
                <Badge variant="secondary" className="text-xs">
                  Zuletzt angefordert: {formatDistanceToNow(new Date(meta.lastRequestedAt), { 
                    addSuffix: true, 
                    locale: de 
                  })}
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendReminder}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Erneut anfordern
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
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
                const docName = displayName(doc.documentTypeId, docType?.label || '', doc.customName, doc.label);
                
                if (!docType && !doc.customName) return null;
                
                const statusConfig = getStatusConfig(doc.status);
                const StatusIcon = statusConfig.icon;
                
                // Check validity states
                const validUntilDate = doc.validUntil ? new Date(doc.validUntil) : null;
                const expired = doc.status === 'expired' || (validUntilDate && isExpired(validUntilDate));
                const expiring = validUntilDate && !expired && isExpiring(validUntilDate, 30);

                return (
                  <TableRow key={doc.documentTypeId}>
                     <TableCell>
                       <div>
                         <div 
                           className={`font-medium ${doc.fileUrl ? 'cursor-pointer hover:text-primary underline-offset-2 hover:underline' : ''}`}
                           onClick={() => doc.fileUrl && setPreviewDoc(doc)}
                         >
                           {docName}
                         </div>
                       </div>
                     </TableCell>
                    
                     <TableCell>
                       <Badge 
                         variant={doc.requirement === 'required' ? 'dutyRequired' : 'dutyOptional'}
                       >
                         {doc.requirement === 'required' ? 'Pflicht' : 'Optional'}
                       </Badge>
                     </TableCell>
                    
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <StatusIcon className="h-4 w-4" />
                          <Badge variant={statusConfig.variant} className={statusConfig.className}>
                            {doc.status === 'expired' ? 'Abgelaufen' : statusConfig.label}
                          </Badge>
                         {expiring && !expired && (
                           <Badge variant="outline" className="text-warn-600 border-warn-600/20">
                             Läuft ab
                           </Badge>
                         )}
                       </div>
                      {doc.rejectionReason && (
                        <Collapsible 
                          open={!collapsedRejections[doc.documentTypeId]} 
                          onOpenChange={(open) => setCollapsedRejections(prev => ({ ...prev, [doc.documentTypeId]: !open }))}
                        >
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-1 h-6 p-1 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                            >
                              {collapsedRejections[doc.documentTypeId] ? (
                                <ChevronRight className="h-3 w-3 mr-1" />
                              ) : (
                                <ChevronDown className="h-3 w-3 mr-1" />
                              )}
                              <span className="text-xs">
                                {collapsedRejections[doc.documentTypeId] 
                                  ? 'Ablehnungsgrund anzeigen' 
                                  : 'Ablehnungsgrund verbergen'
                                }
                              </span>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="text-sm text-danger-600 mt-1 p-2 bg-danger-50 rounded border border-danger-200">
                              {doc.rejectionReason}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {doc.status === "accepted" ? (
                        <Input
                          type="date"
                          value={validityDates[doc.documentTypeId] || (doc.validUntil ? doc.validUntil.split('T')[0] : '')}
                          onChange={(e) => setValidityDates(prev => ({ ...prev, [doc.documentTypeId]: e.target.value }))}
                          onBlur={(e) => {
                            if (e.target.value && e.target.value !== (doc.validUntil ? doc.validUntil.split('T')[0] : '')) {
                              handleValidityDateChange(doc.documentTypeId, e.target.value);
                            }
                          }}
                          className="w-40"
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              type="date"
                              value={validityDates[doc.documentTypeId] || (doc.validUntil ? doc.validUntil.split('T')[0] : '')}
                              onChange={(e) => setValidityDates(prev => ({ ...prev, [doc.documentTypeId]: e.target.value }))}
                              className="w-40 bg-muted cursor-not-allowed"
                              disabled
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Datum erst nach Annahme setzbar</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    
                     <TableCell>
                       <div className="flex gap-2">
                         {/* Document Preview - always available for uploaded documents */}
                         {doc.fileUrl && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setPreviewDoc(doc)}
                           >
                             <Eye className="w-4 h-4 mr-1" />
                             Dokument ansehen
                           </Button>
                         )}
                         
                         {/* Upload button for missing documents */}
                         {!doc.fileUrl && (
                           <div className="relative">
                             <input
                               type="file"
                               id={`upload-${doc.documentTypeId}`}
                               accept="application/pdf,image/*"
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   handleAdminFileUpload(doc, file);
                                   e.target.value = '';
                                 }
                               }}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                             <Button
                               variant="outline"
                               size="sm"
                               className="flex items-center gap-1"
                               onClick={() => document.getElementById(`upload-${doc.documentTypeId}`)?.click()}
                             >
                               <Upload className="h-3 w-3" />
                               Hochladen
                             </Button>
                           </div>
                         )}
                         
                         {/* Action buttons based on status */}
                         {(doc.status === 'submitted' || doc.status === 'in_review') && (
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
                               onClick={() => {
                                 const defaultReason = `Das eingereichte ${docName} entspricht nicht den Anforderungen. Bitte reichen Sie ein korrigiertes Dokument ein.`;
                                 setRejectReason(defaultReason);
                                 setRejectMessage('');
                                 setShowRejectDialog({ documentTypeId: doc.documentTypeId });
                               }}
                               className="flex items-center gap-1"
                             >
                               <XCircle className="h-3 w-3" />
                               Ablehnen
                             </Button>
                           </>
                         )}
                         
                         {/* Request again for missing/rejected/expired documents */}
                         {(doc.status === 'missing' || doc.status === 'rejected' || doc.status === 'expired') && (
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
      
      {/* Request Documents Dialog */}
      {showRequestDialog && (
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl">
            <RequestDocumentsDialog
              contractorId={contractorId}
              contractorEmail={profile?.contact_email}
              onClose={() => setShowRequestDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      
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
       
       {/* Document Preview Dialog */}
       <DocumentPreviewDialog
         open={!!previewDoc}
         onOpenChange={(open) => !open && setPreviewDoc(null)}
         doc={previewDoc}
       />
       </div>
     </TooltipProvider>
   );
 }