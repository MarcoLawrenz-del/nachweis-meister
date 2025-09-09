import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/brand";
import { Plus } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/app" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Logo width={120} height={36} />
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Button 
              asChild
              className="bg-brand-primary hover:bg-brand-primary/90 text-brand-on-primary"
            >
              <Link to="/app/subcontractors/invite">
                <Plus className="w-4 h-4 mr-2" />
                {BRAND.terms.subcontractor} einladen
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="border-t bg-muted/20 py-6 text-center text-sm text-muted-foreground">
        <p>{BRAND.name} · {BRAND.tagline}</p>
      </footer>
    </div>
  );
}