import { supabase } from '@/integrations/supabase/client';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
}

class DemoAuthService {
  private currentDemoUser: DemoUser | null = null;
  private initialized = false;

  /**
   * Initialize demo mode with fallback user for immediate access
   */
  async initializeFallbackDemoMode() {
    if (this.initialized) return;
    
    try {
      console.log('[DemoAuth] Initializing fallback demo mode...');
      
      // Set demo user ID to first available user for immediate RLS access
      await supabase.rpc('set_demo_user_id', { user_id: null });  // This will use the fallback in the function
      
      this.initialized = true;
      console.log('[DemoAuth] Fallback demo mode initialized');
    } catch (error) {
      console.error('[DemoAuth] Failed to initialize fallback demo mode:', error);
    }
  }

  /**
   * Synchronize local auth user with Supabase for demo mode
   */
  async syncLocalUserWithSupabase(localUser: { id: string; email: string; name: string }) {
    try {
      console.log('[DemoAuth] Syncing local user with Supabase:', localUser);

      // Call the Supabase function to sync user
      const { data, error } = await supabase.rpc('sync_local_user', {
        local_user_id: localUser.id,
        user_email: localUser.email,
        user_name: localUser.name,
        tenant_name: 'Demo Tenant'
      });

      if (error) {
        console.error('[DemoAuth] Error syncing user:', error);
        throw error;
      }

      console.log('[DemoAuth] User synced, Supabase user ID:', data);

      // Get the full user record from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data)
        .single();

      if (userError) {
        console.error('[DemoAuth] Error fetching synced user:', userError);
        throw userError;
      }

      this.currentDemoUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        tenant_id: userData.tenant_id
      };

      // Set demo user ID for RLS policies
      await supabase.rpc('set_demo_user_id', { user_id: userData.id });

      console.log('[DemoAuth] Demo user set successfully:', this.currentDemoUser);
      return this.currentDemoUser;
    } catch (error) {
      console.error('[DemoAuth] Failed to sync user with Supabase:', error);
      throw error;
    }
  }

  /**
   * Initialize demo mode for an existing local user
   */
  async initializeDemoMode(localUser: { id: string; email: string; name: string } | null) {
    // Always ensure fallback demo mode is initialized first
    await this.initializeFallbackDemoMode();
    
    if (!localUser) {
      console.log('[DemoAuth] No local user provided, using fallback demo mode');
      return null;
    }

    try {
      return await this.syncLocalUserWithSupabase(localUser);
    } catch (error) {
      console.error('[DemoAuth] Failed to initialize demo mode:', error);
      // Continue with fallback demo mode if sync fails
      return null;
    }
  }

  /**
   * Initialize app-wide demo mode (call at app startup)
   */
  async initializeAppDemo() {
    await this.initializeFallbackDemoMode();
  }

  /**
   * Get current demo user
   */
  getCurrentDemoUser(): DemoUser | null {
    return this.currentDemoUser;
  }

  /**
   * Clear demo mode
   */
  clearDemoMode() {
    this.currentDemoUser = null;
    console.log('[DemoAuth] Demo mode cleared');
  }

  /**
   * Check if demo mode is active
   */
  isDemoModeActive(): boolean {
    return this.currentDemoUser !== null;
  }
}

export const demoAuthService = new DemoAuthService();