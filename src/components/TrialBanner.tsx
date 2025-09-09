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
    <Alert className={`border-l-4 ${isExpired ? 'border-l-destructive bg-destructive/5' : 'border-l-warning bg-warning/5'}`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {isExpired ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Crown className="h-5 w-5 text-warning" />
          )}
          
          <AlertDescription className="font-medium">
            {isExpired ? (
              <span className="text-destructive-foreground">
                Ihre Testphase ist abgelaufen. Upload und Einladungen sind gesperrt.
              </span>
            ) : (
              <span className="text-warning-foreground">
                Testphase: Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} verbleibend
              </span>
            )}
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={isExpired ? "destructive" : "default"}
            onClick={handleUpgrade}
          >
            {isExpired ? 'Plan aktivieren' : 'Jetzt upgraden'}
          </Button>
          
          {!isExpired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}