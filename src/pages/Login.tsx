import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts/AuthContext';
import { Logo } from '@/components/Brand/Logo';
import { BRAND } from '@/config/brand';
import { Loader2, Mail, Building } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTraditional, setShowTraditional] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { signIn, signInWithOAuth, sendMagicLink } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
    }
    
    setLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'azure') => {
    setLoading(true);
    setError('');
    
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      setError(`Anmeldung über ${provider === 'google' ? 'Google' : 'Microsoft'} fehlgeschlagen.`);
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLinkLoading(true);
    setError('');

    const { error } = await sendMagicLink(magicLinkEmail);
    
    if (error) {
      setError('Magic Link konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
    } else {
      setMagicLinkSent(true);
    }
    
    setMagicLinkLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-6">
            <div className="flex justify-center">
              <Logo width={140} height={42} />
            </div>
            <div>
              <CardTitle className="text-2xl">Magic Link gesendet</CardTitle>
              <CardDescription>
                Prüfen Sie Ihre E-Mails und klicken Sie auf den Login-Link
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <div className="p-6 bg-success/10 rounded-lg">
              <Mail className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Wir haben einen Magic Link an <strong>{magicLinkEmail}</strong> gesendet.
                Klicken Sie auf den Link in der E-Mail, um sich anzumelden.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setMagicLinkSent(false);
                setMagicLinkEmail('');
              }}
            >
              Zurück zur Anmeldung
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo width={140} height={42} />
          </div>
          <div>
            <CardTitle className="text-2xl">Anmelden</CardTitle>
            <CardDescription>
              Wählen Sie Ihre bevorzugte Anmeldeart
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showTraditional ? (
            <>
              {/* SSO Buttons */}
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-base font-medium border-2 hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => handleOAuthSignIn('azure')}
                  disabled={loading}
                >
                  <Building className="mr-3 h-5 w-5 text-blue-600" />
                  Mit Microsoft anmelden
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-base font-medium border-2 hover:bg-red-50 hover:border-red-200"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Mit Google anmelden
                </Button>

                <form onSubmit={handleMagicLink} className="space-y-3">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="E-Mail für Magic Link"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      className="h-12 text-base"
                      required
                      disabled={magicLinkLoading}
                    />
                  </div>
                  <Button 
                    type="submit"
                    variant="outline" 
                    className="w-full h-14 text-base font-medium border-2 hover:bg-purple-50 hover:border-purple-200"
                    disabled={magicLinkLoading}
                  >
                    {magicLinkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Mail className="mr-3 h-5 w-5 text-purple-600" />
                    Magic Link senden
                  </Button>
                </form>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">oder</span>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowTraditional(true)}
              >
                Mit E-Mail & Passwort anmelden
              </Button>
            </>
          ) : (
            <>
              {/* Traditional Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihr@unternehmen.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Anmelden
                </Button>
              </form>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowTraditional(false)}
              >
                ← Zurück zu SSO-Optionen
              </Button>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Noch kein Account?{' '}
              <Link to="/register" className="text-brand-primary hover:underline">
                Jetzt registrieren
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:underline">
              ← Zurück zur Startseite
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}