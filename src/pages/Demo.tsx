import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoBanner } from "@/components/DemoBanner";
import { DemoAuthProvider } from "@/contexts/DemoContext";
import { LoadingSpinner } from "@/components/ui/loading";
import { debug } from '@/lib/debug';
import { Logo } from '@/components/Brand/Logo';
import { Button } from "@/components/ui/button";
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import pages for demo
import Dashboard from "./Dashboard";
import Projects from "./Projects";
import ProjectDetail from "./ProjectDetail";
import Subcontractors from "./Subcontractors";
import SubcontractorDetail from "./SubcontractorDetail";
import Settings from "./settings/Settings";

export default function Demo() {
  debug.log('🎯 Demo App Component Loaded');
  
  const handleSignOut = () => {
    window.location.href = '/';
  };
  
  return (
    <DemoAuthProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          
          <main className="flex-1 flex flex-col">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center px-6 gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <Logo className="h-8 w-auto" />
                </div>
                <div className="flex-1" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-4 w-4" />
                      <span className="sr-only">Demo User Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Demo Benutzer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Demo verlassen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            
            <div className="flex-1 p-6">
              <DemoBanner />
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/demo/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/subcontractors" element={<Subcontractors />} />
                  <Route path="/subcontractors/:id" element={<SubcontractorDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/demo/dashboard" replace />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </DemoAuthProvider>
  );
}