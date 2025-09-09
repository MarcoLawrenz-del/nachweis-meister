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

const queryClient = new QueryClient();

// Root component to handle initial routing
function RootRoute() {
  const { user, profile, loading } = useAuthContext();
  
  console.log('🔍 RootRoute Debug:', { user: !!user, profile: !!profile, loading, timestamp: Date.now() });
  
  // If loading takes more than 1 second, show content anyway
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading && !showContent) {
    console.log('🕒 SHOWING LOADING...');
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-red-800">LADE... {Date.now()}</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - show NEW landing page directly here
  if (!user) {
    console.log('🚀 SHOWING NEW LANDING PAGE - TIMESTAMP:', Date.now());
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* NEUE LANDING PAGE - CACHE BREAK */}
        <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
          NEUE SEITE GELADEN: {new Date().toLocaleTimeString()}
        </div>
        
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nachweis-Meister</h1>
                <p className="text-xs text-gray-600">Baugewerbe Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700">Anmelden</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Registrieren</Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-12 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight mb-6 text-gray-900">
              ✅ NEUE Professionelle Nachweisführung
              <span className="text-blue-600 block mt-2">für das Baugewerbe</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              🆕 Verwalten Sie alle pflichtrelevanten Nachweise Ihrer Subunternehmer sicher und rechtskonform. 
              Automatische Fristüberwachung inklusive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="min-w-48 bg-blue-600 hover:bg-blue-700">
                  <Users className="mr-2 h-5 w-5" />
                  🚀 KOSTENLOS REGISTRIEREN
                </Button>
              </Link>
              <Link to="/public-demo">
                <Button size="lg" className="min-w-48 bg-green-600 hover:bg-green-700">
                  🎯 VOLLSTÄNDIGE DEMO
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="lg" className="min-w-48 border-blue-600 text-blue-600 hover:bg-blue-50">
                  🧪 EINFACHE DEMO
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="lg" className="min-w-48 text-blue-600 hover:bg-blue-50">
                  ✨ Bereits registriert? Anmelden
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="text-center text-gray-500 text-sm mt-8">
          Cache-Break ID: {Math.random().toString(36).substring(7)}
        </div>
      </div>
    );
  }
  
  // Authenticated but no profile - show setup  
  if (user && !profile) {
    console.log('🔧 SHOWING SETUP PAGE - User exists but no profile');
    return (
      <div className="min-h-screen bg-yellow-100 p-8">
        <div className="max-w-md mx-auto bg-yellow-200 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">🔧 SETUP SEITE</h1>
          <p className="text-yellow-700 mb-4">Sie sind eingeloggt aber haben keinen Tenant.</p>
          <p className="text-sm text-yellow-600">Timestamp: {Date.now()}</p>
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
            <Route path="/upload/:token" element={<PublicUpload />} />
            
            {/* Public Demo Route - Complete inline implementation */}
            <Route path="/public-demo" element={
              <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4">
                  <div className="container mx-auto text-center">
                    <h1 className="text-2xl font-bold">🎯 Nachweis-Meister - Vollständige öffentliche Demo</h1>
                    <p className="text-sm mt-1">Komplette App-Funktionalität ohne Login • Alle Daten sind Beispieldaten</p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8">
                  {/* Stats Cards */}
                  <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-card p-6 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nachunternehmer</p>
                          <p className="text-3xl font-bold">12</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-lg">👥</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card p-6 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Projekte</p>
                          <p className="text-3xl font-bold">8</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-lg">📁</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card p-6 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Kritische Nachweise</p>
                          <p className="text-3xl font-bold text-orange-600">3</p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 text-lg">⚠️</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card p-6 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Abgelaufene Nachweise</p>
                          <p className="text-3xl font-bold text-red-600">1</p>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-lg">❌</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="bg-card p-6 rounded-lg border mb-8">
                    <h2 className="text-xl font-bold mb-4">📁 Aktuelle Projekte</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">Neubau Bürogebäude München</h3>
                          <p className="text-sm text-muted-foreground">München, Bayern • 01/2024 - 12/2024</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Konform</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">Sanierung Industriehalle</h3>
                          <p className="text-sm text-muted-foreground">Hamburg • 03/2024 - 09/2024</p>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">⚠️ Läuft ab</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">Wohnanlage Köln-Süd</h3>
                          <p className="text-sm text-muted-foreground">Köln, NRW • 02/2024 - 01/2025</p>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">❌ Nicht konform</span>
                      </div>
                    </div>
                  </div>

                  {/* Subcontractors Section */}
                  <div className="bg-card p-6 rounded-lg border mb-8">
                    <h2 className="text-xl font-bold mb-4">👥 Nachunternehmer</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">Bau & Montage GmbH</h3>
                          <p className="text-sm text-muted-foreground">Hans Mueller • h.mueller@bau-montage.de</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Generalunternehmer</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">✅ Konform</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">ElektroTech Solutions</h3>
                          <p className="text-sm text-muted-foreground">Sarah Schmidt • s.schmidt@elektrotech.de</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Elektro</span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">⚠️ Läuft ab</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">Sanitär Pro</h3>
                          <p className="text-sm text-muted-foreground">Michael Weber • m.weber@sanitaer-pro.de</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Sanitär</span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">❌ Nicht konform</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Critical Documents */}
                  <div className="bg-card p-6 rounded-lg border">
                    <h2 className="text-xl font-bold mb-4">🚨 Kritische Nachweise</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50">
                        <div>
                          <p className="font-medium">A1-Bescheinigung</p>
                          <p className="text-sm text-muted-foreground">ElektroTech Solutions • Bürogebäude München</p>
                        </div>
                        <span className="text-sm font-medium text-orange-600">Läuft ab: 31.12.2024</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50">
                        <div>
                          <p className="font-medium">Arbeitgeberhaftpflicht</p>
                          <p className="text-sm text-muted-foreground">Sanitär Pro • Industriehalle Hamburg</p>
                        </div>
                        <span className="text-sm font-medium text-red-600">Abgelaufen: 15.11.2024</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-12 p-6 bg-muted/30 rounded-lg text-center">
                    <h3 className="font-semibold mb-2">🎯 Vollständige Demo der Nachweis-Meister App</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Dashboard • Projekte • Nachunternehmer • Compliance-Management • Dokumentenverwaltung
                    </p>
                    <p className="text-xs text-muted-foreground">
                      URL: <code className="bg-background px-2 py-1 rounded">{typeof window !== "undefined" ? window.location.href : "/public-demo"}</code>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Geladen: {new Date().toLocaleString("de-DE")}
                    </p>
                  </div>
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