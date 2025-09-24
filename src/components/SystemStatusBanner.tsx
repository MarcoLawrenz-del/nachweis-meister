import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { featureFlags } from '@/config/flags';
import { useAuthContext } from '@/contexts/AuthContext';

export function SystemStatusBanner() {
  const { userRole } = useAuthContext();
  
  // Only show to authenticated users with admin role
  if (!['owner', 'admin'].includes(userRole)) {
    return null;
  }

  // Only show when safe mode is active
  if (!featureFlags.safeMode) {
    return null;
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        Sicherheitsmodus aktiv – öffentlicher Upload vorübergehend deaktiviert
      </AlertDescription>
    </Alert>
  );
}