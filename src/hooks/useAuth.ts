import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authRateLimiter, auditLogger } from '@/lib/validation';
import { sanitizeEmail } from '@/lib/validation';

interface UserProfile {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'staff';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here to avoid deadlocks
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching with setTimeout to avoid deadlocks
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        setProfile(data as UserProfile);
      } else {
        // No profile found - user needs to complete setup
        console.log('No profile found for user:', userId);
        setProfile(null);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async (userData: { name: string; companyName: string }) => {
    if (!user?.id || !user?.email) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Create tenant first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({ name: userData.companyName })
        .select()
        .single();

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        return { error: tenantError };
      }

      // Create user profile
      const { data: newProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          tenant_id: tenant.id,
          name: userData.name,
          email: user.email,
          role: 'owner'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { error: profileError };
      }

      setProfile(newProfile as UserProfile);
      return { data: newProfile };
    } catch (error) {
      console.error('Error completing setup:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const sanitizedEmail = sanitizeEmail(email);
    
    // Rate limiting check
    if (!authRateLimiter.isAllowed(sanitizedEmail)) {
      const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(sanitizedEmail) / 60000);
      const error = new Error(`Zu viele Anmeldeversuche. Versuchen Sie es in ${remainingTime} Minuten erneut.`);
      
      auditLogger.log({
        action: 'SIGN_IN_RATE_LIMITED',
        userEmail: sanitizedEmail,
        details: { remainingTimeMinutes: remainingTime }
      });
      
      return { error };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      if (error) {
        auditLogger.log({
          action: 'SIGN_IN_FAILED',
          userEmail: sanitizedEmail,
          details: { error: error.message }
        });
      } else {
        auditLogger.log({
          action: 'SIGN_IN_SUCCESS',
          userEmail: sanitizedEmail
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      auditLogger.log({
        action: 'SIGN_IN_ERROR',
        userEmail: sanitizedEmail,
        details: { error: (error as Error).message }
      });
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; tenant_name?: string }) => {
    const sanitizedEmail = sanitizeEmail(email);
    
    // Rate limiting check
    if (!authRateLimiter.isAllowed(sanitizedEmail)) {
      const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(sanitizedEmail) / 60000);
      const error = new Error(`Zu viele Registrierungsversuche. Versuchen Sie es in ${remainingTime} Minuten erneut.`);
      
      auditLogger.log({
        action: 'SIGN_UP_RATE_LIMITED',
        userEmail: sanitizedEmail,
        details: { remainingTimeMinutes: remainingTime }
      });
      
      return { error };
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        auditLogger.log({
          action: 'SIGN_UP_FAILED',
          userEmail: sanitizedEmail,
          details: { error: error.message }
        });
        return { error };
      }

      // Create tenant and user profile only if user was created
      if (data.user && !data.user.email_confirmed_at) {
        try {
          // Create tenant first
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({ name: userData.tenant_name || 'Meine Firma' })
            .select()
            .single();

          if (tenantError) throw tenantError;

          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              tenant_id: tenant.id,
              name: userData.name,
              email: sanitizedEmail,
              role: 'owner'
            });

          if (profileError) throw profileError;
          
          auditLogger.log({
            action: 'SIGN_UP_SUCCESS',
            userId: data.user.id,
            userEmail: sanitizedEmail,
            details: { tenantName: userData.tenant_name || 'Meine Firma' }
          });
          
        } catch (profileCreationError) {
          console.error('Error creating profile:', profileCreationError);
          auditLogger.log({
            action: 'PROFILE_CREATION_FAILED',
            userId: data.user.id,
            userEmail: sanitizedEmail,
            details: { error: (profileCreationError as Error).message }
          });
          return { error: profileCreationError as Error };
        }
      }

      return { data, error };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      auditLogger.log({
        action: 'SIGN_UP_ERROR',
        userEmail: sanitizedEmail,
        details: { error: (error as Error).message }
      });
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const userEmail = user?.email;
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setSession(null);
        setUser(null);
        setProfile(null);
        
        auditLogger.log({
          action: 'SIGN_OUT_SUCCESS',
          userEmail: userEmail
        });
      } else {
        auditLogger.log({
          action: 'SIGN_OUT_FAILED',
          userEmail: userEmail,
          details: { error: error.message }
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      auditLogger.log({
        action: 'SIGN_OUT_ERROR',
        userEmail: user?.email,
        details: { error: (error as Error).message }
      });
      return { error: error as Error };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    completeSetup,
  };
}