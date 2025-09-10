import { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

export function TrialBanner() {
  const { subscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (!subscription || dismissed || subscription.subscription_status === 'active') {
    return null;
  }

  const isExpired = subscription.is_trial_expired;
  const daysLeft = subscription.days_left;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <Alert className={`${isExpired ? 'banner-danger' : 'banner-warning'} shadow-sm`} data-testid="banner-trial">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {isExpired ? (
            <AlertTriangle className="h-5 w-5 text-brand-danger flex-shrink-0" />
          ) : (
            <Crown className="h-5 w-5 text-brand-warning flex-shrink-0" />
          )}
          
          <AlertDescription className="font-medium text-foreground">
            {isExpired ? (
              <span>
                <strong>Testphase abgelaufen:</strong> Upload und Einladungen sind gesperrt.
              </span>
            ) : (
              <span>
                <strong>Testphase:</strong> Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} verbleibend
              </span>
            )}
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            variant={isExpired ? "destructive" : "default"}
            onClick={handleUpgrade}
            className="touch-target focus-ring"
            aria-label={isExpired ? 'Plan aktivieren um fortzufahren' : 'Jetzt upgraden um unbegrenzt zu nutzen'}
            data-testid="btn-plan-aktivieren"
          >
            {isExpired ? 'Plan aktivieren' : 'Jetzt upgraden'}
          </Button>
          
          {!isExpired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="touch-target focus-ring"
              aria-label="Banner schließen"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Banner schließen</span>
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}