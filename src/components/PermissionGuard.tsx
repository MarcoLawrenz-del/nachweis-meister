import { ReactNode } from 'react';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  roles?: ('owner' | 'admin' | 'staff')[];
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({ 
  children, 
  roles = [], 
  fallback,
  showError = true 
}: PermissionGuardProps) {
  const { profile } = useAppAuth();

  // If no roles specified, allow all authenticated users
  if (roles.length === 0) {
    return profile ? <>{children}</> : null;
  }

  // Check if user has required role
  const hasPermission = profile && roles.includes(profile.role);

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
            {roles.length === 1 
              ? `Nur ${getRoleLabel(roles[0])} können diese Funktion nutzen.`
              : `Nur ${roles.map(getRoleLabel).join(', ')} können diese Funktion nutzen.`
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