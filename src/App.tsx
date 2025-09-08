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
import DemoApp from "./pages/DemoApp";
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
              <Link to="/demo">
                <Button variant="outline" size="lg" className="min-w-48 border-green-600 text-green-600 hover:bg-green-50">
                  🎯 DEMO TESTEN
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
            
            {/* Demo mode (no auth required) */}
            <Route path="/demo/*" element={<DemoApp />} />
            
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