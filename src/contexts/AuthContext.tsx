import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserRole, type UserRole } from '@/services/team.supabase';

interface AuthContextType extends ReturnType<typeof useAuth> {
  userRole: UserRole;
  logout: () => void;
  isAuthenticated: boolean;
}

// AuthContext for managing authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { role: userRole, loading: roleLoading } = useCurrentUserRole();
  
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const contextValue: AuthContextType = {
    ...auth,
    userRole,
    logout: auth.signOut,
    isAuthenticated: !!auth.user
  };
  
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}