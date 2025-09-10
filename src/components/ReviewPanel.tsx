import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewPanelProps {
  requirementId: string;
  currentStatus: string;
  onReviewComplete?: () => void;
  onSubmitReview: (action: 'approve' | 'reject', data: any) => Promise<boolean>;
}

export const ReviewPanel = ({
  requirementId,
  currentStatus,
  onReviewComplete,
  onSubmitReview
}: ReviewPanelProps) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [validTo, setValidTo] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!action) return;

    // Validation
    if (action === 'approve' && !validTo) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Gültig-bis-Datum ist erforderlich'
      });
      return;
    }

    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Ablehnungsgrund ist erforderlich'
      });
      return;
    }

    setIsSubmitting(true);
    
    const success = await onSubmitReview(action, {
      validTo: action === 'approve' ? validTo : undefined,
      rejectionReason: action === 'reject' ? rejectionReason : undefined
    });

    setIsSubmitting(false);

    if (success) {
      setAction(null);
      setValidTo('');
      setRejectionReason('');
      onReviewComplete?.();
    }
  };

  const handleCancel = () => {
    setAction(null);
    setValidTo('');
    setRejectionReason('');
  };

  // Don't show review panel if status doesn't allow review
  if (!['submitted', 'in_review'].includes(currentStatus)) {
    return null;
  }

  if (action) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {action === 'approve' && <CheckCircle className="h-5 w-5 text-success" />}
            {action === 'reject' && <XCircle className="h-5 w-5 text-destructive" />}
            {action === 'approve' && 'Nachweis genehmigen'}
            {action === 'reject' && 'Nachweis ablehnen'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {action === 'approve' && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Gültig bis <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          )}

          {action === 'reject' && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ablehnungsgrund <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Bitte geben Sie den Grund für die Ablehnung an..."
                rows={3}
                required
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (action === 'approve' && !validTo) ||
                (action === 'reject' && !rejectionReason.trim())
              }
              variant={action === 'approve' ? 'default' : 'destructive'}
            >
              {isSubmitting ? 'Wird verarbeitet...' : 'Bestätigen'}
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={isSubmitting}>
              Abbrechen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => setAction('approve')}
        disabled={isSubmitting}
        variant="default"
        className="bg-success hover:bg-success/90 text-success-foreground"
        data-testid="btn-approve"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Genehmigen
      </Button>
      <Button
        onClick={() => setAction('reject')}
        disabled={isSubmitting}
        variant="destructive"
        data-testid="btn-reject"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Ablehnen
      </Button>
    </div>
  );
};