// Magic-Link Service - Supabase only (no localStorage fallbacks)
import { supabase } from '@/integrations/supabase/client';

export interface MagicLinkResult {
  token: string;
  url: string;
}

export interface ResolvedMagicLink {
  contractorId: string;
  email?: string;
  payload?: Record<string, any>;
}

// Create new magic link - Supabase only
export async function createMagicLink(contractorId: string): Promise<MagicLinkResult> {
  console.info('[magicLinks] Creating magic link for contractor:', contractorId);
  
  try {
    const { data, error } = await supabase.functions.invoke('create-magic-link', {
      body: { contractorId }
    });

    if (error) {
      console.error('[magicLinks] Backend creation error:', error);
      throw error;
    }
    
    if (data.success) {
      console.info('[magicLinks] Backend token created', { 
        contractorId, 
        token: data.token.substring(0, 8) + '...' 
      });
      
      return {
        token: data.token,
        url: getMagicLinkUrl(data.token)
      };
    } else {
      console.error('[magicLinks] Backend creation failed:', data.error);
      throw new Error(data.error || 'Failed to create magic link');
    }
    
  } catch (error) {
    console.error('[magicLinks] Backend creation failed:', error);
    throw error;
  }
}

// Resolve token to contractor info - Supabase only
export async function resolveMagicLink(token: string): Promise<ResolvedMagicLink> {
  console.info('[magicLinks] Resolving token:', token.substring(0, 8) + '...');
  
  try {
    const { data, error } = await supabase.functions.invoke('resolve-magic-link', {
      body: { token }
    });

    if (error) {
      console.error('[magicLinks] Backend resolution error:', error);
      throw new Error('Token not found or expired');
    }

    if (data.success) {
      console.info('[magicLinks] Backend token resolved', { 
        contractorId: data.contractorId
      });
      
      return {
        contractorId: data.contractorId,
        email: data.email,
        payload: data.payload
      };
    } else {
      console.info('[magicLinks] Backend resolution failed:', data.error);
      throw new Error(data.error === 'expired' ? 'Token expired' : 'Token not found');
    }
    
  } catch (error) {
    console.error('[magicLinks] Backend resolution failed:', error);
    throw error;
  }
}

// Get base URL for magic links
export function getMagicLinkBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://82c1eb4c-716d-4b6f-912f-24d7b39acd25.lovableproject.com";
}

// Generate full magic link URL
export function getMagicLinkUrl(token: string): string {
  const baseUrl = getMagicLinkBaseUrl();
  return `${baseUrl}/upload/${token}`;
}