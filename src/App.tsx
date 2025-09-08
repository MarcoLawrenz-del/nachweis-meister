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
import { ReviewQueue } from "./pages/ReviewQueue";
import RequirementsDetail from "./pages/RequirementsDetail";
import { DocumentDetail } from "./pages/DocumentDetail";
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
  
  // If loading takes more than 1 second, show content anyway
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading && !showContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Not authenticated - show NEW landing page directly here
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Nachweis-Meister</h1>
                <p className="text-xs text-muted-foreground">Baugewerbe Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Anmelden</Button>
              </Link>
              <Link to="/register">
                <Button>Registrieren</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Professionelle Nachweisführung
              <span className="text-primary block mt-2">für das Baugewerbe</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Verwalten Sie alle pflichtrelevanten Nachweise Ihrer Subunternehmer sicher und rechtskonform. 
              Automatische Fristüberwachung inklusive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="min-w-48">
                  <Users className="mr-2 h-5 w-5" />
                  Kostenlos registrieren
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="min-w-48">
                  Bereits registriert? Anmelden
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }
  
  // Authenticated but no profile - show setup  
  if (user && !profile) {
    return <Setup />;
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
            
            {/* Protected routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
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