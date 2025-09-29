// ============= Notification Service =============
// Expiry warnings and automated notifications

import { listContractors } from './contractors.store';
import { getDocs } from './contractorDocs.store';
import { sendEmail } from './email';
import { isErr } from '@/utils/result';

const SETTINGS_KEY = "subfix.settings.notifications.v1";

export interface NotificationSettings {
  missingRemindersEnabled: boolean;
  statusUpdatesEnabled: boolean;
  expiryWarningsEnabled: boolean;
  expiryWarnDays: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  missingRemindersEnabled: true,
  statusUpdatesEnabled: true,
  expiryWarningsEnabled: true,
  expiryWarnDays: 30
};

export function getNotificationSettings(): NotificationSettings {
  // DEPRECATED: localStorage notifications removed - use Supabase user_settings
  console.warn('[notifications.ts] DEPRECATED: Use notifications.supabase.ts instead');
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>) {
  // DEPRECATED: localStorage notifications removed - use Supabase user_settings
  console.warn('[notifications.ts] DEPRECATED: Use notifications.supabase.ts instead');
}

export async function tickDaily(): Promise<{
  checked: number;
  warnings: number;
  errors: string[];
}> {
  const settings = getNotificationSettings();
  
  if (!settings.expiryWarningsEnabled) {
    return { checked: 0, warnings: 0, errors: [] };
  }
  
  const contractors = listContractors();
  const errors: string[] = [];
  let checked = 0;
  let warnings = 0;
  
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + (settings.expiryWarnDays * 24 * 60 * 60 * 1000));
  
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
            
            if (!isErr(result)) {
              warnings++;
            } else {
              errors.push(`${contractor.company_name}: ${result.error}`);
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