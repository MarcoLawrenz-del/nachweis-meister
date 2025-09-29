// ============= New Protected Route for Supabase Auth =============
// Protects routes that require Supabase authentication

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewAuth } from '@/contexts/NewAuthContext';

interface NewProtectedRouteProps {
  children: React.ReactNode;
}

export function NewProtectedRoute({ children }: NewProtectedRouteProps) {
  const { user, loading } = useNewAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to new auth page with return path
      navigate('/auth', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [user, loading, navigate, location]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}