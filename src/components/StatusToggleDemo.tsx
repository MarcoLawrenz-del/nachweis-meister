import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Pause, Bell } from 'lucide-react';
import { useTelemetryIntegration } from '@/hooks/useTelemetryIntegration';

interface StatusToggleDemoProps {
  subcontractorName: string;
  onStatusChange?: (active: boolean) => void;
}

export function StatusToggleDemo({ subcontractorName, onStatusChange }: StatusToggleDemoProps) {
  const [isActive, setIsActive] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const { trackSubcontractorActivated, trackSubcontractorDeactivated } = useTelemetryIntegration();

  const handleToggle = (checked: boolean) => {
    setIsActive(checked);
    setShowTransition(true);
    onStatusChange?.(checked);
    
    // Track telemetry events
    if (checked) {
      trackSubcontractorActivated('demo-sub-1');
    } else {
      trackSubcontractorDeactivated('demo-sub-1');
    }
    
    // Hide transition message after 3 seconds
    setTimeout(() => setShowTransition(false), 3000);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Status: {subcontractorName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'
            }`} />
            <span className="font-medium">
              {isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            data-testid="status-toggle"
          />
        </div>

        {/* Status Explanation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {isActive ? (
              <>
                <Bell className="h-4 w-4 text-success" />
                <span className="text-success">Warnungen & Erinnerungen aktiv</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Alle Benachrichtigungen pausiert</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {isActive ? (
              <>
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Kann neuen Projekten zugewiesen werden</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Keine neuen Projektzuweisungen möglich</span>
              </>
            )}
          </div>
        </div>

        {/* Transition Alert */}
        {showTransition && (
          <Alert 
            className={isActive ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}
            data-testid="status-change-alert"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isActive 
                ? 'Nachunternehmer reaktiviert. Alle Pflichten und Warnungen sind wieder aktiv.' 
                : 'Nachunternehmer deaktiviert. Warnungen und Erinnerungen sind pausiert.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Demo Badges */}
        <div className="flex gap-2 pt-2">
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Compliance aktiv' : 'Compliance pausiert'}
          </Badge>
          {!isActive && (
            <Badge variant="outline" className="text-xs">
              E2E Test: Inaktiv
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}