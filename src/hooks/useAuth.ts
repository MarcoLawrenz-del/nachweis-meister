import { useState, useEffect } from 'react';
import { verifyPassword } from '@/auth/users.store';
import { debug } from '@/lib/debug';
import { demoAuthService } from '@/services/demoAuth';

// Local auth user interface
interface User {
  id: string;
  email: string;
  name: string;
}

// Local auth profile interface  
interface UserProfile {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // DEPRECATED: localStorage auth removed - using Supabase auth only
      console.log('[useAuth] DEPRECATED: localStorage-based auth should not be used');
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await verifyPassword(email, password);
      
      if (!result.ok || !result.user) {
        return { error: new Error('E-Mail oder Passwort falsch') };
      }

      const userData = result.user;
      
      // DEPRECATED: localStorage removed - using Supabase auth only
      console.warn('[useAuth] DEPRECATED: Use NewAuthContext instead');
      setUser(userData);
      
      // Initialize demo mode with Supabase
      const demoUser = await demoAuthService.initializeDemoMode(userData);
      
      // Create profile from user data
      const profileData = {
        id: userData.id,
        tenant_id: demoUser?.tenant_id || 'local-tenant',
        name: userData.name,
        email: userData.email,
        role: 'owner' as const
      };
      setProfile(profileData);
      
      console.log('[useAuth] Sign in successful, demo mode initialized:', { userData, demoUser });
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // DEPRECATED: localStorage removed - using Supabase auth only
      demoAuthService.clearDemoMode();
      setUser(null);
      setProfile(null);
      console.log('[useAuth] Sign out successful, demo mode cleared');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as Error };
    }
  };

  // Stub functions for compatibility
  const signUp = async () => ({ error: new Error('Sign up not implemented in local auth') });
  const signInWithOAuth = async () => ({ error: new Error('OAuth not available in local auth') });
  const sendMagicLink = async () => ({ error: new Error('Magic links not available in local auth') });
  const completeSetup = async () => ({ error: new Error('Setup not needed in local auth') });

  return {
    user,
    session: user ? { user } : null, // Compatibility
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    sendMagicLink,
    completeSetup,
  };
}