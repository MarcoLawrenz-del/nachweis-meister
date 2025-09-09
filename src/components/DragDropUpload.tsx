import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Camera, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DragDropUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  uploading: boolean;
  uploadProgress: number;
  onCancel: () => void;
}

export default function DragDropUpload({ 
  onFileSelect, 
  selectedFile, 
  uploading, 
  uploadProgress, 
  onCancel 
}: DragDropUploadProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let message = "Datei wurde abgelehnt.";
      
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        message = "Datei ist zu groß. Maximum: 10MB";
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        message = "Dateityp nicht unterstützt. Erlaubt: PDF, JPG, PNG, DOC, DOCX";
      }
      
      toast({
        title: "Upload-Fehler",
        description: message,
        variant: "destructive"
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect, toast]);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (selectedFile && !uploading) {
    return (
      <Card className="p-6 border-success bg-success/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <FileText className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-medium text-success">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)} • Bereit zum Upload
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (uploading) {
    return (
      <Card className="p-6 border-primary bg-primary/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-primary">Upload läuft...</p>
              <p className="text-sm text-muted-foreground">
                {selectedFile?.name} wird hochgeladen
              </p>
            </div>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            {uploadProgress}% abgeschlossen
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      {...getRootProps()}
      className={`p-8 border-2 border-dashed cursor-pointer transition-all ${
        (dropzoneActive || dragActive) 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-xl transition-colors ${
            (dropzoneActive || dragActive) ? 'bg-primary/10' : 'bg-muted/50'
          }`}>
            <Upload className={`h-8 w-8 ${
              (dropzoneActive || dragActive) ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Datei hochladen
          </h3>
          <p className="text-muted-foreground">
            {isMobile ? 'Tippen Sie hier um' : 'Datei hierher ziehen oder'} eine Datei auszuwählen
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          {isMobile && (
            <>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Camera className="h-4 w-4 mr-2" />
                  Foto aufnehmen
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Datei wählen
                  <input {...getInputProps()} className="hidden" />
                </label>
              </Button>
            </>
          )}
          {!isMobile && (
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Datei auswählen
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Erlaubte Formate: PDF, JPG, PNG, DOC, DOCX</p>
          <p>Maximale Dateigröße: 10MB</p>
        </div>
      </div>
    </Card>
  );
}