import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { canManageTeam } from '@/services/team.store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface TeamGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function TeamGuard({ children, fallback }: TeamGuardProps) {
  const { userRole } = useAuthContext();

  if (!canManageTeam(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Zugriff verweigert</h1>
          <p className="text-muted-foreground">
            Sie haben keine Berechtigung für diese Seite
          </p>
        </div>
        
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Nur Inhaber und Administratoren können das Team verwalten. 
            Ihre aktuelle Rolle: <strong>{userRole}</strong>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}