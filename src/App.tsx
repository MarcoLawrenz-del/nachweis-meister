import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Subcontractors from "./pages/Subcontractors";
import SubcontractorDetail from "./pages/SubcontractorDetail";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import { ReviewQueue } from "./pages/ReviewQueue";
import RequirementsDetail from "./pages/RequirementsDetail";
import { DocumentDetail } from "./pages/DocumentDetail";
import PublicUpload from "./pages/PublicUpload";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MagicLinkWizard from "./pages/MagicLinkWizard";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";
import { Loader2, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { debug } from "@/lib/debug";

const queryClient = new QueryClient();

// Root component to handle initial routing
function RootRoute() {
  const { user, profile, loading } = useAuthContext();
  
  debug.log('🔍 RootRoute Debug:', { user: !!user, profile: !!profile, loading, timestamp: Date.now() });
  
  // If loading takes more than 1 second, show content anyway
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading && !showContent) {
    debug.log('🕒 SHOWING LOADING...');
    return (
      <div className="min-h-screen bg-destructive/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-destructive mx-auto mb-4" />
          <p className="text-destructive">LADE... {Date.now()}</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - show NEW landing page directly here
  if (!user) {
    debug.log('🚀 SHOWING NEW LANDING PAGE - TIMESTAMP:', Date.now());
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/brand/subfix-logo.svg" 
                alt="subfix" 
                className="h-8"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/login">Anmelden</Link>
              </Button>
              <Button asChild className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                <Link to="/register">Registrieren</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Compliance <span className="text-brand-primary">vereinfacht</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Nachunternehmer-Management für Bauprojekte. Automatisierte Prüfung von Pflichtdokumenten, 
              rechtssichere Abwicklung und transparente Compliance-Übersicht.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                <Link to="/register">Jetzt starten</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/public-demo">Demo ansehen</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-muted/20 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Warum subfix?</h2>
              <p className="text-muted-foreground">Alles was Sie für rechtssichere Nachunternehmer-Verwaltung brauchen</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Building2 className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Automatisierte Prüfung</h3>
                  <p className="text-sm text-muted-foreground">
                    Pflichtdokumente werden automatisch auf Vollständigkeit und Gültigkeit geprüft
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Zentrale Verwaltung</h3>
                  <p className="text-sm text-muted-foreground">
                    Alle Nachunternehmer und ihre Dokumente an einem Ort verwalten
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <span className="text-2xl font-bold text-brand-primary block mb-4">§</span>
                  <h3 className="font-semibold mb-2">Rechtssicherheit</h3>
                  <p className="text-sm text-muted-foreground">
                    Vollständige Compliance nach aktuellen Gesetzen und Vorschriften
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t py-12 bg-background">
          <div className="container mx-auto px-4 text-center">
            <img 
              src="/brand/subfix-logo.svg" 
              alt="subfix" 
              className="h-8 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              subfix · Compliance vereinfacht
            </p>
          </div>
        </footer>
      </div>
    );
  }
  
  // Authenticated but no profile - show setup  
  if (user && !profile) {
    debug.log('🔧 SHOWING SETUP PAGE - User exists but no profile');
    return (
      <div className="min-h-screen bg-warning/10 p-8">
        <div className="max-w-md mx-auto bg-warning/20 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-warning mb-4">🔧 SETUP SEITE</h1>
          <p className="text-warning mb-4">Sie sind eingeloggt aber haben keinen Tenant.</p>
          <p className="text-sm text-warning/80">Timestamp: {Date.now()}</p>
          <Setup />
        </div>
      </div>
    );
  }
  
  // Authenticated with profile - go to app
  return <Navigate to="/app/dashboard" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated but no profile exists - show setup
  if (user && !profile) {
    return <Setup />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user && profile) {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root route - redirect to appropriate page */}
            <Route path="/" element={<RootRoute />} />
            
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Magic link wizard (no auth required) */}
            <Route path="/invite/:token" element={<MagicLinkWizard />} />
            
            {/* Public document upload (no auth required) */}
            <Route path="/public/upload/:token" element={<PublicUpload />} />
            
            {/* ULTRAEINFACHE PUBLIC DEMO */}
            <Route path="/public-demo" element={
              <div style={{ 
                minHeight: '100vh', 
                backgroundColor: '#22c55e', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontFamily: 'system-ui'
              }}>
                <div style={{
                  textAlign: 'center',
                  backgroundColor: 'white',
                  color: 'black',
                  padding: '40px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  maxWidth: '600px'
                }}>
                  <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
                    ✅ ÖFFENTLICHE DEMO FUNKTIONIERT!
                  </h1>
                   <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
                     subfix App - Vollständige Demo ohne Login
                   </p>
                  <div style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h2>📊 Demo-Statistiken:</h2>
                    <p>👥 <strong>12 Nachunternehmer</strong></p>
                    <p>📁 <strong>8 Projekte</strong></p>
                    <p>⚠️ <strong>3 kritische Nachweise</strong></p>
                    <p>❌ <strong>1 abgelaufener Nachweis</strong></p>
                  </div>
                  <div style={{ backgroundColor: '#e0f2fe', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3>🏗️ Beispiel-Projekte:</h3>
                    <p>• Neubau Bürogebäude München (Aktiv)</p>
                    <p>• Sanierung Industriehalle Hamburg (Läuft ab)</p>
                    <p>• Wohnanlage Köln-Süd (Nicht konform)</p>
                  </div>
                  <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px' }}>
                    <h3>👷 Beispiel-Nachunternehmer:</h3>
                    <p>• Bau & Montage GmbH (Konform)</p>
                    <p>• ElektroTech Solutions (Läuft ab)</p>
                    <p>• Sanitär Pro (Nicht konform)</p>
                  </div>
                  <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                    <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : '/public-demo'}<br/>
                    <strong>Zeit:</strong> {new Date().toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
            } />
            
            {/* Simple Demo Route */}
            <Route path="/demo" element={
              <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    DEMO ERFOLGREICH!
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    Die Demo-Seite funktioniert jetzt korrekt.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>URL: {typeof window !== "undefined" ? window.location.href : "/demo"}</p>
                    <p>Zeit: {new Date().toLocaleString("de-DE")}</p>
                  </div>
                </div>
              </div>
            } />
            
            {/* Protected routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
               <Route path="dashboard" element={<Dashboard />} />
               <Route path="compliance" element={<ComplianceDashboard />} />
               <Route path="projects" element={<Projects />} />
               <Route path="projects/:id" element={<ProjectDetail />} />
               <Route path="subcontractors" element={<Subcontractors />} />
               <Route path="subcontractors/:id" element={<SubcontractorDetail />} />
               <Route path="requirements/:projectSubId" element={<RequirementsDetail />} />
               <Route path="documents/:documentId" element={<DocumentDetail />} />
               <Route path="review" element={<ReviewQueue />} />
               <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;