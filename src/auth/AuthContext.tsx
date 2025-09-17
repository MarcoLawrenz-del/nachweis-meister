import React, {createContext, useContext, useEffect, useMemo, useState} from "react";
import { Navigate, useLocation } from "react-router-dom";

type User = { id: string; email: string; name?: string };
type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, name?: string) => Promise<void>;
  signOut: () => void;
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
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const signIn = async (email: string, name?: string) => {
    const u: User = {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      email,
      name: name || email.split("@")[0]
    };
    localStorage.setItem(LS_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
};

// Route-Guard: schützt alle /app Routen
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  if (loading) return null; // oder ein Loader
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
};