// ============= Upload Links Migration Placeholder =============
// This service has been replaced by Supabase magic links system

import { debug } from '@/lib/debug';

export interface UploadToken {
  token: string;
  contractorId: string;
  createdAt: string;
  lastUsed?: string;
}

// Legacy compatibility functions - redirect to Supabase
export function createUploadToken(contractorId: string): { token: string; url: string } {
  debug.warn('createUploadToken: Use Supabase magic links instead');
  const token = generateToken();
  return {
    token,
    url: `/public-upload?token=${token}`
  };
}

export function resolveUploadToken(token: string): { contractorId: string } | null {
  debug.warn('resolveUploadToken: Use Supabase magic links instead');
  // Fallback for demo - just return a demo contractor ID
  return { contractorId: 'demo-contractor-1' };
}

export function getAllUploadTokens(): UploadToken[] {
  debug.warn('getAllUploadTokens: Use Supabase magic links instead');
  return [];
}

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 32);
}

// Backward compatibility exports
export { createUploadToken as createToken };
export { resolveUploadToken as resolveToken };