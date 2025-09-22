import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { resolveMagicLink } from "@/services/magicLinks";
import { getContractor } from "@/services/contractors";
import { getDocs, markUploaded } from "@/services/contractorDocs.store";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Camera, 
  FileCheck, 
  AlertTriangle, 
  Eye, 
  X, 
  CheckCircle,
  Clock,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { Logo } from "@/components/Brand/Logo";
import { TokenError } from "./TokenError";

interface DocumentUpload {
  id: string;
  label: string;
  requirement: "required" | "optional";
  file: File | null;
  validUntil: string;
  status: "missing" | "submitted" | "accepted" | "rejected";
  rejectionReason?: string;
  fileUrl?: string;
  fileName?: string;
}

export default function PublicMagicUpload() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'expired' | null>(null);
  const [contractorId, setContractorId] = useState<string>("");
  const [contractorName, setContractorName] = useState<string>("");
  const [contractorEmail, setContractorEmail] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const { toast } = useToast();
  
  // File input refs for camera/file selection
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    async function loadMagicLink() {
      if (!token) {
        setError('not_found');
        setLoading(false);
        return;
      }

      try {
        const linkResult = await resolveMagicLink(token);
        
        if (linkResult.success === false) {
          setError(linkResult.error);
          setLoading(false);
          return;
        }

        const contractor = getContractor(linkResult.contractorId);
        if (!contractor) {
          setError('not_found');
          setLoading(false);
          return;
        }

        setContractorId(linkResult.contractorId);
        setContractorName(contractor.company_name);
        setContractorEmail(linkResult.email);

        // Load contractor documents and build upload form
        const existingDocs = getDocs(linkResult.contractorId);
        
        const relevantDocuments = DOCUMENT_TYPES
          .map(dt => {
            const existingDoc = existingDocs.find(d => d.documentTypeId === dt.id);
            const requirement = existingDoc?.requirement || dt.defaultRequirement;
            
            // Only include required and optional documents
            if (requirement === "hidden") return null;
            
            return {
              id: dt.id,
              label: dt.label,
              requirement: requirement as "required" | "optional",
              file: null,
              validUntil: existingDoc?.validUntil || "",
              status: existingDoc?.status || "missing",
              rejectionReason: existingDoc?.rejectionReason,
              fileUrl: existingDoc?.fileUrl,
              fileName: existingDoc?.fileName
            };
          })
          .filter(doc => doc !== null)
          .sort((a, b) => {
            // Required first, then optional
            if (a.requirement === "required" && b.requirement === "optional") return -1;
            if (a.requirement === "optional" && b.requirement === "required") return 1;
            return 0;
          });

        setDocuments(relevantDocuments);
        setLoading(false);

        // Analytics event
        console.info("[analytics] upload_opened", { 
          contractorId: linkResult.contractorId,
          requiredCount: relevantDocuments.filter(d => d.requirement === "required").length,
          submittedCount: relevantDocuments.filter(d => d.status === "submitted").length
        });

      } catch (error) {
        console.error("Failed to load magic link:", error);
        setError('not_found');
        setLoading(false);
      }
    }

    loadMagicLink();
  }, [token]);

  const handleFileSelect = (documentId: string, file: File | null, captureType: 'camera' | 'file') => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Nur PDF, JPG und PNG Dateien sind erlaubt.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf maximal 15MB groß sein.",
        variant: "destructive"
      });
      return;
    }

    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, file, status: "missing" } : doc
    ));

    // Analytics event
    console.info(`[analytics] ${captureType === 'camera' ? 'camera_capture' : 'file_selected'}`, {
      documentId,
      fileSize: file.size,
      fileType: file.type
    });
  };

  const handleValidUntilChange = (documentId: string, validUntil: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, validUntil } : doc
    ));
  };

  const handleRemoveFile = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, file: null } : doc
    ));
    
    // Clear file input
    if (fileInputRefs.current[documentId]) {
      fileInputRefs.current[documentId]!.value = '';
    }
  };

  const handlePreview = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;

    if (doc.file) {
      // Preview selected file
      const reader = new FileReader();
      reader.onload = () => {
        const previewData = {
          fileName: doc.file!.name,
          fileType: doc.file!.type,
          fileSize: doc.file!.size,
          fileUrl: reader.result as string
        };
        setPreviewDoc(previewData);
      };
      reader.readAsDataURL(doc.file);
    } else if (doc.fileUrl) {
      // Preview existing uploaded file
      const previewData = {
        fileName: doc.fileName || "Dokument",
        fileType: doc.fileUrl.includes('pdf') ? 'application/pdf' : 'image/jpeg',
        fileUrl: doc.fileUrl
      };
      setPreviewDoc(previewData);
    }

    console.info("[analytics] preview_opened", { documentId });
  };

  const handleSubmit = async () => {
    if (!contractorId) return;

    setIsSubmitting(true);

    try {
      const uploadsToProcess = documents.filter(doc => doc.file);
      
      if (uploadsToProcess.length === 0) {
        toast({
          title: "Keine neuen Dokumente",
          description: "Es wurden keine neuen Dateien zum Hochladen ausgewählt.",
          variant: "default"
        });
        setIsSubmitting(false);
        return;
      }

      // Process each upload
      for (const doc of uploadsToProcess) {
        if (doc.file) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(doc.file!);
          });
          
          markUploaded({
            contractorId,
            type: doc.id,
            file: {
              name: doc.file.name,
              type: doc.file.type,
              size: doc.file.size,
              dataUrl
            },
            uploadedBy: 'contractor',
            accept: false,
            validUntil: doc.validUntil || null
          });
        }
      }

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.file ? { 
          ...doc, 
          status: "submitted", 
          fileName: doc.file!.name,
          fileUrl: URL.createObjectURL(doc.file!),
          file: null // Clear file after upload
        } : doc
      ));

      // Clear file inputs
      Object.values(fileInputRefs.current).forEach(input => {
        if (input) input.value = '';
      });

      toast({
        title: "Uploads gespeichert",
        description: `${uploadsToProcess.length} Dokument(e) wurden erfolgreich hochgeladen und werden geprüft.`,
      });

      // Analytics event
      console.info("[analytics] upload_saved", {
        contractorId,
        documentsCount: uploadsToProcess.length
      });

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Fehler beim Speichern",
        description: "Die Dokumente konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, rejectionReason?: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gültig
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Hochgeladen
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Abgelehnt
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Upload className="h-3 w-3 mr-1" />
            Fehlend
          </Badge>
        );
    }
  };

  // Calculate progress
  const requiredDocs = documents.filter(d => d.requirement === "required");
  const uploadedRequired = requiredDocs.filter(d => d.status === "submitted" || d.status === "accepted").length;
  const progress = requiredDocs.length > 0 ? Math.round((uploadedRequired / requiredDocs.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Link wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <TokenError error={error} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <div>
                <h1 className="text-lg font-semibold">Upload für {contractorName}</h1>
                <p className="text-sm text-muted-foreground">Bitte laden Sie die folgenden Unterlagen hoch.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{uploadedRequired}/{requiredDocs.length} Pflichtdokumente</div>
              <Progress value={progress} className="w-24 h-2 mt-1" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {/* Document List */}
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{doc.label}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={doc.requirement === "required" ? "default" : "secondary"} className="text-xs">
                        {doc.requirement === "required" ? "Erforderlich" : "Optional"}
                      </Badge>
                      {getStatusBadge(doc.status, doc.rejectionReason)}
                    </div>
                  </div>
                </div>
                
                {/* Rejection Reason */}
                {doc.status === "rejected" && doc.rejectionReason && (
                  <Alert className="mt-3 border-destructive/50 bg-destructive/5">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Grund der Ablehnung:</strong> {doc.rejectionReason}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* File Selection */}
                {(doc.status === "missing" || doc.status === "rejected") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Camera Button (Mobile) */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileSelect(doc.id, file, 'camera');
                        };
                        input.click();
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Foto aufnehmen
                    </Button>

                    {/* File Button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Datei auswählen
                    </Button>

                    {/* Hidden file input */}
                    <input
                      ref={(el) => fileInputRefs.current[doc.id] = el}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(doc.id, file, 'file');
                      }}
                    />
                  </div>
                )}

                {/* Selected File Display */}
                {doc.file && (
                  <div className="p-3 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">{doc.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(doc.file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(doc.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(doc.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing File Display */}
                {!doc.file && (doc.status === "submitted" || doc.status === "accepted") && doc.fileName && (
                  <div className="p-3 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{doc.fileName}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handlePreview(doc.id)}>
                        <Eye className="h-4 w-4" />
                        Ansehen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Validity Date */}
                {(doc.file || doc.status === "rejected") && (
                  <div className="space-y-2">
                    <Label htmlFor={`valid-${doc.id}`} className="text-sm">Gültig bis (optional)</Label>
                    <Input
                      id={`valid-${doc.id}`}
                      type="date"
                      value={doc.validUntil}
                      onChange={(e) => handleValidUntilChange(doc.id, e.target.value)}
                      className="w-full sm:w-auto"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Alert className="mt-6 border-primary/20 bg-primary/5">
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Sie können den Link jederzeit erneut öffnen und später fortfahren. 
            Ihre Uploads werden automatisch gespeichert.
          </AlertDescription>
        </Alert>

        {/* Document Preview Dialog */}
        <DocumentPreviewDialog 
          open={!!previewDoc} 
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          doc={previewDoc}
        />
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !documents.some(doc => doc.file)}
              className="flex-1 sm:order-2"
            >
              {isSubmitting ? "Wird gespeichert..." : "Uploads speichern"}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 sm:order-1"
              onClick={() => toast({ 
                title: "Später fortfahren", 
                description: "Sie können den Link jederzeit erneut öffnen." 
              })}
            >
              Später fortfahren
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
