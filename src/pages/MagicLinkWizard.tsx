import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function MagicLinkWizard() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    // Input sanitization and validation
    if (!token || typeof token !== 'string' || token.length < 10 || token.length > 255) {
      setIsValidToken(false);
      setLoading(false);
      return;
    }

    // Sanitize token - only allow alphanumeric and safe characters
    const sanitizedToken = token.replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedToken !== token) {
      setIsValidToken(false);
      setLoading(false);
      return;
    }

    try {
      // TODO: Implement proper token validation with backend
      // For now, simulate validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsValidToken(true);
    } catch (error) {
      console.error('Token validation error:', error);
      setIsValidToken(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">Überprüfe Einladung...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Ungültiger Link</CardTitle>
            <CardDescription>
              Dieser Einladungslink ist ungültig oder abgelaufen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Bitte wenden Sie sich an den Absender für einen neuen Link.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/')}
            >
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Nachweis-Upload</CardTitle>
          <CardDescription>
            Laden Sie Ihre erforderlichen Dokumente hoch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p>Willkommen zum Dokumenten-Upload-Wizard.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ihre Einladung wurde erfolgreich verifiziert.
            </p>
            {/* TODO: Implement document upload wizard */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}