import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { RequirementWithDocument } from '@/hooks/useSubcontractorProfile';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReviewsTabProps {
  requirements: RequirementWithDocument[];
  onReview: (requirementId: string, action: 'approve' | 'reject', data: any) => Promise<boolean>;
}

export function ReviewsTab({ requirements, onReview }: ReviewsTabProps) {
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({
    valid_from: '',
    valid_to: '',
    rejection_reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter requirements that need review
  const reviewableRequirements = requirements.filter(req => 
    ['submitted', 'in_review'].includes(req.status)
  );

  const selectedReq = selectedRequirement ? 
    requirements.find(r => r.id === selectedRequirement) : null;

  const handleApprove = async () => {
    if (!selectedRequirement || !reviewData.valid_to) return;

    setIsSubmitting(true);
    try {
      // Transition: in_review -> valid
      const success = await onReview(selectedRequirement, 'approve', {
        valid_from: reviewData.valid_from || new Date().toISOString().split('T')[0],
        valid_to: reviewData.valid_to
      });

      if (success) {
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequirement || !reviewData.rejection_reason.trim()) return;

    setIsSubmitting(true);
    try {
      // Transition: in_review -> rejected -> missing (automatic)
      const success = await onReview(selectedRequirement, 'reject', {
        rejection_reason: reviewData.rejection_reason
      });

      if (success) {
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedRequirement(null);
    setReviewData({
      valid_from: '',
      valid_to: '',
      rejection_reason: ''
    });
  };

  const openDocument = (document: any) => {
    window.open(document.file_url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Review Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Prüfungsqueue ({reviewableRequirements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewableRequirements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Keine Dokumente zur Prüfung vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewableRequirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRequirement === requirement.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/20'
                  }`}
                  onClick={() => setSelectedRequirement(requirement.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {requirement.status === 'submitted' ? 'Eingereicht' : 'In Prüfung'}
                        </Badge>
                        <h4 className="font-medium">{requirement.document_types.name_de}</h4>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Eingereicht: {requirement.submitted_at ? 
                            format(new Date(requirement.submitted_at), 'dd.MM.yyyy HH:mm', { locale: de }) 
                            : '—'
                          }
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {requirement.documents.length} Dokument(e)
                        </div>
                      </div>
                    </div>
                    
                    {selectedRequirement === requirement.id && (
                      <Eye className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Panel */}
      {selectedReq && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokument prüfen: {selectedReq.document_types.name_de}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Dokumenttyp:</strong> {selectedReq.document_types.name_de}
                </div>
                <div>
                  <strong>Code:</strong> {selectedReq.document_types.code}
                </div>
                <div>
                  <strong>Status:</strong> {selectedReq.status === 'submitted' ? 'Eingereicht' : 'In Prüfung'}
                </div>
                <div>
                  <strong>Pflichtdokument:</strong> {selectedReq.document_types.required_by_default ? 'Ja' : 'Nein'}
                </div>
              </div>
              
              {selectedReq.document_types.description_de && (
                <div className="mt-3 pt-3 border-t">
                  <strong>Beschreibung:</strong>
                  <p className="mt-1 text-muted-foreground">{selectedReq.document_types.description_de}</p>
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <h4 className="font-medium mb-3">Hochgeladene Dokumente</h4>
              <div className="space-y-2">
                {selectedReq.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{doc.file_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Hochgeladen: {format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDocument(doc)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Öffnen
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Review Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Approve Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Dokument genehmigen
                </h4>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pflichtfelder:</strong> Gültigkeitsdatum muss gesetzt werden.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="valid_from">Gültig ab (optional)</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={reviewData.valid_from}
                      onChange={(e) => setReviewData(prev => ({ ...prev, valid_from: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="valid_to">Gültig bis *</Label>
                    <Input
                      id="valid_to"
                      type="date"
                      value={reviewData.valid_to}
                      onChange={(e) => setReviewData(prev => ({ ...prev, valid_to: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleApprove}
                  disabled={!reviewData.valid_to || isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Genehmige...' : 'Dokument genehmigen'}
                </Button>
              </div>

              {/* Reject Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-red-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Dokument ablehnen
                </h4>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pflichtfelder:</strong> Ablehnungsgrund muss angegeben werden.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="rejection_reason">Ablehnungsgrund *</Label>
                  <Textarea
                    id="rejection_reason"
                    placeholder="Begründung für die Ablehnung..."
                    value={reviewData.rejection_reason}
                    onChange={(e) => setReviewData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={handleReject}
                  disabled={!reviewData.rejection_reason.trim() || isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Lehne ab...' : 'Dokument ablehnen'}
                </Button>
              </div>
            </div>

            {/* Cancel */}
            <div className="flex justify-center pt-4 border-t">
              <Button variant="ghost" onClick={resetForm}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}