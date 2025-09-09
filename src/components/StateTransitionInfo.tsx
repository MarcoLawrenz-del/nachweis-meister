import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Info, ArrowRight } from 'lucide-react';
import { RequirementStatus } from '@/types/compliance';
import { getNextStates, getStateDescription, getTransitionTrigger } from '@/lib/stateTransitions';

interface StateTransitionInfoProps {
  currentState: RequirementStatus;
}

export function StateTransitionInfo({ currentState }: StateTransitionInfoProps) {
  const nextStates = getNextStates(currentState);
  const currentDescription = getStateDescription(currentState);

  if (nextStates.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Aktueller Status:</strong> {currentDescription}
          <br />
          <em>Keine weiteren automatischen Übergänge möglich.</em>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-2">
          <Info className="h-4 w-4 mr-1" />
          Status-Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Status-Übergänge</DialogTitle>
          <DialogDescription>
            Mögliche Übergänge vom aktuellen Status
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Aktueller Status:</h4>
            <Badge variant="outline" className="mb-2">
              {currentState}
            </Badge>
            <p className="text-sm text-muted-foreground">{currentDescription}</p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Mögliche Übergänge:</h4>
            <div className="space-y-3">
              {nextStates.map((nextState) => (
                <div key={nextState} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge variant="outline">{currentState}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="default">{nextState}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getStateDescription(nextState)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getTransitionTrigger(currentState, nextState)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Hinweis:</strong> Status-Übergänge erfolgen automatisch durch das System 
              oder durch Benutzeraktionen. Manuelle Status-Änderungen sind nur in begründeten 
              Ausnahmefällen durch Administratoren möglich.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}