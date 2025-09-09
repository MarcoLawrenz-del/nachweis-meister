import { useLocation, Link } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Dashboard from "./Dashboard";
import Projects from "./Projects";
import ProjectDetail from "./ProjectDetail";
import Subcontractors from "./Subcontractors";
import SubcontractorDetail from "./SubcontractorDetail";
import ComplianceDashboard from "./ComplianceDashboard";
import { ReviewQueue } from "./ReviewQueue";
import RequirementsDetail from "./RequirementsDetail";
import { DocumentDetail } from "./DocumentDetail";
import Settings from "./Settings";
import { DemoAuthProvider } from "@/contexts/DemoContext";
import { Info, User, LogOut } from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppAuth } from '@/hooks/useAppAuth';
import { useEffect } from "react";

export default function DemoApp() {
  const location = useLocation();
  const { profile } = useAppAuth();

  useEffect(() => {
    console.log('🎯 Demo App loaded, current path:', location.pathname);
  }, [location.pathname]);

  // Get the current demo path
  const demoPath = location.pathname.replace('/demo', '') || '/dashboard';
  
  console.log('🎯 Demo path calculated:', demoPath);

  // Render the appropriate component based on the path
  const renderContent = () => {
    console.log('🎯 Rendering content for path:', demoPath);
    
    switch (demoPath) {
      case '/':
      case '/dashboard':
        return <Dashboard />;
      case '/compliance':
        return <ComplianceDashboard />;
      case '/projects':
        return <Projects />;
      case '/subcontractors':
        return <Subcontractors />;
      case '/review':
        return <ReviewQueue />;
      case '/settings':
        return <Settings />;
      default:
        // Handle dynamic routes
        if (demoPath.startsWith('/projects/')) {
          return <ProjectDetail />;
        }
        if (demoPath.startsWith('/subcontractors/')) {
          return <SubcontractorDetail />;
        }
        if (demoPath.startsWith('/requirements/')) {
          return <RequirementsDetail />;
        }
        if (demoPath.startsWith('/documents/')) {
          return <DocumentDetail />;
        }
        return <Dashboard />;
    }
  };

  return (
    <DemoAuthProvider>
      <div className="min-h-screen bg-background">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            
            <main className="flex-1 flex flex-col">
              {/* Demo banner */}
              <div className="bg-blue-600 text-white p-2 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>🎯 DEMO MODUS - Alle Daten sind Beispieldaten | Demo Mode - All data is sample data</span>
                </div>
              </div>
              
              {/* Header */}
              <header className="h-14 border-b bg-card flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <h1 className="text-lg font-semibold">
                    🎯 Nachweis-Meister DEMO
                  </h1>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{profile?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {profile?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Demo Benutzer
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Demo verlassen</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>
              
              {/* Main content */}
              <div className="flex-1 p-6">
                <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
                  <p className="text-sm text-green-800">
                    🎯 Demo funktioniert! Aktueller Pfad: {location.pathname} | Demo-Pfad: {demoPath}
                  </p>
                </div>
                {renderContent()}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </DemoAuthProvider>
  );
}