// ============= Notification Service =============
// Expiry warnings and automated notifications

import { getAllContractors } from './contractors.store';
import { getDocs } from './contractorDocs.store';
import { sendEmail } from './email';

const SETTINGS_KEY = "subfix.settings.notifications.v1";

export interface NotificationSettings {
  remindersMissing: boolean;
  statusUpdates: boolean;
  expiryWarnings: boolean;
  expiryWarningDays: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  remindersMissing: true,
  statusUpdates: true,
  expiryWarnings: true,
  expiryWarningDays: 30
};

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) } : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>) {
  if (typeof window === "undefined") return;
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch {}
}

export async function tickDaily(): Promise<{
  checked: number;
  warnings: number;
  errors: string[];
}> {
  const settings = getNotificationSettings();
  
  if (!settings.expiryWarnings) {
    return { checked: 0, warnings: 0, errors: [] };
  }
  
  const contractors = getAllContractors();
  const errors: string[] = [];
  let checked = 0;
  let warnings = 0;
  
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + (settings.expiryWarningDays * 24 * 60 * 60 * 1000));
  
  for (const contractor of contractors) {
    if (!contractor.active || !contractor.email) {
      continue;
    }
    
    checked++;
    
    const docs = getDocs(contractor.id);
    
    for (const doc of docs) {
      if (doc.status === 'accepted' && doc.validUntil) {
        const validUntilDate = new Date(doc.validUntil);
        
        // Check if document expires within warning threshold
        if (validUntilDate <= warningThreshold && validUntilDate > now) {
          const daysUntilExpiry = Math.ceil((validUntilDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          
          try {
            const result = await sendEmail('expiry_warning', {
              to: contractor.email,
              contractorName: contractor.company_name,
              customerName: 'Ihr Auftraggeber', // Could be made configurable
              contractorId: contractor.id,
              docLabel: doc.label,
              days: daysUntilExpiry
            });
            
            if (result.ok) {
              warnings++;
            } else {
              // Type guard to safely access error property  
              const errorMessage = 'error' in result ? result.error : 'Unknown error';
              errors.push(`${contractor.company_name}: ${errorMessage}`);
            }
          } catch (error) {
            errors.push(`${contractor.company_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    }
  }
  
  return { checked, warnings, errors };
}