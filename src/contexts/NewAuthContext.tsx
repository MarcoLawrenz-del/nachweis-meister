// ============= NEW Supabase Authentication Context =============
// This completely replaces localStorage-based authentication

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

interface NewAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const NewAuthContext = createContext<NewAuthContextType | undefined>(undefined);

export function NewAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Supabase
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        debug.error('Error loading user profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      debug.error('Error loading profile:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debug.log('🔐 Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Load profile when user logs in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => loadUserProfile(session.user.id), 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        if (event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      debug.log('🔐 Attempting sign in for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        debug.error('🔐 Sign in error:', error);
        return { error };
      }

      debug.log('🔐 Sign in successful');
      return { error: null };
    } catch (error) {
      debug.error('🔐 Sign in exception:', error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      debug.log('🔐 Attempting sign up for:', email);
      
      const redirectUrl = `${window.location.origin}/app`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email
          }
        }
      });

      if (error) {
        debug.error('🔐 Sign up error:', error);
        return { error };
      }

      debug.log('🔐 Sign up successful - check email for confirmation');
      return { error: null };
    } catch (error) {
      debug.error('🔐 Sign up exception:', error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      debug.log('🔐 Attempting sign out');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debug.error('🔐 Sign out error:', error);
        return;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      debug.log('🔐 Sign out successful');
    } catch (error) {
      debug.error('🔐 Sign out exception:', error);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: 'Not authenticated' } };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        debug.error('🔐 Profile update error:', error);
        return { error };
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      debug.log('🔐 Profile updated successfully');
      return { error: null };
    } catch (error) {
      debug.error('🔐 Profile update exception:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <NewAuthContext.Provider value={value}>
      {children}
    </NewAuthContext.Provider>
  );
}

export function useNewAuth() {
  const context = useContext(NewAuthContext);
  if (context === undefined) {
    throw new Error('useNewAuth must be used within a NewAuthProvider');
  }
  return context;
}