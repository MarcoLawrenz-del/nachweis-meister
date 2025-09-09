import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthContext } from '@/contexts/AuthContext';
import { Logo } from '@/components/Brand/Logo';
import { BRAND } from '@/config/brand';
import { Loader2, CheckCircle } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    tenantName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    const { error } = await signUp(formData.email, formData.password, {
      name: formData.name,
      tenant_name: formData.tenantName
    });
    
    if (error) {
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-6">
            <div className="flex justify-center">
              <Logo width={140} height={42} />
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-brand-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-brand-success" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Registrierung erfolgreich!</CardTitle>
              <CardDescription>
                Bitte überprüfen Sie Ihre E-Mails und bestätigen Sie Ihr Konto.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white">
              <Link to="/login">Zur Anmeldung</Link>
            </Button>
          </CardContent>
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
            <CardTitle className="text-2xl">Registrieren</CardTitle>
            <CardDescription>
              Erstellen Sie Ihren {BRAND.name} Account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vollständiger Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Max Mustermann"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="ihr@unternehmen.de"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tenantName">Unternehmen</Label>
              <Input
                id="tenantName"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                required
                placeholder="Ihre Firma GmbH"
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Account erstellen
            </Button>
          </form>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Bereits registriert?{' '}
              <Link to="/login" className="text-brand-primary hover:underline">
                Jetzt anmelden
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:underline">
              ← Zurück zur Startseite
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}