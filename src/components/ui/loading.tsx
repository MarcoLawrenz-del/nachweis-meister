import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  'aria-label': ariaLabel = 'Lädt...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)}
      aria-label={ariaLabel}
      aria-hidden="false"
    />
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  loadingText = 'Lädt...',
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size="lg" />
            <p className="text-caption text-muted-foreground" aria-live="polite">
              {loadingText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingPage({ 
  title = 'Lädt...',
  description = 'Bitte warten Sie einen Moment.',
  className 
}: LoadingPageProps) {
  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-background', className)}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h1 className="text-h2 font-semibold">{title}</h1>
          <p className="text-caption text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText,
  className,
  ...props 
}: LoadingButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={cn('touch-target focus-ring flex items-center gap-2', className)} 
      disabled={isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}