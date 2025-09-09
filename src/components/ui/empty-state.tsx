import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  children,
  className = "" 
}: EmptyStateProps) {
  return (
    <Card className={`empty-state ${className}`}>
      <CardContent className="p-8">
        <div className="text-center">
          {Icon && <Icon className="empty-state-icon" aria-hidden="true" />}
          
          <h3 className="text-h3 font-semibold mb-2">{title}</h3>
          
          {description && (
            <p className="text-caption text-muted-foreground mb-6 max-w-sm mx-auto">
              {description}
            </p>
          )}
          
          {action && (
            <Button 
              onClick={action.onClick}
              disabled={action.loading}
              className="touch-target focus-ring"
              aria-label={action.label}
            >
              {action.loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {action.label}
            </Button>
          )}
          
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized empty states for common use cases
export function NoDataEmptyState({ 
  title = "Keine Daten verfügbar", 
  description = "Es wurden noch keine Daten gefunden.",
  onRetry,
  retryLabel = "Erneut versuchen",
  retryLoading = false
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryLoading?: boolean;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={onRetry ? {
        label: retryLabel,
        onClick: onRetry,
        loading: retryLoading
      } : undefined}
    />
  );
}

export function ErrorEmptyState({
  title = "Ein Fehler ist aufgetreten",
  description = "Beim Laden der Daten ist ein Fehler aufgetreten.",
  onRetry,
  retryLabel = "Erneut versuchen",
  retryLoading = false
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryLoading?: boolean;
}) {
  return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3 className="text-h3 font-semibold mb-2 text-brand-danger">{title}</h3>
      <p className="text-caption text-muted-foreground mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          disabled={retryLoading}
          variant="outline"
          className="touch-target focus-ring"
          aria-label={retryLabel}
        >
          {retryLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {retryLabel}
        </Button>
      )}
    </div>
  );
}