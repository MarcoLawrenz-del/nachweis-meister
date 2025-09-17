import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image } from 'lucide-react';
import type { ContractorDocument } from '@/services/contractors';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: ContractorDocument | null;
}

export function DocumentPreviewDialog({ open, onOpenChange, doc }: DocumentPreviewDialogProps) {
  if (!doc?.fileUrl) return null;

  const handleDownload = () => {
    if (!doc.fileUrl || !doc.fileName) return;
    
    // Create blob from data URL and trigger download
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreview = () => {
    if (!doc.fileUrl || !doc.fileType) {
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <FileText className="w-8 h-8 mb-2" />
          <p>Keine Vorschau verfügbar</p>
        </div>
      );
    }

    // PDF preview
    if (doc.fileType === 'application/pdf') {
      return (
        <object 
          data={doc.fileUrl} 
          type="application/pdf" 
          className="w-full h-[70vh] border rounded"
        >
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <FileText className="w-8 h-8 mb-2" />
            <p>PDF kann nicht angezeigt werden. Bitte herunterladen.</p>
          </div>
        </object>
      );
    }

    // Image preview
    if (doc.fileType.startsWith('image/')) {
      return (
        <div className="flex justify-center p-4">
          <img 
            src={doc.fileUrl} 
            alt={doc.fileName || 'Dokument'} 
            className="max-h-[70vh] max-w-full object-contain rounded border"
          />
        </div>
      );
    }

    // Fallback for other file types
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground space-y-4">
        <FileText className="w-12 h-12" />
        <div className="text-center">
          <p className="font-medium">{doc.fileName}</p>
          <p className="text-sm">Dateityp: {doc.fileType}</p>
          <p className="text-sm">Größe: {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Unbekannt'}</p>
        </div>
        <p className="text-sm">Vorschau für diesen Dateityp nicht verfügbar</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {doc.fileType?.startsWith('image/') ? (
                <Image className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              {doc.fileName || 'Dokument'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="ml-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Herunterladen
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto">
          {renderPreview()}
        </div>

        {doc.uploadedBy && doc.uploadedAt && (
          <div className="border-t pt-4 text-sm text-muted-foreground">
            Hochgeladen von: {doc.uploadedBy === 'admin' ? 'Administrator' : 'Nachunternehmer'} 
            {' am '}{new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}