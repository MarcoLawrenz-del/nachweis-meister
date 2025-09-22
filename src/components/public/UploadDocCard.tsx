import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Upload, 
  Camera, 
  FileCheck, 
  AlertTriangle, 
  Eye, 
  X, 
  CheckCircle2,
  Clock,
  HelpCircle,
  Calendar
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

interface UploadDocCardProps {
  doc: DocumentUpload;
  onPickFile: (file: File) => void;
  onOpenCamera: () => void;
  onRemove: () => void;
  onPreview: () => void;
  onValidUntilChange: (validUntil: string) => void;
}

export function UploadDocCard({ 
  doc, 
  onPickFile, 
  onOpenCamera, 
  onRemove, 
  onPreview, 
  onValidUntilChange 
}: UploadDocCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Gültig
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Hochgeladen
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Abgelehnt
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            <Upload className="h-3 w-3 mr-1" />
            Fehlend
          </Badge>
        );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onPickFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPickFile(file);
    }
  };

  const canUpload = doc.status === "missing" || doc.status === "rejected";
  const hasExistingFile = (doc.status === "submitted" || doc.status === "accepted") && (doc.fileName || doc.fileUrl);

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-sm",
        isDragOver && "ring-2 ring-primary/50 shadow-md"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium text-lg">{doc.label}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dieses Dokument benötigen wir für die Freigabe.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={doc.requirement === "required" ? "destructive" : "secondary"}
                className="text-xs"
              >
                {doc.requirement === "required" ? "Erforderlich" : "Optional"}
              </Badge>
              {getStatusBadge(doc.status)}
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        {doc.status === "rejected" && doc.rejectionReason && (
          <Alert className="mb-4 border-red-200 bg-red-50/50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Grund der Ablehnung:</strong> {doc.rejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Actions */}
        {canUpload && (
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Datei hier ablegen oder Button verwenden
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Camera Button (Mobile Only) */}
              {isMobile && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onOpenCamera}
                  aria-label="Foto mit Kamera aufnehmen"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Foto aufnehmen
                </Button>
              )}
              
              {/* File Button */}
              <Button
                variant="outline"
                className={cn("w-full", !isMobile && "col-span-2")}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Datei vom Gerät auswählen"
              >
                <Upload className="h-4 w-4 mr-2" />
                Datei auswählen
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileInputChange}
              aria-label={`Datei für ${doc.label} auswählen`}
            />
          </div>
        )}

        {/* Selected File Display */}
        {doc.file && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{doc.file.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button variant="ghost" size="sm" onClick={onPreview} aria-label="Datei ansehen">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Datei entfernen">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Existing File Display */}
        {!doc.file && hasExistingFile && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileCheck className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {doc.fileName || "Hochgeladenes Dokument"}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onPreview} aria-label="Datei ansehen">
                <Eye className="h-4 w-4 mr-1" />
                Ansehen
              </Button>
            </div>
          </div>
        )}

        {/* Validity Date */}
        {(doc.status === "submitted" || doc.status === "accepted" || doc.file) && (
          <div className="space-y-2">
            <Label htmlFor={`valid-${doc.id}`} className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Gültig bis
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Wann läuft die Gültigkeit des Dokuments ab?</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id={`valid-${doc.id}`}
              type="date"
              value={doc.validUntil}
              onChange={(e) => onValidUntilChange(e.target.value)}
              disabled={doc.status === "accepted"}
              min={new Date().toISOString().split('T')[0]}
              className="max-w-xs"
              aria-label={`Gültigkeitsdatum für ${doc.label}`}
            />
          </div>
        )}

        {/* File format info */}
        <p className="text-xs text-muted-foreground mt-4">
          Unterstützte Formate: PDF, JPG, PNG (max. 15MB)
        </p>
      </CardContent>
    </Card>
  );
}
