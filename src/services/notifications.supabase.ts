// ============= Supabase Notifications Service =============
// Replaces localStorage-based notifications with Supabase settings and edge functions

import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';
import { sendReminderEmail } from './email.supabase';

export interface NotificationSettings {
  remindersEnabled: boolean;
  statusUpdatesEnabled: boolean;
  missingRemindersEnabled: boolean;
  expiryWarningsEnabled: boolean;
  expiryWarnDays: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  remindersEnabled: true,
  statusUpdatesEnabled: true,
  missingRemindersEnabled: true,
  expiryWarningsEnabled: true,
  expiryWarnDays: 30,
};

// ============= Notification Settings =============

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      debug.warn('No user found, using default notification settings');
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      debug.error('Error loading notification settings:', error);
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    if (!data?.settings_data) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    const stored = data.settings_data as any;
    if (!stored || typeof stored !== 'object') {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    return {
      remindersEnabled: stored.notifications?.remindersEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.remindersEnabled,
      statusUpdatesEnabled: stored.notifications?.statusUpdatesEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.statusUpdatesEnabled,
      missingRemindersEnabled: stored.notifications?.missingRemindersEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.missingRemindersEnabled,
      expiryWarningsEnabled: stored.notifications?.expiryWarningsEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.expiryWarningsEnabled,
      expiryWarnDays: stored.notifications?.expiryWarnDays ?? DEFAULT_NOTIFICATION_SETTINGS.expiryWarnDays,
    };
  } catch (error) {
    debug.error('Failed to get notification settings:', error);
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Get current settings
    const { data: currentData } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentSettings = (typeof currentData?.settings_data === 'object' && currentData.settings_data !== null) 
      ? currentData.settings_data as Record<string, any>
      : {};
    
    const updatedSettings = {
      ...currentSettings,
      notifications: {
        ...(currentSettings.notifications || {}),
        ...settings
      }
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings_data: updatedSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      debug.error('Error saving notification settings:', error);
      return { success: false, error: error.message };
    }

    debug.log('Notification settings saved successfully');
    return { success: true };
  } catch (error) {
    debug.error('Failed to save notification settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============= Daily Notification Processing =============

export async function tickDaily(): Promise<{
  contractorsChecked: number;
  warningsSent: number;
  errors: string[];
}> {
  try {
    debug.log('🔔 Starting daily notification tick');

    const settings = await getNotificationSettings();
    
    if (!settings.expiryWarningsEnabled) {
      debug.log('⏭️ Expiry warnings disabled, skipping');
      return { contractorsChecked: 0, warningsSent: 0, errors: [] };
    }

    // Use Supabase edge function for daily processing
    const { data, error } = await supabase.functions.invoke('process-reminder-jobs', {
      body: {
        expiryWarnDays: settings.expiryWarnDays,
        remindersEnabled: settings.remindersEnabled
      }
    });

    if (error) {
      debug.error('Error in daily tick processing:', error);
      return { 
        contractorsChecked: 0, 
        warningsSent: 0, 
        errors: [error.message] 
      };
    }

    debug.log('✅ Daily notification tick completed:', data);
    return {
      contractorsChecked: data?.contractorsChecked || 0,
      warningsSent: data?.warningsSent || 0,
      errors: data?.errors || []
    };
  } catch (error) {
    debug.error('Failed daily notification tick:', error);
    return {
      contractorsChecked: 0,
      warningsSent: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// ============= Immediate Reminders =============

export async function sendImmediateReminder(params: {
  requirementId: string;
  contractorId: string;
  documentType: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-immediate-reminder', {
      body: {
        requirementId: params.requirementId,
        contractorId: params.contractorId,
        documentType: params.documentType
      }
    });

    if (error) {
      debug.error('Error sending immediate reminder:', error);
      return { success: false, error: error.message };
    }

    debug.log('Immediate reminder sent successfully:', data);
    return { success: true };
  } catch (error) {
    debug.error('Failed to send immediate reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============= Reminder Job Management =============

export async function getReminderJobs(tenantId?: string) {
  try {
    let query = supabase
      .from('reminder_jobs')
      .select(`
        *,
        requirement_id,
        requirements (
          id,
          status,
          due_date,
          document_type_id,
          project_subs (
            subcontractor_id,
            subcontractors (
              company_name,
              contact_email
            )
          )
        )
      `)
      .eq('state', 'active')
      .order('next_run_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      debug.error('Error fetching reminder jobs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    debug.error('Failed to fetch reminder jobs:', error);
    return [];
  }
}

export async function scheduleReminder(params: {
  requirementId: string;
  nextRunAt: Date;
  maxAttempts?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reminder_jobs')
      .insert({
        requirement_id: params.requirementId,
        next_run_at: params.nextRunAt.toISOString(),
        max_attempts: params.maxAttempts || 5,
        state: 'active'
      });

    if (error) {
      debug.error('Error scheduling reminder:', error);
      return { success: false, error: error.message };
    }

    debug.log('Reminder scheduled successfully:', data);
    return { success: true };
  } catch (error) {
    debug.error('Failed to schedule reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============= Backward Compatibility =============

// Legacy function names for components still using the old API
export const processReminders = tickDaily;
export const sendNotification = sendImmediateReminder;