// ============= NEW Supabase Settings Service =============
// Replaces localStorage-based settings management

import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export type Settings = {
  notifications: {
    remindersEnabled: boolean;
    statusUpdatesEnabled: boolean;
    missingRemindersEnabled: boolean;
    expiryWarningsEnabled: boolean;
    expiryWarnDays: number;
  };
  system: {
    locale: 'de';
    demoMode: boolean;
  };
};

const defaultSettings: Settings = {
  notifications: {
    remindersEnabled: true,
    statusUpdatesEnabled: true,
    missingRemindersEnabled: true,
    expiryWarningsEnabled: true,
    expiryWarnDays: 30,
  },
  system: {
    locale: 'de',
    demoMode: true,
  },
};

let currentSettings: Settings = { ...defaultSettings };
const listeners = new Set<() => void>();

// ============= Supabase Operations =============

export async function loadUserSettings(): Promise<Settings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      debug.warn('No user found, using default settings');
      return { ...defaultSettings };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      debug.error('Error loading user settings:', error);
      return { ...defaultSettings };
    }

    if (!data?.settings_data) {
      debug.log('No settings found, using defaults');
      return { ...defaultSettings };
    }

    // Validate and merge with defaults
    const stored = data.settings_data as any;
    const settings: Settings = {
      notifications: {
        remindersEnabled: stored.notifications?.remindersEnabled ?? defaultSettings.notifications.remindersEnabled,
        statusUpdatesEnabled: stored.notifications?.statusUpdatesEnabled ?? defaultSettings.notifications.statusUpdatesEnabled,
        missingRemindersEnabled: stored.notifications?.missingRemindersEnabled ?? defaultSettings.notifications.missingRemindersEnabled,
        expiryWarningsEnabled: stored.notifications?.expiryWarningsEnabled ?? defaultSettings.notifications.expiryWarningsEnabled,
        expiryWarnDays: stored.notifications?.expiryWarnDays ?? defaultSettings.notifications.expiryWarnDays,
      },
      system: {
        locale: stored.system?.locale ?? defaultSettings.system.locale,
        demoMode: stored.system?.demoMode ?? defaultSettings.system.demoMode,
      }
    };

    currentSettings = settings;
    debug.log('Settings loaded from Supabase:', settings);
    return settings;
  } catch (error) {
    debug.error('Failed to load settings:', error);
    return { ...defaultSettings };
  }
}

export async function saveUserSettings(settings: Settings): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings_data: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      debug.error('Error saving user settings:', error);
      return { success: false, error: error.message };
    }

    currentSettings = { ...settings };
    debug.log('Settings saved to Supabase:', settings);
    return { success: true };
  } catch (error) {
    debug.error('Failed to save settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============= Public API =============

export function getSettings(): Settings {
  return { ...currentSettings };
}

export async function updateSettings(updates: Partial<Settings>): Promise<{ success: boolean; error?: string }> {
  const newSettings: Settings = {
    ...currentSettings,
    ...updates,
    notifications: {
      ...currentSettings.notifications,
      ...(updates.notifications || {})
    },
    system: {
      ...currentSettings.system,
      ...(updates.system || {})
    }
  };

  const result = await saveUserSettings(newSettings);
  
  if (result.success) {
    // Notify listeners
    listeners.forEach(listener => listener());
  }
  
  return result;
}

export function subscribeToSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ============= Initialization =============

export async function initializeSettings(): Promise<Settings> {
  const settings = await loadUserSettings();
  currentSettings = settings;
  return settings;
}

// Backward compatibility with notification settings
export type NotificationSettings = Settings['notifications'];

export function getNotificationSettings(): NotificationSettings {
  return currentSettings.notifications;
}

export async function saveNotificationSettings(notificationSettings: NotificationSettings): Promise<{ success: boolean; error?: string }> {
  return updateSettings({ notifications: notificationSettings });
}