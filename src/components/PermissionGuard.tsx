import { ReactNode } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredRoles?: ('owner' | 'admin' | 'staff')[];
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({ 
  children, 
  requiredRoles = [], 
  fallback,
  showError = true 
}: PermissionGuardProps) {
  const { userRole, isAuthenticated } = useAuthContext();

  // If not authenticated, don't show anything
  if (!isAuthenticated) {
    return null;
  }

  // If no roles specified, allow all authenticated users
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  const hasPermission = requiredRoles.includes(userRole);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sie haben keine Berechtigung, diese Aktion durchzuführen. 
            {requiredRoles.length === 1 
              ? `Nur ${getRoleLabel(requiredRoles[0])} können diese Funktion nutzen.`
              : `Nur ${requiredRoles.map(getRoleLabel).join(', ')} können diese Funktion nutzen.`
            }
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

function getRoleLabel(role: 'owner' | 'admin' | 'staff'): string {
  const labels = {
    owner: 'Inhaber',
    admin: 'Administratoren', 
    staff: 'Mitarbeiter'
  };
  return labels[role];
}