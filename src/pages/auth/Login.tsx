import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, LogIn, Building2, FileCheck, Eye } from "lucide-react";
import { signIn, getSession, isAuthenticated } from "@/services/auth";
import { ROUTES } from "@/lib/ROUTES";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-demo login if ?demo=1 in URL
  useEffect(() => {
    if (searchParams.get("demo") === "1") {
      handleDemoLogin();
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await signIn({ email, password });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error: any) {
      setError(error.message || "Anmeldung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await signIn({ email: "demo@subfix.app", password: "Demo!2025" });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error: any) {
      setError(error.message || "Demo-Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Area - 40% */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-center">
        <div className="text-white">
          <div className="mb-8">
            <Building2 className="h-16 w-16 mb-6 text-white/90" />
            <h1 className="text-5xl font-bold mb-4 tracking-tight">subfix</h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Digitale Nachunternehmer-Verwaltung
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Dokumente anfordern</h3>
                <p className="text-white/80">Einfach und schnell alle nötigen Unterlagen sammeln</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Status im Blick</h3>
                <p className="text-white/80">Compliance-Status auf einen Blick verfolgen</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Schnell prüfen</h3>
                <p className="text-white/80">Dokumente effizient freigeben oder zurückweisen</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Area - 60% */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
              <CardDescription>
                Melden Sie sich in Ihrem subfix Account an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-Mail
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="h-11"
                    autoComplete="email"
                    required
                    aria-describedby={error ? "error-message" : undefined}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Passwort
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ihr Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="h-11"
                    autoComplete="current-password"
                    required
                    aria-describedby={error ? "error-message" : undefined}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Anmeldung läuft...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Anmelden
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">oder</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                Demo-Login verwenden
              </Button>

              {error && (
                <Alert variant="destructive" id="error-message">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-center text-sm text-muted-foreground">
                Kein Account? Demo-Login nutzen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}