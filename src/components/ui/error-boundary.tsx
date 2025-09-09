import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-danger">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                Anwendungsfehler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-brand-danger/20 bg-brand-danger/5">
                <Bug className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  Es ist ein unerwarteter Fehler aufgetreten. Die Anwendung konnte nicht ordnungsgemäß geladen werden.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <span className="group-open:hidden">Technische Details anzeigen</span>
                    <span className="hidden group-open:inline">Technische Details ausblenden</span>
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono text-muted-foreground overflow-auto max-h-32">
                    <div className="whitespace-pre-wrap break-words">
                      {this.state.error?.toString()}
                    </div>
                  </div>
                </details>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 touch-target focus-ring"
                  aria-label="Komponente erneut laden"
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Erneut versuchen
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex-1 touch-target focus-ring"
                  aria-label="Seite neu laden"
                >
                  Seite neu laden
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return handleError;
}

// Error fallback component
export function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="error-state p-6">
      <div className="error-icon">⚠️</div>
      <h2 className="text-h2 font-semibold mb-2 text-brand-danger">
        Etwas ist schiefgegangen
      </h2>
      <p className="text-caption text-muted-foreground mb-4">
        Die Komponente konnte nicht geladen werden.
      </p>
      <details className="mb-4 text-left max-w-md">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Fehlerdetails
        </summary>
        <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </details>
      <Button 
        onClick={resetErrorBoundary} 
        variant="outline"
        className="touch-target focus-ring"
        aria-label="Komponente erneut laden"
      >
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
        Erneut versuchen
      </Button>
    </div>
  );
}