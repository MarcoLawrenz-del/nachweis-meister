import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { resolveUploadToken } from "@/services/uploadLinks";
import { listContractors } from "@/services/contractors.store";
import { getDocs, markUploaded } from "@/services/contractorDocs.store";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Building2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { Logo } from "@/components/Brand/Logo";
import { TokenError } from "./TokenError";
import { UploadDocCard } from "@/components/public/UploadDocCard";
import { StickyUploadFooter } from "@/components/public/StickyUploadFooter";
import { cn } from "@/lib/utils";

interface DocumentUpload {
  id: string;
  label: string;
  requirement: "required" | "optional";
  file: File | null;
  validUntil: string;
  status: "missing" | "submitted" | "in_review" | "accepted" | "rejected" | "expired";
  rejectionReason?: string;
  fileUrl?: string;
  fileName?: string;
  userUnknownExpiry?: boolean;
}

export default function PublicMagicUpload() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'expired' | null>(null);
  const [contractorId, setContractorId] = useState<string>("");
  const [contractorName, setContractorName] = useState<string>("");
  const [contractorEmail, setContractorEmail] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("Bürogebäude Hauptstraße 42");
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [optionalExpanded, setOptionalExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadMagicLink() {
      console.log('[PublicMagicUpload] Starting to load token:', token);
      console.log('[PublicMagicUpload] Current URL:', window.location.href);
      console.log('[PublicMagicUpload] Current localStorage keys:', Object.keys(localStorage));
      
      if (!token) {
        console.log('[PublicMagicUpload] No token provided');
        setError('not_found');
        setLoading(false);
        return;
      }

      try {
        console.log('[PublicMagicUpload] About to resolve token:', token);
        const linkResult = resolveUploadToken(token);
        console.log('[PublicMagicUpload] Token resolution result:', linkResult);
        
        if (!linkResult) {
          console.log('[PublicMagicUpload] Token not found or expired');
          setError('not_found');
          setLoading(false);
          return;
        }

        const contractors = listContractors();
        console.log('[PublicMagicUpload] Available contractors:', contractors.length);
        const contractor = contractors.find(c => c.id === linkResult.contractorId);
        if (!contractor) {
          console.log('[PublicMagicUpload] Contractor not found:', linkResult.contractorId);
          setError('not_found');
          setLoading(false);
          return;
        }

        console.log('[PublicMagicUpload] Found contractor:', contractor.company_name);
        setContractorId(linkResult.contractorId);
        setContractorName(contractor.company_name);
        setContractorEmail(contractor.email);

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
              fileName: existingDoc?.fileName,
              userUnknownExpiry: false
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

  const handleFileSelect = (documentId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Bitte PDF/JPG/PNG bis 15 MB verwenden.",
        description: "Der gewählte Dateityp wird nicht unterstützt.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "Bitte PDF/JPG/PNG bis 15 MB verwenden.",
        description: "Die Datei ist zu groß.",
        variant: "destructive"
      });
      return;
    }

    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, file, status: "missing" } : doc
    ));

    // Analytics event
    console.info("[analytics] file_selected", {
      documentId,
      fileSize: file.size,
      fileType: file.type
    });
  };

  const handleCameraCapture = (documentId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(documentId, file);
        console.info("[analytics] camera_capture", { documentId });
      }
    };
    input.click();
  };

  const handleValidUntilChange = (documentId: string, validUntil: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, validUntil, userUnknownExpiry: false } : doc
    ));
  };

  const handleUnknownExpiryChange = (documentId: string, unknown: boolean) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { 
        ...doc, 
        userUnknownExpiry: unknown,
        validUntil: unknown ? "" : doc.validUntil
      } : doc
    ));
  };

  const handleRemoveFile = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, file: null } : doc
    ));
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
            validUntil: doc.userUnknownExpiry ? null : (doc.validUntil || null)
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

      toast({
        title: "Gespeichert",
        description: "Wir prüfen Ihre Unterlagen.",
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
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress
  const requiredDocs = documents.filter(d => d.requirement === "required");
  const optionalDocs = documents.filter(d => d.requirement === "optional");
  const uploadedRequired = requiredDocs.filter(d => d.status === "submitted" || d.status === "accepted").length;
  const uploadedOptional = optionalDocs.filter(d => d.status === "submitted" || d.status === "accepted").length;
  const progress = requiredDocs.length > 0 ? Math.round((uploadedRequired / requiredDocs.length) * 100) : 0;
  const hasNewFiles = documents.some(d => d.file);

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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-auto" />
              <Badge variant="outline" className="text-xs ml-2">
                Demo-Modus
              </Badge>
            </div>
          </div>
          
          {/* Title Section */}
          <div className="mt-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">Dokumente hochladen</h1>
                <p className="text-muted-foreground text-sm">
                  für <span className="font-medium">{contractorName}</span> – {projectName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Shield className="h-3 w-3" />
                  <span>Ihre Daten sind sicher (SSL). Sie können den Link jederzeit erneut öffnen.</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-background/80 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="destructive" className="text-xs">
                    Pflicht: {uploadedRequired}/{requiredDocs.length} erledigt
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Optional: {uploadedOptional} hochgeladen
                  </Badge>
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {/* Required Documents */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-red-700">Erforderliche Dokumente</h2>
          <div className="space-y-4">
            {requiredDocs.map((doc) => (
              <UploadDocCard
                key={doc.id}
                doc={doc}
                onPickFile={(file) => handleFileSelect(doc.id, file)}
                onOpenCamera={() => handleCameraCapture(doc.id)}
                onRemove={() => handleRemoveFile(doc.id)}
                onPreview={() => handlePreview(doc.id)}
                onValidUntilChange={(validUntil) => handleValidUntilChange(doc.id, validUntil)}
                onUnknownExpiryChange={(unknown) => handleUnknownExpiryChange(doc.id, unknown)}
              />
            ))}
          </div>
        </div>

        {/* Optional Documents */}
        {optionalDocs.length > 0 && (
          <Collapsible open={optionalExpanded} onOpenChange={setOptionalExpanded}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-600 hover:text-slate-800 transition-colors w-full text-left">
                <ChevronDown className={cn("h-4 w-4 transition-transform", optionalExpanded && "rotate-180")} />
                Optionale Dokumente ({uploadedOptional} hochgeladen)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              {optionalDocs.map((doc) => (
                <UploadDocCard
                  key={doc.id}
                  doc={doc}
                  onPickFile={(file) => handleFileSelect(doc.id, file)}
                  onOpenCamera={() => handleCameraCapture(doc.id)}
                  onRemove={() => handleRemoveFile(doc.id)}
                  onPreview={() => handlePreview(doc.id)}
                  onValidUntilChange={(validUntil) => handleValidUntilChange(doc.id, validUntil)}
                  onUnknownExpiryChange={(unknown) => handleUnknownExpiryChange(doc.id, unknown)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </main>

      {/* Document Preview Dialog */}
      <DocumentPreviewDialog 
        open={!!previewDoc} 
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        doc={previewDoc}
      />

      {/* Sticky Footer */}
      <StickyUploadFooter 
        isSubmitting={isSubmitting}
        hasNewFiles={hasNewFiles}
        onSave={handleSubmit}
      />
    </div>
  );
}