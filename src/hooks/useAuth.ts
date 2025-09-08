import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail, authRateLimiter, auditLogger } from '@/lib/validation';

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
          console.log('User has no tenant_id - needs setup:', userId);
          setProfile(null);
        } else {
          setProfile(data as UserProfile);
        }
      } else {
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
      console.log('Starting setup for user:', user.id);
      
      // Check if user already has a profile (existing user without tenant)
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // First create the tenant
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: userData.companyName
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        return { error: tenantError };
      }

      console.log('Tenant created successfully:', newTenant);

      let newProfile;
      
      if (existingProfile) {
        // Update existing profile with tenant_id
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({
            tenant_id: newTenant.id,
            name: userData.name
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating profile:', updateError);
          return { error: updateError };
        }
        
        newProfile = updatedProfile;
        console.log('Profile updated successfully:', newProfile);
      } else {
        // Create new profile with tenant_id
        const { data: createdProfile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            tenant_id: newTenant.id,
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
        
        newProfile = createdProfile;
        console.log('Profile created successfully:', newProfile);
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
        console.log('User registered but needs email confirmation');
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
    completeSetup,
  };
}