import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getSession, isAuthenticated } from "@/services/auth";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Auto-redirect logic: if accessing /app/* without auth, go to login
  useEffect(() => {
    if (!isAuthenticated() && window.location.pathname.startsWith('/app')) {
      window.location.href = '/login';
    }
  }, []);
  
  const session = getSession();
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}