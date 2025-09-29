const SETTINGS_KEY = 'subfix.settings.v1';

export type Settings = {
  notifications: {
    remindersEnabled: boolean;
    statusUpdatesEnabled: boolean;
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
  },
  system: {
    locale: 'de',
    demoMode: true,
  },
};

let currentSettings: Settings = { ...defaultSettings };
const listeners = new Set<() => void>();

function loadSettings(): Settings {
  // DEPRECATED: localStorage settings removed - use Supabase user_settings
  console.warn('[settings.store.ts] DEPRECATED: Use settings.supabase.ts instead');
  return { ...defaultSettings };
}

function saveSettings(settings: Settings): void {
  // DEPRECATED: localStorage settings removed - use Supabase user_settings
  console.warn('[settings.store.ts] DEPRECATED: Use settings.supabase.ts instead');
}

export function getSettings(): Settings {
  return { ...currentSettings };
}

export function updateSettings(updates: Partial<Settings>): void {
  currentSettings = {
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
  
  saveSettings(currentSettings);
  listeners.forEach(listener => listener());
}

export function subscribeToSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Initialize settings on module load
if (typeof window !== 'undefined') {
  currentSettings = loadSettings();
}