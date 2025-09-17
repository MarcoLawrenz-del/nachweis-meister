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
  if (typeof window === 'undefined') return { ...defaultSettings };
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Defensive merge with validation
      return {
        notifications: {
          remindersEnabled: parsed.notifications?.remindersEnabled ?? defaultSettings.notifications.remindersEnabled,
          statusUpdatesEnabled: parsed.notifications?.statusUpdatesEnabled ?? defaultSettings.notifications.statusUpdatesEnabled,
        },
        system: {
          locale: parsed.system?.locale ?? defaultSettings.system.locale,
          demoMode: parsed.system?.demoMode ?? defaultSettings.system.demoMode,
        }
      };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  
  return { ...defaultSettings };
}

function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
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