import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useSupabaseAuthContext } from "@/contexts/SupabaseAuthContext";

interface SupabaseProtectedRouteProps {
  children: JSX.Element;
}

export function SupabaseProtectedRoute({ children }: SupabaseProtectedRouteProps) {
  const { isAuthenticated, loading } = useSupabaseAuthContext();
  
  // Auto-redirect logic: if accessing /app/* without auth, go to auth page
  useEffect(() => {
    if (!loading && !isAuthenticated && window.location.pathname.startsWith('/app')) {
      window.location.href = '/auth';
    }
  }, [isAuthenticated, loading]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
}