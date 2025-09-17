import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Brand/Logo';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, isAuthenticated, loading } = useSupabaseAuthContext();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Registration form
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Reset password
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: error.message === 'Invalid login credentials' 
            ? "E-Mail oder Passwort falsch" 
            : error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.user) {
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen zurück!"
        });
        navigate('/app/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Fehler bei der Anmeldung",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfen Sie Ihre Passworteingabe",
        variant: "destructive"
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Passwort zu kurz",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signUp(
        registerData.email, 
        registerData.password, 
        registerData.fullName
      );
      
      if (error) {
        toast({
          title: "Registrierung fehlgeschlagen",
          description: error.message === 'User already registered' 
            ? "Diese E-Mail ist bereits registriert" 
            : error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.user) {
        toast({
          title: "Registrierung erfolgreich",
          description: data.user.email_confirmed_at 
            ? "Sie können sich jetzt anmelden" 
            : "Bitte bestätigen Sie Ihre E-Mail-Adresse"
        });
        
        if (data.user.email_confirmed_at) {
          navigate('/app/dashboard', { replace: true });
        } else {
          setActiveTab('login');
        }
      }
    } catch (error: any) {
      toast({
        title: "Fehler bei der Registrierung",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        toast({
          title: "Fehler beim Zurücksetzen",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "E-Mail gesendet",
        description: "Prüfen Sie Ihr E-Mail-Postfach für weitere Anweisungen"
      });
      
      setShowResetForm(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Fehler beim Zurücksetzen",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header with Logo and Navigation */}
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Zur Homepage
          </Link>
          
          <Logo width={120} height={40} className="mx-auto" />
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Willkommen</h1>
            <p className="text-muted-foreground">
              Melden Sie sich an oder erstellen Sie ein neues Konto
            </p>
          </div>
        </div>

        {/* Auth Forms */}
        {!showResetForm ? (
          <Card>
            <CardHeader className="space-y-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Anmelden</TabsTrigger>
                  <TabsTrigger value="register">Registrieren</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-Mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="ihre@email.de"
                          value={loginData.email}
                          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Passwort</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Wird angemeldet..." : "Anmelden"}
                    </Button>
                    
                    <div className="text-center">
                      <Button 
                        type="button" 
                        variant="link" 
                        onClick={() => setShowResetForm(true)}
                        className="text-sm"
                      >
                        Passwort vergessen?
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register" className="space-y-4 mt-6">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Vollständiger Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Max Mustermann"
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-Mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="ihre@email.de"
                          value={registerData.email}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Passwort</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          value={registerData.password}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-10 pr-10"
                          minLength={6}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">Passwort bestätigen</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Wird registriert..." : "Konto erstellen"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        ) : (
          // Reset Password Form
          <Card>
            <CardHeader>
              <CardTitle>Passwort zurücksetzen</CardTitle>
              <CardDescription>
                Geben Sie Ihre E-Mail-Adresse ein, um ein neues Passwort anzufordern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-Mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="ihre@email.de"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowResetForm(false)}
                    className="flex-1"
                  >
                    Zurück
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Wird gesendet..." : "Link senden"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}