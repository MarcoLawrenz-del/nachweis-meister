import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WORDING } from '@/content/wording';

export default function MagicLinkWizard() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<'de' | 'en'>('de');
  const { toast } = useToast();
  
  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setIsValidToken(false);
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
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
      // Validate token via edge function
      const { data: response, error } = await supabase.functions.invoke('get-invitation-data', {
        body: { token }
      });

      if (error || !response?.success) {
        throw new Error(error?.message || 'Invitation not found');
      }

      // Get locale from tenant settings or default to DE
      const invitationData = response.data;
      const tenantLocale = invitationData?.project_sub?.project?.tenant?.locale_default || 'de';
      setLocale(tenantLocale);
      
      setIsValidToken(true);
      
      // Redirect to PublicUpload with the validated token
      navigate(`/upload/${token}`, { replace: true });
      
    } catch (error: any) {
      console.error('Token validation error:', error);
      setIsValidToken(false);
      toast({
        title: locale === 'de' ? "Ungültiger Link" : "Invalid Link",
        description: locale === 'de' 
          ? "Dieser Einladungslink ist ungültig oder abgelaufen." 
          : "This invitation link is invalid or expired.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getText = (key: string, fallback: string) => {
    // Simple i18n helper - can be extended with proper i18n library
    const texts = {
      de: {
        checking: 'Überprüfe Einladung...',
        invalidLink: 'Ungültiger Link',
        invalidDescription: 'Dieser Einladungslink ist ungültig oder abgelaufen.',
        contactSender: 'Bitte wenden Sie sich an den Absender für einen neuen Link.',
        toHomepage: 'Zur Startseite',
        documentUpload: 'Nachweis-Upload',
        uploadDescription: 'Laden Sie Ihre erforderlichen Dokumente hoch.',
        welcome: 'Willkommen zum Dokumenten-Upload-Wizard.',
        verified: 'Ihre Einladung wurde erfolgreich verifiziert.'
      },
      en: {
        checking: 'Verifying invitation...',
        invalidLink: 'Invalid Link',
        invalidDescription: 'This invitation link is invalid or expired.',
        contactSender: 'Please contact the sender for a new link.',
        toHomepage: 'To Homepage',
        documentUpload: 'Document Upload',
        uploadDescription: 'Upload your required documents.',
        welcome: 'Welcome to the document upload wizard.',
        verified: 'Your invitation has been successfully verified.'
      }
    };
    return texts[locale]?.[key as keyof typeof texts['de']] || fallback;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">{getText('checking', 'Überprüfe Einladung...')}</p>
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
            <CardTitle className="text-destructive">
              {getText('invalidLink', 'Ungültiger Link')}
            </CardTitle>
            <CardDescription>
              {getText('invalidDescription', 'Dieser Einladungslink ist ungültig oder abgelaufen.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {getText('contactSender', 'Bitte wenden Sie sich an den Absender für einen neuen Link.')}
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/')}
            >
              {getText('toHomepage', 'Zur Startseite')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // This component now just redirects to PublicUpload after validation
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{getText('documentUpload', 'Nachweis-Upload')}</CardTitle>
          <CardDescription>
            {getText('uploadDescription', 'Laden Sie Ihre erforderlichen Dokumente hoch.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p>{getText('welcome', 'Willkommen zum Dokumenten-Upload-Wizard.')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {getText('verified', 'Ihre Einladung wurde erfolgreich verifiziert.')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}