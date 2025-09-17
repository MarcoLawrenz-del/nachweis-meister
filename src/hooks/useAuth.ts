import { useState, useEffect } from 'react';
import { verifyPassword } from '@/auth/users.store';
import { debug } from '@/lib/debug';

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
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('subfix.auth.user.v1');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Create profile from user data
        setProfile({
          id: userData.id,
          tenant_id: 'local-tenant',
          name: userData.name,
          email: userData.email,
          role: 'owner'
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('subfix.auth.user.v1');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await verifyPassword(email, password);
      
      if (!result.ok || !result.user) {
        return { error: new Error('E-Mail oder Passwort falsch') };
      }

      const userData = result.user;
      setUser(userData);
      
      // Create profile from user data
      const profileData = {
        id: userData.id,
        tenant_id: 'local-tenant',
        name: userData.name,
        email: userData.email,
        role: 'owner' as const
      };
      setProfile(profileData);
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('subfix.auth.user.v1');
      setUser(null);
      setProfile(null);
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