// Magic-Link Service für Subunternehmer-Upload
// Prod: Supabase Edge Functions, Dev: localStorage fallback

import { supabase } from '@/integrations/supabase/client';

export interface MagicLink {
  id: string;
  token: string;
  contractorId: string;
  email: string;
  expiresAt: string; // ISO
  lastSeenAt?: string;
  usedCount: number;
  createdAt: string;
}

const LS_KEY = "subfix.magic.v1";

// Check if Supabase is available
function isSupabaseAvailable(): boolean {
  return !!supabase && typeof window !== "undefined";
}

// Generate secure random token (fallback)
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Dev: localStorage operations (fallback)
function loadFromStorage(): MagicLink[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(links: MagicLink[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(links));
  } catch (e) {
    console.error("Failed to save magic links:", e);
  }
}

// Create new magic link - Backend implementation
export async function createMagicLink(
  contractorId: string, 
  email: string, 
  options?: { sendEmail?: boolean; validityDays?: number }
): Promise<string> {
  
  console.info("[magicLinks] Creating magic link", { contractorId, email });
  
  if (isSupabaseAvailable()) {
    try {
      // Use Backend Edge Function
      const { data, error } = await supabase.functions.invoke('create-magic-link', {
        body: {
          contractorId,
          email,
          sendEmail: options?.sendEmail || false,
          validityDays: options?.validityDays || 14
        }
      });

      if (error) {
        console.error("[magicLinks] Backend creation error:", error);
        throw error;
      }
      
      if (data.success) {
        console.info("[magicLinks] Backend token created", { 
          contractorId, 
          email, 
          token: data.token.substring(0, 8) + "..." 
        });
        return data.token;
      } else {
        console.error("[magicLinks] Backend creation failed:", data.error);
        throw new Error(data.error || 'Failed to create magic link');
      }
      
    } catch (error) {
      console.error("[magicLinks] Backend creation failed:", error);
      throw error;
    }
  }

  // No fallback - always use backend
  console.error("[magicLinks] Supabase not available");
  throw new Error("Backend not available");
}

// Resolve token to contractor info - Backend implementation
export async function resolveMagicLink(token: string): Promise<{
  success: true;
  contractorId: string;
  email: string;
  expiresAt: string;
} | {
  success: false;
  error: 'not_found' | 'expired';
}> {
  
  console.info("[magicLinks] Resolving token:", token.substring(0, 8) + "...");
  
  if (isSupabaseAvailable()) {
    try {
      // Use Backend Edge Function (no auth required)
      const { data, error } = await supabase.functions.invoke('resolve-magic-link', {
        body: { token }
      });

      if (error) {
        console.error("[magicLinks] Backend resolution error:", error);
        return { success: false, error: 'not_found' };
      }

      if (data.success) {
        console.info("[magicLinks] Backend token resolved", { 
          contractorId: data.contractorId, 
          email: data.email 
        });
        return {
          success: true,
          contractorId: data.contractorId,
          email: data.email,
          expiresAt: data.expiresAt
        };
      } else {
        console.info("[magicLinks] Backend resolution failed:", data.error);
        return { success: false, error: data.error };
      }
      
    } catch (error) {
      console.error("[magicLinks] Backend resolution failed:", error);
      return { success: false, error: 'not_found' };
    }
  }

  // No fallback - always use backend
  console.error("[magicLinks] Supabase not available");
  return { success: false, error: 'not_found' };
}

// Get base URL for magic links
export function getMagicLinkBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://82c1eb4c-716d-4b6f-912f-24d7b39acd25.lovableproject.com";
}

// Generate full magic link URL
export function generateMagicLinkUrl(token: string): string {
  const baseUrl = getMagicLinkBaseUrl();
  return `${baseUrl}/upload/${token}`;
}