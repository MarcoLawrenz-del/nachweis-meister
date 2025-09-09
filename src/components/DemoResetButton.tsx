import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { AccessibleIcon } from "@/components/AccessibleIcon";
import { debug } from '@/lib/debug';

export function DemoResetButton() {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      debug.log('🔄 Demo reset requested');
      
      // In demo mode, we just simulate the reset by reloading the page
      // In a real implementation, this would call the demo-reset edge function
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      debug.error('❌ Demo reset failed:', error);
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
        >
          <AccessibleIcon icon={RotateCcw} />
          Demo zurücksetzen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Demo-Daten zurücksetzen?</AlertDialogTitle>
          <AlertDialogDescription>
            Dies wird alle Demo-Daten auf den ursprünglichen Zustand zurücksetzen. 
            Alle Änderungen gehen verloren.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting ? 'Wird zurückgesetzt...' : 'Zurücksetzen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}