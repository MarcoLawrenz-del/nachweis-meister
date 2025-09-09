import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import Landing from "./pages/Landing";

// Lazy Loading für Performance-Optimierung
const AppLayout = lazy(() => import("./components/AppLayout").then(module => ({ default: module.AppLayout })));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Subcontractors = lazy(() => import("./pages/Subcontractors"));
const SubcontractorDetail = lazy(() => import("./pages/SubcontractorDetail"));

const ReviewQueue = lazy(() => import("./pages/ReviewQueue").then(module => ({ default: module.ReviewQueue })));
const RequirementsDetail = lazy(() => import("./pages/RequirementsDetail"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail").then(module => ({ default: module.DocumentDetail })));
const PublicUpload = lazy(() => import("./pages/PublicUpload"));
const Settings = lazy(() => import("./pages/Settings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MagicLinkWizard = lazy(() => import("./pages/MagicLinkWizard"));
const Setup = lazy(() => import("./pages/Setup"));
const NotFound = lazy(() => import("./pages/NotFound"));
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
  
  // Not authenticated - show new Landing page
  if (!user) {
    debug.log('🚀 SHOWING NEW LANDING PAGE - TIMESTAMP:', Date.now());
    return <Landing />;
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

// Loading component für Lazy Loading
const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Root route - redirect to appropriate page */}
                <Route path="/" element={<RootRoute />} />
                
                {/* Public routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Login />
                    </Suspense>
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Register />
                    </Suspense>
                  </PublicRoute>
                } />
                
                {/* Public pricing page */}
                <Route path="/pricing" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Pricing />
                  </Suspense>
                } />
                
                {/* Magic link wizard (no auth required) */}
                <Route path="/invite/:token" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <MagicLinkWizard />
                  </Suspense>
                } />
                
                {/* Public document upload (no auth required) */}
                <Route path="/public/upload/:token" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <PublicUpload />
                  </Suspense>
                } />
                <Route path="/upload/:token" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <PublicUpload />
                  </Suspense>
                } />
                
                {/* Test route */}
                <Route path="/test-upload" element={
                  <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    fontFamily: 'system-ui'
                  }}>
                    ✅ UPLOAD-ROUTE FUNKTIONIERT!
                  </div>
                } />
                
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
                    <Suspense fallback={<LoadingSpinner />}>
                      <AppLayout />
                    </Suspense>
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                   <Route path="dashboard" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <Dashboard />
                     </Suspense>
                   } />
                   <Route path="projects" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <Projects />
                     </Suspense>
                   } />
                   <Route path="projects/:id" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <ProjectDetail />
                     </Suspense>
                   } />
                   <Route path="subcontractors" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <Subcontractors />
                     </Suspense>
                   } />
                   <Route path="subcontractors/:id" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <SubcontractorDetail />
                     </Suspense>
                   } />
                   <Route path="requirements/:projectSubId" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <RequirementsDetail />
                     </Suspense>
                   } />
                   <Route path="documents/:documentId" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <DocumentDetail />
                     </Suspense>
                   } />
                   <Route path="review" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <ReviewQueue />
                     </Suspense>
                   } />
                   <Route path="settings" element={
                     <Suspense fallback={<LoadingSpinner />}>
                       <Settings />
                     </Suspense>
                   } />
                </Route>
                
                {/* Catch all */}
                <Route path="*" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;