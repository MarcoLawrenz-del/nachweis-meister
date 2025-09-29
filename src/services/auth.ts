// ============= Local Auth Service =============
// localStorage-based authentication for immediate use

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: number;
};

const LS_KEY = "subfix.auth.v1";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  
  try {
    // DEPRECATED: localStorage auth removed - use Supabase auth
    console.warn('[auth.ts] DEPRECATED: Use NewAuthContext instead');
    return null;
  } catch {
    return null;
  }
}

// Event system for auth state changes
type AuthListener = (session: Session | null) => void;
const listeners = new Set<AuthListener>();

// Notify all listeners when auth state changes
function notifyAuthStateChange() {
  const session = getSession();
  listeners.forEach(callback => callback(session));
}

export async function signIn({ email, password }: { email: string; password: string }): Promise<Session> {
  // Demo credentials or accept any email/password for demo
  const isDemoLogin = email === "demo@subfix.app" && password === "Demo!2025";
  
  if (!isDemoLogin && (!email.includes("@") || password.length < 1)) {
    throw new Error("Ungültige E-Mail oder Passwort");
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const session: Session = {
    user: {
      id: isDemoLogin ? "demo-user" : `user-${Date.now()}`,
      email: email,
      name: isDemoLogin ? "Demo User" : email.split("@")[0] || "User"
    },
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  // DEPRECATED: localStorage removed - use Supabase auth
  console.warn('[auth.ts] DEPRECATED: Use NewAuthContext signIn instead');
  
  // Notify listeners
  notifyAuthStateChange();
  
  return session;
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  // DEPRECATED: localStorage removed - use Supabase auth
  
  // Notify listeners
  notifyAuthStateChange();
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function onAuthStateChange(callback: AuthListener): () => void {
  listeners.add(callback);
  
  // Call immediately with current state
  callback(getSession());
  
  return () => {
    listeners.delete(callback);
  };
}