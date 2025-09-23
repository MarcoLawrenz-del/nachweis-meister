import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveMagicLink } from "@/services/magicLinks";
import { getSupabaseContractor } from "@/services/supabaseContractors";
import { getDocs, markUploaded } from "@/services/contractorDocs.store";
import { createContractor } from "@/services/contractors.store";
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
        const linkResult = await resolveMagicLink(token);
        console.log('[PublicMagicUpload] Token resolution result:', linkResult);
        
        console.log('[PublicMagicUpload] SUCCESS - Magic link resolved!', {
          contractorId: linkResult.contractorId,
          email: linkResult.email
        });

        // Check if contractor exists in Supabase first
        console.log('[PublicMagicUpload] Fetching contractor from Supabase:', linkResult.contractorId);
        let contractor = await getSupabaseContractor(linkResult.contractorId);
        
        if (!contractor) {
          console.log('[PublicMagicUpload] Contractor not found in Supabase, trying localStorage fallback');
          // Import localStorage contractors dynamically to avoid SSR issues
          const { listContractors } = await import("@/services/contractors.store");
          const localContractors = listContractors();
          const localContractor = localContractors.find(c => c.id === linkResult.contractorId);
          
          if (localContractor) {
            console.log('[PublicMagicUpload] Found contractor in localStorage:', localContractor.company_name);
            contractor = {
              id: localContractor.id,
              company_name: localContractor.company_name,
              contact_name: localContractor.contact_name,
              contact_email: localContractor.email,
              phone: localContractor.phone,
              country_code: localContractor.country || 'DE',
              address: localContractor.address,
              notes: localContractor.notes,
              status: localContractor.active ? 'active' : 'inactive',
              compliance_status: 'compliant',
              company_type: 'baubetrieb',
              tenant_id: 'demo',
              created_at: localContractor.created_at,
              updated_at: localContractor.created_at
            };
          } else {
            console.log('[PublicMagicUpload] Contractor not found in localStorage either, creating from magic link email');
            // Create a minimal contractor from the magic link data
            contractor = {
              id: linkResult.contractorId,
              company_name: `Unternehmen (${linkResult.email})`,
              contact_name: undefined,
              contact_email: linkResult.email,
              phone: undefined,
              country_code: 'DE',
              address: undefined,
              notes: undefined,
              status: 'active',
              compliance_status: 'non_compliant',
              company_type: 'baubetrieb',
              tenant_id: 'demo',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        }

        console.log('[PublicMagicUpload] Found contractor:', contractor.company_name);
        
        // Create a temporary entry in localStorage for the document system to work
        const localContractor = {
          id: contractor.id,
          company_name: contractor.company_name,
          contact_name: contractor.contact_name,
          email: contractor.contact_email,
          phone: contractor.phone,
          country: contractor.country_code,
          address: contractor.address,
          notes: contractor.notes,
          created_at: contractor.created_at,
          active: contractor.status === 'active'
        };
        
        try {
          createContractor(localContractor);
          console.log('[PublicMagicUpload] Created temporary localStorage entry for contractor');
        } catch (error) {
          console.log('[PublicMagicUpload] Contractor already exists in localStorage or error creating:', error);
        }
        
        setContractorId(linkResult.contractorId);
        setContractorName(contractor.company_name);
        setContractorEmail(contractor.contact_email);

        // Load contractor documents from Supabase requirements or fallback to localStorage
        console.log('[PublicMagicUpload] Loading requirements for contractor:', linkResult.contractorId);
        
        let relevantDocuments: DocumentUpload[] = [];
        let isDemo = false;
        
        try {
          // First, check if contractor exists in Supabase
          const { data: supabaseContractor } = await supabase
            .from('subcontractors')
            .select('id, tenant_id')
            .eq('id', linkResult.contractorId)
            .single();

          console.log('[PublicMagicUpload] Supabase contractor check result:', supabaseContractor);

          if (supabaseContractor && supabaseContractor.tenant_id !== 'demo') {
            // Real Supabase contractor - get requirements from Supabase
            console.log('[PublicMagicUpload] Loading requirements from Supabase for real contractor');
            
            const { data: requirements, error } = await supabase
              .from('requirements')
              .select(`
                id,
                status,
                due_date,
                document_type_id,
                project_sub_id,
                project_subs!inner (
                  subcontractor_id
                ),
                document_types!inner (
                  id,
                  name_de,
                  code,
                  required_by_default
                ),
                documents (
                  id,
                  file_name,
                  file_url,
                  valid_to,
                  uploaded_at
                )
              `)
              .eq('project_subs.subcontractor_id', linkResult.contractorId);

            console.log('[PublicMagicUpload] Supabase requirements query result:', { requirements, error });

            if (error) {
              console.error('[PublicMagicUpload] Error loading Supabase requirements:', error);
              throw error;
            }

            if (requirements && requirements.length > 0) {
              console.log('[PublicMagicUpload] Found Supabase requirements:', requirements);
              
              relevantDocuments = requirements.map((req: any) => ({
                id: req.document_types.code,
                label: req.document_types.name_de,
                requirement: (req.document_types.required_by_default ? "required" : "optional") as "required" | "optional",
                file: null,
                validUntil: req.documents?.[0]?.valid_to || "",
                status: req.status === "valid" ? "accepted" : req.status as "missing" | "submitted" | "in_review" | "accepted" | "rejected" | "expired",
                rejectionReason: null,
                fileUrl: req.documents?.[0]?.file_url || undefined,
                fileName: req.documents?.[0]?.file_name || undefined,
                userUnknownExpiry: false
              })).sort((a, b) => {
                if (a.requirement === "required" && b.requirement === "optional") return -1;
                if (a.requirement === "optional" && b.requirement === "required") return 1;
                return 0;
              });
              
              console.log('[PublicMagicUpload] Processed Supabase requirements:', relevantDocuments);
            } else {
              console.log('[PublicMagicUpload] No requirements found in Supabase');
            }
          } else {
            // Demo contractor or not found in Supabase
            isDemo = true;
            console.log('[PublicMagicUpload] Demo contractor detected, using localStorage requirements');
          }
        } catch (error) {
          console.error('[PublicMagicUpload] Error checking Supabase contractor, assuming demo:', error);
          isDemo = true;
        }

        // Fallback to localStorage for demo contractors
        if (isDemo || relevantDocuments.length === 0) {
          console.log('[PublicMagicUpload] Using localStorage fallback for demo contractor');
          const existingDocs = getDocs(linkResult.contractorId);
          console.log('[PublicMagicUpload] Existing localStorage docs:', existingDocs);
          
          relevantDocuments = DOCUMENT_TYPES
            .map(dt => {
              const existingDoc = existingDocs.find(d => d.documentTypeId === dt.id);
              const requirement = existingDoc?.requirement || dt.defaultRequirement;
              
              console.log('[PublicMagicUpload] Processing document type:', {
                id: dt.id,
                label: dt.label,
                defaultRequirement: dt.defaultRequirement,
                existingDoc: existingDoc?.requirement,
                finalRequirement: requirement
              });
              
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
            
          console.log('[PublicMagicUpload] Final localStorage requirements:', relevantDocuments);
        }

        console.log('[PublicMagicUpload] FINAL requirements to display:', relevantDocuments);
        setDocuments(relevantDocuments);
        setLoading(false);

        // Analytics event
        console.info("[analytics] upload_opened", { 
          contractorId: linkResult.contractorId,
          requiredCount: relevantDocuments.filter(d => d.requirement === "required").length,
          submittedCount: relevantDocuments.filter(d => d.status === "submitted").length
        });

      } catch (error: any) {
        console.error("Failed to load magic link:", error);
        // Determine error type from error message
        if (error.message === 'Token expired') {
          setError('expired');
        } else {
          setError('not_found');
        }
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