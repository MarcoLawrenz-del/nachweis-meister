import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export interface SupabaseSettings {
  id: string;
  user_id: string;
  settings_data: any;
  created_at: string;
  updated_at: string;
}

// Settings service for Supabase
export async function getSupabaseSettings(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is OK
      throw error;
    }

    return data?.settings_data || {
      notifications: {
        email: true,
        push: false,
        reminders: true
      },
      system: {
        darkMode: false,
        language: 'de',
        autoSave: true
      }
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings
    return {
      notifications: {
        email: true,
        push: false,
        reminders: true
      },
      system: {
        darkMode: false,
        language: 'de',
        autoSave: true
      }
    };
  }
}

export async function updateSupabaseSettings(userId: string, settings: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings_data: settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    debug.log('✅ Settings updated in Supabase');
  } catch (error: any) {
    debug.error('❌ Failed to update settings:', error);
    throw new Error(`Failed to update settings: ${error.message}`);
  }
}

// Legacy compatibility for localStorage-based settings
let settingsCache: any = null;
let listeners = new Set<() => void>();

export function getSettings(): any {
  return settingsCache || {
    notifications: {
      email: true,
      push: false,
      reminders: true
    },
    system: {
      darkMode: false,
      language: 'de',
      autoSave: true
    }
  };
}

export async function updateSettings(updates: Partial<any>): Promise<void> {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...updates };
  
  settingsCache = newSettings;
  
  // Notify listeners
  listeners.forEach(fn => fn());
  
  // TODO: Update in Supabase when user is authenticated
  // This requires user authentication context
}

export function subscribeToSettings(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// Initialize settings from Supabase when user is available
export async function initializeSettings(userId: string): Promise<void> {
  try {
    settingsCache = await getSupabaseSettings(userId);
    listeners.forEach(fn => fn());
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}