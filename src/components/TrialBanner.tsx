import { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Crown } from "lucide-react";
import { isDemoMode } from "@/services/subscription.service";
import { useNavigate } from "react-router-dom";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  // Hide banner in demo mode - no subscription warnings needed
  if (isDemoMode() || dismissed) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <Alert className="banner-warning shadow-sm" data-testid="banner-trial">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-brand-warning flex-shrink-0" />
          
          <AlertDescription className="font-medium text-foreground">
            <span>
              <strong>Demo-Modus:</strong> Vollständige Funktionen mit Upgrade verfügbar
            </span>
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0 no-transform">
          <Button 
            size="sm" 
            variant="primary"
            onClick={handleUpgrade}
            className="focus-ring"
            aria-label="Upgrade für vollständige Funktionen"
            data-testid="btn-plan-aktivieren"
          >
            Jetzt upgraden
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="focus-ring"
            aria-label="Banner schließen"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Banner schließen</span>
          </Button>
        </div>
      </div>
    </Alert>
  );
}