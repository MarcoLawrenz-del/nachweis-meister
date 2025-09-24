import { supabase } from '@/integrations/supabase/client';

export interface MagicLinkResult {
  token: string;
  url: string;
}

export interface ResolvedMagicLink {
  contractorId: string;
  snapshot?: any[];
}

export const createMagicLink = async (
  contractorId: string, 
  requirements?: any[]
): Promise<MagicLinkResult> => {
  try {
    console.info('[magic-link]', { step: 'creating', contractorId });
    
    const { data, error } = await supabase.functions.invoke('create-magic-link', {
      body: { 
        contractorId,
        requirements 
      }
    });

    if (error) {
      console.error('[MagicLinks] Error creating magic link:', error);
      throw new Error(`Failed to create magic link: ${error.message}`);
    }

    if (!data?.token) {
      throw new Error('No token received from create-magic-link function');
    }

    const url = `${window.location.origin}/upload/${data.token}`;
    
    console.info('[magic-link]', { step: 'created', token: data.token.substring(0, 8) + '...', contractorId });
    return {
      token: data.token,
      url
    };
  } catch (error: any) {
    console.error('[MagicLinks] createMagicLink failed:', error);
    throw error;
  }
};

export const resolveMagicLink = async (token: string): Promise<ResolvedMagicLink> => {
  try {
    console.info('[magic-link]', { step: 'resolving', token: token.substring(0, 8) + '...' });
    
    const { data, error } = await supabase.functions.invoke('resolve-magic-link', {
      body: { token }
    });

    if (error) {
      console.error('[MagicLinks] Error resolving magic link:', error);
      throw new Error(`Failed to resolve magic link: ${error.message}`);
    }

    if (!data?.contractorId) {
      throw new Error('Invalid magic link response');
    }

    console.info('[magic-link]', { 
      step: 'resolved', 
      token: token.substring(0, 8) + '...', 
      contractorId: data.contractorId,
      snapshotCount: data.snapshot?.length || 0 
    });
    
    return {
      contractorId: data.contractorId,
      snapshot: data.snapshot || []
    };
  } catch (error: any) {
    console.error('[MagicLinks] resolveMagicLink failed:', error);
    throw error;
  }
};

export const getMagicLinkUrl = (token: string): string => {
  return `${window.location.origin}/upload/${token}`;
};