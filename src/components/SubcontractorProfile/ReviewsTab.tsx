import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReviewsTabProps {
  reviewHistory: any[];
}

export function ReviewsTab({ reviewHistory }: ReviewsTabProps) {
  // Use only real review history data (remove hardcoded demo data)
  const reviews = reviewHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getReviewIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'submitted':
        return FileText;
      case 'escalated':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-success-50 text-success-600';
      case 'rejected':
        return 'bg-danger-50 text-danger-600';
      case 'submitted':
        return 'bg-info-50 text-info-600';
      case 'escalated':
        return 'bg-warn-50 text-warn-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      case 'submitted':
        return 'Eingereicht';
      case 'escalated':
        return 'Eskaliert';
      default:
        return action;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prüfungshistorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Prüfungen durchgeführt.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const Icon = getReviewIcon(review.action);
              return (
                <div key={review.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{review.document_name}</p>
                      <Badge variant="outline" className={getActionColor(review.action)}>
                        {getActionLabel(review.action)}
                      </Badge>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {review.comment}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {format(parseISO(review.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                      {review.reviewer_name && (
                        <>
                          <span>•</span>
                          <span>von {review.reviewer_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}