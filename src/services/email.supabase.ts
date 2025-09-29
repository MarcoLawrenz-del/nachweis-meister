// ============= Supabase Email Service =============
// Replaces localStorage-based email management with Supabase edge functions

import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export type EmailTemplate = 
  | 'reminder'
  | 'expiry_warning'
  | 'welcome'
  | 'invitation'
  | 'status_update';

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// ============= Email Sending Functions =============

export async function sendEmail(params: {
  to: string;
  subject: string;
  template: EmailTemplate;
  data?: Record<string, any>;
  tenantId?: string;
}): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.to,
        subject: params.subject,
        template: params.template,
        templateData: params.data || {},
        tenantId: params.tenantId
      }
    });

    if (error) {
      debug.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    debug.log('Email sent successfully:', data);
    return { success: true, messageId: data?.messageId };
  } catch (error) {
    debug.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendMagicInvitation(params: {
  contractorId: string;
  email: string;
  subject: string;
  message: string;
  companyName?: string;
  tenantId?: string;
}): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-invite-email', {
      body: {
        contractorId: params.contractorId,
        email: params.email,
        subject: params.subject,
        message: params.message,
        companyName: params.companyName,
        tenantId: params.tenantId
      }
    });

    if (error) {
      debug.error('Error sending magic invitation:', error);
      return { success: false, error: error.message };
    }

    debug.log('Magic invitation sent successfully:', data);
    return { success: true, messageId: data?.messageId };
  } catch (error) {
    debug.error('Failed to send magic invitation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendReminderEmail(params: {
  requirementId: string;
  contractorEmail: string;
  contractorName: string;
  documentType: string;
  dueDate?: string;
  tenantId?: string;
}): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-reminder-email', {
      body: {
        requirementId: params.requirementId,
        contractorEmail: params.contractorEmail,
        contractorName: params.contractorName,
        documentType: params.documentType,
        dueDate: params.dueDate,
        tenantId: params.tenantId
      }
    });

    if (error) {
      debug.error('Error sending reminder email:', error);
      return { success: false, error: error.message };
    }

    debug.log('Reminder email sent successfully:', data);
    return { success: true, messageId: data?.messageId };
  } catch (error) {
    debug.error('Failed to send reminder email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendReviewNotification(params: {
  requirementId: string;
  reviewerEmail: string;
  contractorName: string;
  documentType: string;
  action: 'approved' | 'rejected' | 'assigned';
  tenantId?: string;
}): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-review-notification', {
      body: {
        requirementId: params.requirementId,
        reviewerEmail: params.reviewerEmail,
        contractorName: params.contractorName,
        documentType: params.documentType,
        action: params.action,
        tenantId: params.tenantId
      }
    });

    if (error) {
      debug.error('Error sending review notification:', error);
      return { success: false, error: error.message };
    }

    debug.log('Review notification sent successfully:', data);
    return { success: true, messageId: data?.messageId };
  } catch (error) {
    debug.error('Failed to send review notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============= Email Log Management =============

export async function getEmailLogs(params?: {
  tenantId?: string;
  subcontractorId?: string;
  status?: 'queued' | 'sent' | 'failed';
  limit?: number;
}) {
  try {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.tenantId) {
      query = query.eq('tenant_id', params.tenantId);
    }
    if (params?.subcontractorId) {
      query = query.eq('subcontractor_id', params.subcontractorId);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      debug.error('Error fetching email logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    debug.error('Failed to fetch email logs:', error);
    return [];
  }
}

// ============= Error Handling =============

export function getEmailErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'Unbekannter Fehler beim E-Mail-Versand';
}

// ============= Rate Limiting =============

export async function checkEmailRateLimit(email: string): Promise<{ allowed: boolean; resetAt?: Date }> {
  try {
    // Rate limiting is now handled by edge functions
    // This is just a client-side check
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentEmails = await getEmailLogs({
      limit: 100
    });

    const recentToEmail = recentEmails.filter(log => 
      log.to_email === email && 
      new Date(log.created_at) > hourAgo
    );

    // Allow up to 10 emails per hour per recipient
    const allowed = recentToEmail.length < 10;
    const resetAt = allowed ? undefined : new Date(now.getTime() + 60 * 60 * 1000);

    return { allowed, resetAt };
  } catch (error) {
    debug.error('Failed to check email rate limit:', error);
    return { allowed: true }; // Fail open
  }
}

// ============= Backward Compatibility =============

// Legacy function names for backward compatibility
export const sendContractorEmail = sendEmail;
export const sendStatusUpdateEmail = sendReviewNotification;
export const checkRateLimit = checkEmailRateLimit;