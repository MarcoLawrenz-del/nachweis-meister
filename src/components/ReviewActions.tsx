import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';

interface ReviewActionsProps {
  requirementId: string;
  currentStatus: string;
  onActionComplete?: () => void;
  disabled?: boolean;
}

export const ReviewActions = ({ requirementId, currentStatus, onActionComplete, disabled }: ReviewActionsProps) => {
  const [action, setAction] = useState<'approve' | 'reject' | 'escalate' | null>(null);
  const [reason, setReason] = useState('');
  const { submitReview, isLoading } = useReviews();

  const handleSubmit = async () => {
    if (!action) return;
    
    // Validation for required fields
    if (action === 'reject' && !reason.trim()) {
      return; // Button should be disabled, but double-check
    }
    
    const success = await submitReview({
      requirementId,
      action,
      reason: action === 'reject' ? reason : undefined,
      escalationReason: action === 'escalate' ? reason : undefined,
    });
    
    if (success) {
      setAction(null);
      setReason('');
      onActionComplete?.();
    }
  };

  const handleCancel = () => {
    setAction(null);
    setReason('');
  };

  // Don't show review actions if status doesn't allow review
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
            {action === 'escalate' && <AlertTriangle className="h-5 w-5 text-warning" />}
            {action === 'approve' && 'Dokument genehmigen'}
            {action === 'reject' && 'Dokument ablehnen'}
            {action === 'escalate' && 'Dokument eskalieren'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(action === 'reject' || action === 'escalate') && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {action === 'reject' ? 'Ablehnungsgrund' : 'Eskalationsgrund'}
                <span className="text-destructive ml-1">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  action === 'reject' 
                    ? 'Bitte geben Sie den Grund für die Ablehnung an...'
                    : 'Bitte geben Sie den Grund für die Eskalation an...'
                }
                rows={3}
                required
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || (action !== 'approve' && !reason.trim())}
              variant={action === 'approve' ? 'primary' : action === 'reject' ? 'destructive' : 'secondary'}
            >
              {isLoading ? 'Wird verarbeitet...' : 'Bestätigen'}
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
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
        disabled={disabled || isLoading}
        variant="primary"
        className="bg-success hover:bg-success/90 text-success-foreground"
        data-testid="btn-approve"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Genehmigen
      </Button>
      <Button
        onClick={() => setAction('reject')}
        disabled={disabled || isLoading}
        variant="destructive"
        data-testid="btn-reject"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Ablehnen
      </Button>
      <Button
        onClick={() => setAction('escalate')}
        disabled={disabled || isLoading}
        variant="secondary"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Eskalieren
      </Button>
    </div>
  );
};