import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import * as React from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { A11yProvider, SkipLink } from "./components/A11yProvider";
import { ErrorBoundary } from "./components/ui/error-boundary";
import Landing from "./pages/Landing";

// Lazy Loading für Performance-Optimierung
const AppLayout = lazy(() => import("./components/AppLayout").then(module => ({ default: module.AppLayout })));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Subcontractors = lazy(() => import("./pages/Subcontractors"));
const SubcontractorDetail = lazy(() => import("./pages/SubcontractorDetail"));
const PackageWizard = lazy(() => import("./pages/PackageWizard"));

// Landing Pages
const A1Entsendung = lazy(() => import("./pages/lp/A1Entsendung"));
const SokaBau = lazy(() => import("./pages/lp/SokaBau"));
const Freistellungsbescheinigung = lazy(() => import("./pages/lp/Freistellungsbescheinigung"));
const SHK = lazy(() => import("./pages/lp/SHK"));
const Elektro = lazy(() => import("./pages/lp/Elektro"));

// Legal Pages
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Dienstleister = lazy(() => import("./pages/Dienstleister"));
const AGB = lazy(() => import("./pages/AGB"));
const Kontakt = lazy(() => import("./pages/Kontakt"));

const ReviewQueue = lazy(() => import("./pages/ReviewQueue"));
const Reminders = lazy(() => import("./pages/Reminders"));
const RequirementsDetail = lazy(() => import("./pages/RequirementsDetail"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail").then(module => ({ default: module.DocumentDetail })));
const PublicUpload = lazy(() => import("./pages/PublicUpload"));
const Settings = lazy(() => import("./pages/Settings"));
const RolesAccess = lazy(() => import("./pages/RolesAccess"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MagicLinkWizard = lazy(() => import("./pages/MagicLinkWizard"));
const Setup = lazy(() => import("./pages/Setup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Demo = lazy(() => import("./pages/Demo"));
const PublicDemo = lazy(() => import("./pages/PublicDemo"));
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

// Loading component für Lazy Loading with accessibility
const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-caption text-muted-foreground" aria-live="polite">
        Lädt...
      </p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ErrorBoundary>
        <A11yProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SkipLink />
                <div id="main-content">
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
                      <Route path="/accept-invitation" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AcceptInvitation />
                        </Suspense>
                      } />
                      
                      {/* Public pricing page */}
                      <Route path="/pricing" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Pricing />
                        </Suspense>
                      } />
                      
                      {/* Use-Case Landing Pages */}
                      <Route path="/lp/a1-entsendung" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <A1Entsendung />
                        </Suspense>
                      } />
                      <Route path="/lp/soka-bau-nachweise" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <SokaBau />
                        </Suspense>
                      } />
                      <Route path="/lp/freistellungsbescheinigung-48b" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Freistellungsbescheinigung />
                        </Suspense>
                      } />
                      
                      {/* Vertical Landing Pages */}
                      <Route path="/lp/shk" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <SHK />
                        </Suspense>
                      } />
                      <Route path="/lp/elektro" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Elektro />
                        </Suspense>
                      } />
                      
                      {/* Magic link wizard (no auth required) */}
                      <Route path="/invite/:token" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <MagicLinkWizard />
                        </Suspense>
                      } />
                      
                       {/* Public document upload (no auth required) */}
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
                      
                      {/* Public Demo Route */}
                      <Route path="/public-demo" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <PublicDemo />
                        </Suspense>
                      } />
                      
                      {/* Comprehensive Demo Route */}
                      <Route path="/demo/*" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Demo />
                        </Suspense>
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
                           <Route path="projects/:projectId/subs/:subId" element={
                             <Suspense fallback={<LoadingSpinner />}>
                               <SubcontractorDetail />
                             </Suspense>
                           } />
                           <Route path="projects/:projectId/subs/:subId/package" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PackageWizard />
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
                         <Route path="reminders" element={
                           <Suspense fallback={<LoadingSpinner />}>
                             <Reminders />
                           </Suspense>
                         } />
                         <Route path="settings" element={
                           <Suspense fallback={<LoadingSpinner />}>
                             <Settings />
                           </Suspense>
                         } />
                          <Route path="roles-access" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <RolesAccess />
                            </Suspense>
                          } />
                          <Route path="package-wizard/:projectId/:subcontractorId" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PackageWizard />
                            </Suspense>
                          } />
                        </Route>
                       
                        {/* Legal pages */}
                        <Route path="/impressum" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Impressum />
                          </Suspense>
                        } />
                        <Route path="/datenschutz" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Datenschutz />
                          </Suspense>
                        } />
                        <Route path="/dienstleister" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Dienstleister />
                          </Suspense>
                        } />
                        <Route path="/agb" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AGB />
                          </Suspense>
                        } />
                        <Route path="/kontakt" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Kontakt />
                          </Suspense>
                        } />
                      
                      {/* Catch all */}
                      <Route path="*" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <NotFound />
                        </Suspense>
                      } />
                    </Routes>
                  </Suspense>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </A11yProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;