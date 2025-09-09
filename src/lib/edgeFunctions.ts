import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { debug } from './debug';

export interface EdgeFunctionError {
  message: string;
  code?: string;
  details?: any;
}

export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: EdgeFunctionError;
}

class EdgeFunctionService {
  async invoke<T = any>(
    functionName: string, 
    payload?: any,
    options: { showToast?: boolean; retryable?: boolean } = {}
  ): Promise<EdgeFunctionResponse<T>> {
    const { showToast = true, retryable = true } = options;
    
    try {
      debug.log(`🚀 Calling edge function: ${functionName}`, payload);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        debug.error(`❌ Edge function error (${functionName}):`, error);
        
        if (showToast) {
          toast({
            title: "Fehler",
            description: `Fehler beim Aufrufen von ${functionName}: ${error.message}`,
            variant: "destructive"
          });
        }
        
        return { error: { message: error.message, details: error } };
      }
      
      debug.log(`✅ Edge function success (${functionName}):`, data);
      return { data };
      
    } catch (err: any) {
      debug.error(`💥 Edge function exception (${functionName}):`, err);
      
      if (showToast) {
        toast({
          title: "Fehler",
          description: `Unerwarteter Fehler bei ${functionName}: ${err.message}`,
          variant: "destructive"
        });
      }
      
      return { error: { message: err.message, details: err } };
    }
  }

  // Typed edge function calls
  async sendInviteEmail(payload: {
    project_sub_id: string;
    email: string; 
    token: string;
    subject: string;
    message: string;
    invited_by: string;
  }) {
    return this.invoke('send-invite-email', payload);
  }

  async createInvitation(payload: {
    project_sub_id: string;
    email: string;
    token: string; 
    subject: string;
    message: string;
    invited_by: string;
  }) {
    return this.invoke('create-invitation', payload);
  }

  async getInvitationData(payload: { token: string }) {
    return this.invoke('get-invitation-data', payload);
  }

  async createPublicDocument(payload: {
    token: string;
    file_url: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    valid_from?: string;
    valid_to?: string;
    issuer?: string;
    document_number?: string;
  }) {
    return this.invoke('create-public-document', payload);
  }

  async sendReviewNotification(payload: {
    requirement_id: string;
    action: string;
    reason?: string;
  }) {
    return this.invoke('send-review-notification', payload);
  }

  async completeSetup(payload: {
    name: string;
    companyName: string;
  }) {
    return this.invoke('complete-setup', payload);
  }
}

export const edgeFunctions = new EdgeFunctionService();