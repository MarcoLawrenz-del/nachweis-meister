import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUserRole, type UserRole } from '@/services/team.store';

interface AuthContextType extends ReturnType<typeof useAuth> {
  userRole: UserRole;
  logout: () => void;
  isAuthenticated: boolean;
}

// AuthContext for managing authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const userRole = getCurrentUserRole();
  
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