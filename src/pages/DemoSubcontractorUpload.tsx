import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Building2,
  Shield,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Brand/Logo";
import { UploadDocCard } from "@/components/public/UploadDocCard";
import { StickyUploadFooter } from "@/components/public/StickyUploadFooter";
import { cn } from "@/lib/utils";

interface DemoDocument {
  id: string;
  label: string;
  requirement: "required" | "optional";
  file: File | null;
  validUntil: string;
  uploaded: boolean;
  status?: "missing" | "submitted" | "accepted" | "rejected";
  userUnknownExpiry?: boolean;
}

export default function DemoSubcontractorUpload() {
  const [documents, setDocuments] = useState<DemoDocument[]>([
    {
      id: "a1_certificate",
      label: "A1-Bescheinigung",
      requirement: "required",
      file: null,
      validUntil: "",
      uploaded: false,
      status: "missing",
      userUnknownExpiry: false
    },
    {
      id: "liability_insurance",
      label: "Haftpflichtversicherung",
      requirement: "required", 
      file: null,
      validUntil: "",
      uploaded: false,
      status: "missing",
      userUnknownExpiry: false
    },
    {
      id: "trade_certificate",
      label: "Gewerbeschein",
      requirement: "required",
      file: null,
      validUntil: "",
      uploaded: false,
      status: "missing",
      userUnknownExpiry: false
    },
    {
      id: "safety_certificate",
      label: "Sicherheitsunterweisung",
      requirement: "optional",
      file: null,
      validUntil: "",
      uploaded: false,
      status: "missing",
      userUnknownExpiry: false
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionalExpanded, setOptionalExpanded] = useState(false);
  const { toast } = useToast();

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
      doc.id === documentId ? { ...doc, file } : doc
    ));
  };

  const handleCameraCapture = (documentId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelect(documentId, file);
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
    if (!doc?.file) return;
    
    // Simple preview simulation for demo
    toast({
      title: "Datei-Vorschau",
      description: `Vorschau für ${doc.file.name} würde hier geöffnet.`,
    });
  };

  const handleSubmit = async () => {
    const uploadsToProcess = documents.filter(doc => doc.file && !doc.uploaded);
    
    if (uploadsToProcess.length === 0) {
      toast({
        title: "Keine Dokumente ausgewählt",
        description: "Bitte wählen Sie mindestens ein Dokument zum Hochladen aus.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate upload process
    for (let i = 0; i < uploadsToProcess.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDocuments(prev => prev.map(doc => 
        doc.id === uploadsToProcess[i].id 
          ? { ...doc, uploaded: true, status: "submitted" }
          : doc
      ));
    }

    setIsSubmitting(false);
    
    toast({
      title: "Gespeichert",
      description: "Wir prüfen Ihre Unterlagen.",
    });
  };

  // Calculate progress
  const requiredDocs = documents.filter(d => d.requirement === "required");
  const optionalDocs = documents.filter(d => d.requirement === "optional");
  const uploadedRequired = requiredDocs.filter(d => d.uploaded).length;
  const uploadedOptional = optionalDocs.filter(d => d.uploaded).length;
  const progress = requiredDocs.length > 0 ? Math.round((uploadedRequired / requiredDocs.length) * 100) : 0;
  const hasNewFiles = documents.some(d => d.file && !d.uploaded);

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
                  für <span className="font-medium">Musterfirma GmbH</span> – Bürogebäude Hauptstraße 42
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
        {/* Demo Notice */}
        <Alert className="mb-6 border-amber-200 bg-amber-50/50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Demo-Vorschau:</strong> Dies ist eine Demonstration der Upload-Erfahrung für Subunternehmer. 
            Dateien werden nicht tatsächlich gespeichert.
          </AlertDescription>
        </Alert>

        {/* Required Documents */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-red-700">Erforderliche Dokumente</h2>
          <div className="space-y-4">
            {requiredDocs.map((doc) => (
              <UploadDocCard
                key={doc.id}
                doc={{
                  ...doc,
                  status: doc.uploaded ? "submitted" : "missing"
                }}
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
                  doc={{
                    ...doc,
                    status: doc.uploaded ? "submitted" : "missing"
                  }}
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

      {/* Sticky Footer */}
      <StickyUploadFooter 
        isSubmitting={isSubmitting}
        hasNewFiles={hasNewFiles}
        onSave={handleSubmit}
      />
    </div>
  );
}