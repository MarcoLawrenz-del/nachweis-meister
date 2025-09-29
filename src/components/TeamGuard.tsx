import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { canManageTeam, useCurrentUserRole } from '@/services/team.supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface TeamGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function TeamGuard({ children, fallback }: TeamGuardProps) {
  const { user } = useNewAuth();
  const { role: userRole, loading } = useCurrentUserRole();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !canManageTeam(userRole)) {
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