import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { verifyPassword } from "./users.store";

export type User = { id: string; email: string; name: string; createdAt?: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const LS_KEY = "subfix.auth.user.v1";
const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydration aus localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const userData = JSON.parse(raw);
        setUser({
          ...userData,
          createdAt: userData.createdAt || new Date().toISOString()
        });
      }
    } catch {}
    setLoading(false);
  }, []);

  const loginWithPassword = async (email: string, password: string) => {
    const result = await verifyPassword(email, password);
    
    if (!result.ok || !result.user) {
      throw new Error("E-Mail oder Passwort falsch");
    }
    
    const userData: User = {
      ...result.user,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(LS_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    try {
      localStorage.removeItem(LS_KEY);
      setUser(null);
    } catch (error) {
      console.warn('Logout cleanup failed:', error);
      setUser(null);
    }
  };

  const isAuthenticated = useMemo(() => user !== null, [user]);

  const value = useMemo(() => ({ 
    user, 
    loading, 
    isAuthenticated,
    loginWithPassword, 
    logout 
  }), [user, loading, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
};