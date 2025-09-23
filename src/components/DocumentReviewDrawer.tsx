import { useState, useCallback, lazy, Suspense } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { ContractorDocument } from '@/types/contractor';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import { displayName } from '@/utils/customDocs';
import { upsertDoc, getDocs } from '@/services/contractorDocs.store';
import { getContractor } from '@/services/contractors';
import { sendEmail } from '@/services/email';
import { getNotificationSettings } from '@/services/notifications';
import { computeValidUntil } from '@/utils/validity';

interface DocumentReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: ContractorDocument | null;
  contractorId: string;
  onStatusChange?: () => void;
}

export function DocumentReviewDrawer({ 
  isOpen, 
  onClose, 
  document, 
  contractorId,
  onStatusChange 
}: DocumentReviewDrawerProps) {
  const { toast } = useToast();
  const [validityDate, setValidityDate] = useState('');
  const [isValidityUnknown, setIsValidityUnknown] = useState(false);
  const [neverExpires, setNeverExpires] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  if (!document || !isOpen) return null;

  const contractor = getContractor(contractorId);
  const docType = DOCUMENT_TYPES.find(t => t.id === document.documentTypeId);
  const docName = displayName(document.documentTypeId, docType?.label || '', document.customName, document.label);

  // Initialize form values
  useState(() => {
    if (document.validUntil) {
      setValidityDate(document.validUntil.split('T')[0]);
    }
    setIsValidityUnknown(document.validitySource === 'user' && !document.validUntil);
    setNeverExpires(document.validitySource === 'user' && document.userUnknownExpiry === true);
  });

  // Add history entry
  const addHistoryEntry = (action: string, by: string, meta?: any) => {
    const currentDocs = getDocs(contractorId);
    const docIndex = currentDocs.findIndex(d => d.documentTypeId === document.documentTypeId);
    
    if (docIndex >= 0) {
      const updatedDoc = { ...currentDocs[docIndex] };
      if (!updatedDoc.history) updatedDoc.history = [];
      
      updatedDoc.history.unshift({
        tsISO: new Date().toISOString(),
        action,
        by,
        meta
      });
      
      upsertDoc(contractorId, updatedDoc);
    }
  };

  // Handle validity change
  const handleValidityChange = () => {
    let newValidUntil: string | null = null;
    let newValiditySource: "user" | "auto" | "admin" = "admin";
    
    if (!neverExpires && !isValidityUnknown && validityDate) {
      newValidUntil = validityDate;
    }
    
    const updatedDoc: ContractorDocument = {
      ...document,
      validUntil: newValidUntil,
      validitySource: newValiditySource,
      userUnknownExpiry: neverExpires
    };
    
    upsertDoc(contractorId, updatedDoc);
    addHistoryEntry('validity_changed', 'admin', { 
      validUntil: newValidUntil, 
      validitySource: newValiditySource 
    });
    
    console.info('[analytics] review', { 
      action: 'validity_changed', 
      contractorId, 
      docType: document.documentTypeId, 
      by: 'admin' 
    });
    
    toast({
      title: "Gültigkeit aktualisiert",
      description: "Die Gültigkeitseinstellungen wurden gespeichert."
    });
    
    onStatusChange?.();
  };

  // Handle accept
  const handleAccept = async () => {
    let finalValidUntil = validityDate;
    
    // Auto-calculate validity if not set and document type has default validity
    if (!finalValidUntil && !neverExpires && !isValidityUnknown && docType?.validity) {
      const computed = computeValidUntil(docType.validity);
      if (computed) {
        finalValidUntil = computed.toISOString().split('T')[0];
      }
    }
    
    const updatedDoc: ContractorDocument = {
      ...document,
      status: 'accepted',
      validUntil: neverExpires || isValidityUnknown ? null : finalValidUntil,
      validitySource: 'admin',
      userUnknownExpiry: neverExpires,
      review: {
        status: 'accepted',
        reviewedAtISO: new Date().toISOString(),
        reviewedBy: 'admin'
      }
    };
    
    upsertDoc(contractorId, updatedDoc);
    addHistoryEntry('accepted', 'admin', { validUntil: finalValidUntil });
    
    // Send email if settings allow
    try {
      const settings = getNotificationSettings();
      if (settings.emailNotifications && contractor?.active) {
        await sendEmail('doc_accepted', {
          to: contractor.contact_email || contractor.email,
          contractorName: contractor.company_name || contractor.companyName,
          documentName: docName,
          contractorId
        });
      }
    } catch (error) {
      console.warn('Failed to send acceptance email:', error);
    }
    
    console.info('[analytics] review', { 
      action: 'accepted', 
      contractorId, 
      docType: document.documentTypeId, 
      by: 'admin' 
    });
    
    toast({
      title: "Dokument angenommen",
      description: `${docName} wurde erfolgreich angenommen.`
    });
    
    onStatusChange?.();
    onClose();
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) {
      toast({
        title: "Grund erforderlich",
        description: "Bitte geben Sie einen Grund für die Ablehnung an (mindestens 10 Zeichen).",
        variant: "destructive"
      });
      return;
    }
    
    const updatedDoc: ContractorDocument = {
      ...document,
      status: 'rejected',
      rejectionReason: rejectReason,
      review: {
        status: 'rejected',
        reviewedAtISO: new Date().toISOString(),
        reviewedBy: 'admin',
        reason: rejectReason
      }
    };
    
    upsertDoc(contractorId, updatedDoc);
    addHistoryEntry('rejected', 'admin', { reason: rejectReason });
    
    // Send email if settings allow
    try {
      const settings = getNotificationSettings();
      if (settings.emailNotifications && contractor?.active) {
        await sendEmail('doc_rejected', {
          to: contractor.contact_email || contractor.email,
          contractorName: contractor.company_name || contractor.companyName,
          documentName: docName,
          rejectionReason: rejectReason,
          contractorId
        });
      } else if (!contractor?.active) {
        toast({
          title: "Nachunternehmer ist inaktiv – Versand übersprungen",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.warn('Failed to send rejection email:', error);
    }
    
    console.info('[analytics] review', { 
      action: 'rejected', 
      contractorId, 
      docType: document.documentTypeId, 
      by: 'admin' 
    });
    
    toast({
      title: "Dokument abgelehnt",
      description: `${docName} wurde abgelehnt.`
    });
    
    setShowRejectDialog(false);
    setRejectReason('');
    onStatusChange?.();
    onClose();
  };

  // Handle file replacement
  const handleFileReplace = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      const updatedDoc: ContractorDocument = {
        ...document,
        status: 'submitted',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: dataUrl,
        uploadedBy: 'admin',
        uploadedAt: new Date().toISOString(),
        file: {
          url: dataUrl,
          name: file.name,
          size: file.size,
          mime: file.type,
          uploadedAtISO: new Date().toISOString(),
          uploadedBy: 'admin',
          source: 'admin'
        }
      };
      
      upsertDoc(contractorId, updatedDoc);
      addHistoryEntry('replaced', 'admin', { fileName: file.name, fileSize: file.size });
      
      console.info('[analytics] review', { 
        action: 'replaced', 
        contractorId, 
        docType: document.documentTypeId, 
        by: 'admin' 
      });
      
      toast({
        title: "Datei ersetzt",
        description: `${docName} wurde ersetzt und ist in Prüfung.`
      });
      
      onStatusChange?.();
    };
    
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
  };

  const handleDownload = () => {
    if (document.fileUrl) {
      const link = document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName || `${docName}.pdf`;
      link.click();
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      submitted: { label: 'Eingereicht', className: 'bg-info-50 text-info-600 border-info-600/20' },
      accepted: { label: 'Angenommen', className: 'bg-success-50 text-success-600 border-success-600/20' },
      rejected: { label: 'Abgelehnt', className: 'bg-danger-50 text-danger-600 border-danger-600/20' },
      expired: { label: 'Abgelaufen', className: 'bg-danger-50 text-danger-600 border-danger-600/20' },
      missing: { label: 'Fehlend', className: 'bg-warn-50 text-warn-600 border-warn-600/20' }
    };
    return configs[status as keyof typeof configs] || configs.missing;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isInactiveContractor = !contractor?.active;
  const statusConfig = getStatusConfig(document.status);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-4xl sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{docName}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {contractor?.company_name || contractor?.companyName}
                </span>
                <Badge 
                  variant="outline" 
                  className={isInactiveContractor ? 'bg-muted text-muted-foreground' : statusConfig.className}
                >
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Document Viewer */}
          {document.fileUrl && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Dokument-Vorschau</CardTitle>
                  {document.fileType?.startsWith('image/') && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(scale * 100)}%
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setScale(prev => Math.min(prev + 0.25, 3))}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRotation(prev => (prev + 90) % 360)}>
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {document.fileType?.startsWith('application/pdf') ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      PDF-Vorschau verfügbar nach Installation von react-pdf
                    </p>
                    <Button variant="outline" onClick={handleDownload}>
                      PDF herunterladen
                    </Button>
                  </div>
                ) : document.fileType?.startsWith('image/') ? (
                  <div className="flex justify-center">
                    <img 
                      src={document.fileUrl} 
                      alt={docName}
                      className="max-w-full max-h-96 object-contain border rounded-lg"
                      style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Vorschau für {document.fileType} nicht verfügbar
                    </p>
                    <Button variant="outline" onClick={handleDownload} className="mt-4">
                      Datei herunterladen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Hochgeladen am</p>
                    <p className="text-muted-foreground">
                      {formatDateTime(document.uploadedAt || document.file?.uploadedAtISO)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Quelle</p>
                    <p className="text-muted-foreground">
                      {document.uploadedBy === 'admin' || document.file?.source === 'admin' ? 'Admin' : 'Öffentlich'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Dateigröße</p>
                    <p className="text-muted-foreground">
                      {formatFileSize(document.fileSize || document.file?.size)}
                    </p>
                  </div>
                </div>
                {document.file?.pages && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Seiten</p>
                      <p className="text-muted-foreground">{document.file.pages}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validity Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gültigkeit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="never-expires" 
                    checked={neverExpires}
                    onCheckedChange={setNeverExpires}
                  />
                  <Label htmlFor="never-expires">Läuft nicht ab</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="validity-unknown" 
                    checked={isValidityUnknown}
                    onCheckedChange={setIsValidityUnknown}
                  />
                  <Label htmlFor="validity-unknown">Gültigkeit unbekannt</Label>
                </div>
                
                {!neverExpires && !isValidityUnknown && (
                  <div className="space-y-2">
                    <Label htmlFor="validity-date">Gültig bis</Label>
                    <Input
                      id="validity-date"
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <Button onClick={handleValidityChange} variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Gültigkeit speichern
              </Button>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          {document.history && document.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {document.history.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          von {entry.by} • {formatDateTime(entry.tsISO)}
                        </p>
                        {entry.meta && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(entry.meta)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="destructive" 
              onClick={() => setShowRejectDialog(true)}
              disabled={isInactiveContractor}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Ablehnen
            </Button>
            
            <Button 
              onClick={handleAccept}
              disabled={isInactiveContractor}
              className="bg-success-600 hover:bg-success-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Annehmen
            </Button>
            
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Ersetzen
                </span>
              </Button>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileReplace}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>
        </div>

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Dokument ablehnen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reject-reason">Grund (Pflichtfeld)</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Bitte geben Sie einen detaillierten Grund für die Ablehnung an..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mindestens 10 Zeichen erforderlich
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectReason('');
                    }}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject}
                    disabled={rejectReason.length < 10}
                    className="flex-1"
                  >
                    Ablehnen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}