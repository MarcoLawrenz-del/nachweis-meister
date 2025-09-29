import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import { getDocs, markUploaded } from "@/services/contractorDocs.store";
import { setDocumentStatus } from "@/services/contractors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileCheck, AlertTriangle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";

interface DocumentUpload {
  id: string;
  label: string;
  requirement: "required" | "optional";
  file: File | null;
  validUntil: string;
  uploaded: boolean;
}

export default function PublicUploadDemo() {
  const [searchParams] = useSearchParams();
  const contractorId = searchParams.get("cid");
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!contractorId) return;

    // Get existing contractor documents to determine requirements and upload status
    const existingDocs = getDocs(contractorId);
    
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
          validUntil: "",
          uploaded: existingDoc?.status === 'submitted' || existingDoc?.status === 'accepted' || existingDoc?.status === 'in_review'
        };
      })
      .filter((doc): doc is DocumentUpload => doc !== null);

    setDocuments(relevantDocuments);
  }, [contractorId]);

  const handleFileChange = (documentId: string, file: File | null) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, file } : doc
    ));
  };

  const handleValidUntilChange = (documentId: string, validUntil: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, validUntil } : doc
    ));
  };

  const handleSubmit = async () => {
    if (!contractorId) {
      toast({
        title: "Fehler",
        description: "Keine Contractor-ID gefunden",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadsToProcess = documents.filter(doc => doc.file && !doc.uploaded);
      
      if (uploadsToProcess.length === 0) {
        toast({
          title: "Keine Dokumente ausgewählt",
          description: "Bitte wählen Sie mindestens ein Dokument zum Hochladen aus.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      for (const doc of uploadsToProcess) {
        if (doc.file) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(doc.file!);
          });
          
          markUploaded(contractorId, doc.id);
        }
      }

      // Mark documents as uploaded
      setDocuments(prev => prev.map(doc => 
        doc.file ? { ...doc, uploaded: true } : doc
      ));

      toast({
        title: "Upload erfolgreich",
        description: `${uploadsToProcess.length} Dokument(e) wurden erfolgreich hochgeladen.`,
      });

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Fehler beim Upload",
        description: "Die Dokumente konnten nicht hochgeladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contractorId) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Keine Contractor-ID in der URL gefunden. Bitte verwenden Sie einen gültigen Upload-Link.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dokumente hochladen</h1>
          <p className="text-muted-foreground">
            Laden Sie die angeforderten Dokumente hoch und geben Sie die Gültigkeitsdaten an.
          </p>
        </div>

        {/* Demo Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Demo-Modus:</strong> Dateien werden nicht tatsächlich gespeichert. 
            Status und Gültigkeitsdaten werden jedoch in der App sichtbar.
          </AlertDescription>
        </Alert>

        {/* Document Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Erforderliche Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{doc.label}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      doc.requirement === "required" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {doc.requirement === "required" ? "Erforderlich" : "Optional"}
                    </span>
                  </div>
                  {doc.uploaded && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <FileCheck className="h-4 w-4" />
                        <span className="text-sm">Eingereicht</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Find the actual document data for preview
                          if (contractorId) {
                            const existingDocs = getDocs(contractorId);
                            const docData = existingDocs.find(d => d.documentTypeId === doc.id);
                            if (docData?.fileUrl) {
                              setPreviewDoc(docData);
                            }
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ansehen
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`file-${doc.id}`}>Datei auswählen</Label>
                    <Input
                      id={`file-${doc.id}`}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                      disabled={doc.uploaded}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`valid-${doc.id}`}>Gültig bis</Label>
                    <Input
                      id={`valid-${doc.id}`}
                      type="date"
                      value={doc.validUntil}
                      onChange={(e) => handleValidUntilChange(doc.id, e.target.value)}
                      disabled={doc.uploaded}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || documents.every(doc => !doc.file)}
                className="min-w-[150px]"
              >
                {isSubmitting ? "Wird hochgeladen..." : "Dokumente hochladen"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Document Preview Dialog */}
        <DocumentPreviewDialog 
          open={!!previewDoc} 
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          doc={previewDoc}
        />
      </div>
    </div>
  );
}