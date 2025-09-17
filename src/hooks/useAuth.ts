import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail, authRateLimiter, auditLogger } from '@/lib/validation';
import { debug } from '@/lib/debug';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { ROUTES } from '@/lib/ROUTES';

// User Profile Interface
interface UserProfile {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const handleAuthChange = (event: any, session: Session | null) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      handleAuthChange('INITIAL_SESSION', session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      }
      
      if (data) {
        if (!data.tenant_id) {
          debug.log('User has no tenant_id - needs setup:', userId);
          setProfile(null);
        } else {
          setProfile(data as UserProfile);
        }
      } else {
        debug.log('No profile found for user:', userId);
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
      debug.log('Starting setup for user:', user.id);
      
      // Call the Edge Function to complete setup (bypasses RLS)
      const { data, error: setupError } = await edgeFunctions.completeSetup({
        name: userData.name,
        companyName: userData.companyName
      });

      if (setupError) {
        debug.error('Error in setup function:', setupError);
        return { error: setupError };
      }

      debug.log('Setup completed successfully via Edge Function');

      // Refresh the profile
      await fetchProfile(user.id);
      
      return { data };
    } catch (error) {
      console.error('Error in completeSetup:', error);
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

  const signInWithOAuth = async (provider: 'google' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'azure' ? 'azure' : 'google',
        options: {
          redirectTo: `${window.location.origin}${ROUTES.dashboard}`
        }
      });
      
      if (error) {
        auditLogger.log({
          action: 'OAUTH_SIGN_IN_FAILED',
          details: { provider, error: error.message }
        });
      } else {
        auditLogger.log({
          action: 'OAUTH_SIGN_IN_INITIATED',
          details: { provider }
        });
      }

      return { error };
    } catch (error) {
      console.error('Unexpected OAuth sign in error:', error);
      auditLogger.log({
        action: 'OAUTH_SIGN_IN_ERROR',
        details: { provider, error: (error as Error).message }
      });
      return { error: error as Error };
    }
  };

  const sendMagicLink = async (email: string) => {
    const sanitizedEmail = sanitizeEmail(email);
    
    // Rate limiting check
    if (!authRateLimiter.isAllowed(sanitizedEmail)) {
      const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(sanitizedEmail) / 60000);
      const error = new Error(`Zu viele Anfragen. Versuchen Sie es in ${remainingTime} Minuten erneut.`);
      
      auditLogger.log({
        action: 'MAGIC_LINK_RATE_LIMITED',
        userEmail: sanitizedEmail,
        details: { remainingTimeMinutes: remainingTime }
      });
      
      return { error };
    }

    try {
      // Check domain allowlist before sending magic link
      const emailDomain = sanitizedEmail.split('@')[1];
      
      // Get current user's profile to check tenant context
      let tenantId = null;
      if (profile?.tenant_id) {
        tenantId = profile.tenant_id;
      }

      const { data: isAllowed, error: domainCheckError } = await supabase
        .rpc('is_domain_allowed_for_magic_link', { 
          email_param: sanitizedEmail,
          tenant_id_param: tenantId 
        });

      if (domainCheckError) {
        console.error('Error checking domain allowlist:', domainCheckError);
        auditLogger.log({
          action: 'MAGIC_LINK_DOMAIN_CHECK_ERROR',
          userEmail: sanitizedEmail,
          details: { error: domainCheckError.message }
        });
        return { error: new Error('Fehler beim Überprüfen der Berechtigung') };
      }

      if (!isAllowed) {
        const errorMessage = `Die Domain "${emailDomain}" ist nicht für Magic Links berechtigt. Kontaktieren Sie Ihren Administrator.`;
        auditLogger.log({
          action: 'MAGIC_LINK_DOMAIN_BLOCKED',
          userEmail: sanitizedEmail,
          details: { domain: emailDomain, tenantId }
        });
        return { error: new Error(errorMessage) };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: sanitizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}${ROUTES.dashboard}`
        }
      });
      
      if (error) {
        auditLogger.log({
          action: 'MAGIC_LINK_FAILED',
          userEmail: sanitizedEmail,
          details: { error: error.message }
        });
      } else {
        auditLogger.log({
          action: 'MAGIC_LINK_SENT',
          userEmail: sanitizedEmail
        });
      }

      return { error };
    } catch (error) {
      console.error('Unexpected magic link error:', error);
      auditLogger.log({
        action: 'MAGIC_LINK_ERROR',
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
        return { data, error };
      }

      auditLogger.log({
        action: 'SIGN_UP_SUCCESS',
        userId: data.user?.id,
        userEmail: sanitizedEmail
      });

      // If signup is successful and user is confirmed, create their profile
      if (data.user && !data.user.email_confirmed_at) {
        // User needs to confirm email first
        debug.log('User registered but needs email confirmation');
      } else if (data.user) {
        // User is immediately confirmed, create profile
        try {
          // Create tenant first if tenant_name is provided
          let tenantId = null;
          if (userData.tenant_name) {
            const { data: tenant, error: tenantError } = await supabase
              .from('tenants')
              .insert({ name: userData.tenant_name })
              .select()
              .single();
            
            if (tenantError) {
              console.error('Error creating tenant during signup:', tenantError);
            } else {
              tenantId = tenant.id;
            }
          }

          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              tenant_id: tenantId,
              name: userData.name,
              email: sanitizedEmail,
              role: 'owner'
            });

          if (profileError) {
            console.error('Error creating profile during signup:', profileError);
            auditLogger.log({
              action: 'PROFILE_CREATION_FAILED',
              userId: data.user.id,
              userEmail: sanitizedEmail,
              details: { error: profileError.message }
            });
          } else {
            auditLogger.log({
              action: 'PROFILE_CREATED',
              userId: data.user.id,
              userEmail: sanitizedEmail
            });
          }
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
    signInWithOAuth,
    sendMagicLink,
    completeSetup,
  };
}