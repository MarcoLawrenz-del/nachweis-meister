import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import * as React from "react";
import { HelmetProvider } from "react-helmet-async";
import { A11yProvider, SkipLink } from "./components/A11yProvider";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { ROUTES } from "@/lib/ROUTES";
import Landing from "./pages/Landing";
import { RequireAuth } from "@/auth/RequireAuth";

// Lazy Loading für Performance-Optimierung
const AppLayout = lazy(() => import("./components/AppLayout").then(module => ({ default: module.AppLayout })));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Subcontractors = lazy(() => import("./pages/Subcontractors"));
const SubcontractorDetail = lazy(() => import("./pages/SubcontractorDetail"));
const PackageWizard = lazy(() => import("./pages/PackageWizard"));
const QARunner = lazy(() => import("./pages/QARunner"));

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

const RequirementsDetail = lazy(() => import("./pages/RequirementsDetail"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail").then(module => ({ default: module.DocumentDetail })));
const PublicUpload = lazy(() => import("./pages/PublicUpload"));
const Settings = lazy(() => import("./pages/Settings"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MagicLinkWizard = lazy(() => import("./pages/MagicLinkWizard"));
const Setup = lazy(() => import("./pages/Setup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RouteNotFound = lazy(() => import("./components/RouteNotFound"));
const Demo = lazy(() => import("./pages/Demo"));
const PublicDemo = lazy(() => import("./pages/PublicDemo"));
const PublicUploadDemo = lazy(() => import("./pages/PublicUploadDemo"));
import { Loader2, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { debug } from "@/lib/debug";

const queryClient = new QueryClient();

// Simple root redirect
function RootRoute() {
  return <Navigate to={ROUTES.dashboard} replace />;
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
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SkipLink />
              <div id="main-content">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Login Route */}
                    <Route path="/login" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Login />
                      </Suspense>
                    } />

                     {/* App-Scope - Protected */}
                    <Route path="/app/*" element={
                      <RequireAuth>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AppLayout />
                        </Suspense>
                      </RequireAuth>
                    }>
                      {/* Index leitet immer auf Dashboard */}
                      <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
                      <Route path="dashboard" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Dashboard />
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
                      <Route path="qa-runner" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <QARunner />
                        </Suspense>
                      } />
                      <Route path="einstellungen" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Settings />
                        </Suspense>
                      } />
                      {/* Fallback 404 im App-Scope */}
                      <Route path="*" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <RouteNotFound />
                        </Suspense>
                      } />
                    </Route>

                    {/* Public routes - Keep unprotected */}
                    <Route path="/upload" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <PublicUploadDemo />
                      </Suspense>
                    } />

                    {/* Root and global fallback */}
                    <Route path="/" element={<Navigate to="/app" replace />} />
                    <Route path="*" element={<Navigate to="/app" replace />} />
                  </Routes>
                </Suspense>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </A11yProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;