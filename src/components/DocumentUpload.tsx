import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload,
  File,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  Eye,
  Calendar,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  valid_from: string | null;
  valid_to: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  file_url: string;
}

interface Requirement {
  id: string;
  status: 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired';
  due_date: string | null;
  document_type: {
    name_de: string;
    description_de: string | null;
  };
  documents: Document[];
}

interface DocumentUploadProps {
  requirement: Requirement;
  subcontractorName: string;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ requirement, subcontractorName, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuthContext();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Datei zu groß",
          description: "Die Datei darf maximal 10MB groß sein.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile?.id) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${requirement.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      setUploadProgress(75);

      // Create document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          requirement_id: requirement.id,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          valid_from: validFrom || null,
          valid_to: validTo || null,
          uploaded_by: profile.id
        });

      if (docError) throw docError;

      setUploadProgress(90);

      // Update requirement status
      const { error: reqError } = await supabase
        .from('requirements')
        .update({ 
          status: 'in_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', requirement.id);

      if (reqError) throw reqError;

      setUploadProgress(100);

      toast({
        title: "Dokument hochgeladen",
        description: `${selectedFile.name} wurde erfolgreich hochgeladen und wird geprüft.`
      });

      // Reset form
      setSelectedFile(null);
      setValidFrom('');
      setValidTo('');
      setIsDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message || "Dokument konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gültig
          </Badge>
        );
      case 'in_review':
        return (
          <Badge variant="secondary">
            <Eye className="h-3 w-3 mr-1" />
            In Prüfung
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Läuft ab
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Abgelaufen
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{requirement.document_type.name_de}</CardTitle>
            <CardDescription>
              {requirement.document_type.description_de && (
                <span>{requirement.document_type.description_de} • </span>
              )}
              {subcontractorName}
            </CardDescription>
          </div>
          {getStatusBadge(requirement.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Due Date Alert */}
        {requirement.due_date && (
          <Alert className={
            new Date(requirement.due_date) < new Date() 
              ? 'border-danger bg-danger/5' 
              : 'border-warning bg-warning/5'
          }>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Fällig bis: {format(new Date(requirement.due_date), 'dd.MM.yyyy', { locale: de })}
              {new Date(requirement.due_date) < new Date() && ' (Überfällig)'}
            </AlertDescription>
          </Alert>
        )}

        {/* Existing Documents */}
        {requirement.documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Hochgeladene Dokumente:</h4>
            {requirement.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {format(new Date(doc.uploaded_at), 'dd.MM.yyyy', { locale: de })}
                    </p>
                    {doc.valid_to && (
                      <p className="text-xs text-muted-foreground">
                        Gültig bis: {format(new Date(doc.valid_to), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.file_url} download={doc.file_name}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant={requirement.documents.length > 0 ? "outline" : "primary"}>
              <Upload className="h-4 w-4 mr-2" />
              {requirement.documents.length > 0 ? 'Neues Dokument hochladen' : 'Dokument hochladen'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Dokument hochladen</DialogTitle>
              <DialogDescription>
                Laden Sie ein Dokument für "{requirement.document_type.name_de}" hoch.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Datei auswählen *</Label>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Erlaubt: PDF, JPG, PNG (max. 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Gültig ab</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_to">Gültig bis</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    Upload läuft... {uploadProgress}%
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
