import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileCheck, 
  AlertTriangle, 
  Eye, 
  Calendar,
  Building2,
  Download,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Brand/Logo";

interface DemoDocument {
  id: string;
  label: string;
  requirement: "required" | "optional";
  file: File | null;
  validUntil: string;
  uploaded: boolean;
  status?: "missing" | "submitted" | "accepted" | "rejected";
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
      status: "missing"
    },
    {
      id: "liability_insurance",
      label: "Haftpflichtversicherung",
      requirement: "required", 
      file: null,
      validUntil: "",
      uploaded: false,
      status: "missing"
    },
    {
      id: "trade_certificate",
      label: "Gewerbeschein",
      requirement: "required",
      file: null,
      validUntil: "",
      uploaded: false,
      status: "missing"
    },
    {
      id: "safety_certificate",
      label: "Sicherheitsunterweisung",
      requirement: "optional",
      file: null,
      validUntil: "",
      uploaded: false,
      status: "missing"
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      title: "Upload erfolgreich!",
      description: `${uploadsToProcess.length} Dokument(e) wurden erfolgreich hochgeladen.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Akzeptiert</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Eingereicht</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">Ausstehend</Badge>;
    }
  };

  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const requiredCount = documents.filter(doc => doc.requirement === "required").length;
  const requiredUploadedCount = documents.filter(doc => doc.requirement === "required" && doc.uploaded).length;
  const progressPercent = (uploadedCount / documents.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Logo width={120} height={36} />
          <Badge variant="outline" className="text-xs">
            Demo-Modus
          </Badge>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Project Info */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Dokumente hochladen</h1>
              <p className="text-muted-foreground mb-2">
                Projekt: <span className="font-medium">Bürogebäude Hauptstraße 42</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Bitte laden Sie die angeforderten Dokumente hoch und geben Sie die Gültigkeitsdaten an.
              </p>
            </div>
          </div>

          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  Fortschritt ({uploadedCount} von {documents.length} Dokumenten)
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{requiredCount - requiredUploadedCount} Pflichtdokumente ausstehend</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{uploadedCount} hochgeladen</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Notice */}
        <Alert className="mb-6 border-amber-200 bg-amber-50/50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Demo-Vorschau:</strong> Dies ist eine Demonstration der Upload-Erfahrung für Subunternehmer. 
            Dateien werden nicht tatsächlich gespeichert.
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
              <div key={doc.id} className="border border-border rounded-lg p-6 space-y-4 transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-lg">{doc.label}</h3>
                      <Badge variant={doc.requirement === "required" ? "destructive" : "secondary"}>
                        {doc.requirement === "required" ? "Erforderlich" : "Optional"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doc.requirement === "required" 
                        ? "Dieses Dokument ist für die Projektfreigabe erforderlich" 
                        : "Optionales Dokument für zusätzliche Nachweise"
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc.status || "missing")}
                    {doc.uploaded && (
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ansehen
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor={`file-${doc.id}`} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Datei auswählen
                    </Label>
                    <Input
                      id={`file-${doc.id}`}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                      disabled={doc.uploaded}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Unterstützte Formate: PDF, DOC, DOCX, JPG, PNG (max. 10MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`valid-${doc.id}`} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Gültig bis
                    </Label>
                    <Input
                      id={`valid-${doc.id}`}
                      type="date"
                      value={doc.validUntil}
                      onChange={(e) => handleValidUntilChange(doc.id, e.target.value)}
                      disabled={doc.uploaded}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground">
                      Wann läuft die Gültigkeit des Dokuments ab?
                    </p>
                  </div>
                </div>

                {doc.file && !doc.uploaded && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileCheck className="h-4 w-4 text-green-600" />
                      <span>Datei ausgewählt: {doc.file.name}</span>
                      <span className="text-muted-foreground">
                        ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                )}

                {doc.uploaded && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Dokument erfolgreich hochgeladen</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-6 border-t">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || documents.every(doc => !doc.file)}
                className="min-w-[180px]"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Dokumente hochladen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Benötigen Sie Hilfe?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Unterstützte Dateiformate:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• PDF-Dokumente (.pdf)</li>
                  <li>• Word-Dokumente (.doc, .docx)</li>
                  <li>• Bilder (.jpg, .jpeg, .png)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Wichtige Hinweise:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Maximale Dateigröße: 10MB</li>
                  <li>• Dokumente müssen gültig und lesbar sein</li>
                  <li>• Gültigkeitsdaten sorgfältig prüfen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}