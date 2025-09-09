import { useLocation, Navigate } from "react-router-dom";
import { DemoAuthProvider } from "@/contexts/DemoContext";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Info, User } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/hooks/useAppAuth';
import Dashboard from "./Dashboard";
import { useEffect } from "react";

export default function DemoApp() {
  const location = useLocation();
  const { profile } = useAppAuth();

  useEffect(() => {
    console.log('🎯 DEMO APP LOADED - Current location:', location.pathname);
  }, [location.pathname]);

  // If user just visits /demo, redirect to /demo/dashboard
  if (location.pathname === '/demo') {
    return <Navigate to="/demo/dashboard" replace />;
  }

  return (
    <DemoAuthProvider>
      <div className="min-h-screen bg-background">
        {/* Demo banner - ALWAYS visible */}
        <div className="bg-green-600 text-white p-3 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            <span>🎯 DEMO ERFOLGREICH GELADEN - Pfad: {location.pathname} | Alle Daten sind Beispieldaten</span>
          </div>
        </div>
        
        <SidebarProvider>
          <div className="flex w-full min-h-[calc(100vh-48px)]">
            <AppSidebar />
            
            <main className="flex-1 flex flex-col">
              {/* Header */}
              <header className="h-14 border-b bg-card flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <h1 className="text-lg font-semibold">
                    🎯 Nachweis-Meister DEMO
                  </h1>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{profile?.name || 'Demo User'}</span>
                </div>
              </header>
              
              {/* Main content */}
              <div className="flex-1 p-6">
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <h2 className="text-lg font-semibold text-green-800 mb-2">
                    ✅ Demo Modus Aktiv
                  </h2>
                  <p className="text-sm text-green-700">
                    Sie befinden sich im Demo-Modus. Alle angezeigten Daten sind Beispieldaten und dienen nur zur Demonstration der Funktionalitäten.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Aktueller Pfad: {location.pathname}
                  </p>
                </div>
                
                {/* Always show Dashboard in demo for simplicity */}
                <Dashboard />
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </DemoAuthProvider>
  );
}