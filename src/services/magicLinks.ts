// Magic-Link Service für Subunternehmer-Upload
// Prod: Supabase-basiert, Dev: localStorage

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

// Generate secure random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Dev: localStorage operations
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

// Create new magic link
export async function createMagicLink(contractorId: string, email: string): Promise<string> {
  const token = generateToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days
  
  const magicLink: MagicLink = {
    id: crypto.randomUUID(),
    token,
    contractorId,
    email,
    expiresAt,
    usedCount: 0,
    createdAt: now
  };

  // For now, use localStorage (later extend with Supabase)
  const links = loadFromStorage();
  links.push(magicLink);
  saveToStorage(links);

  console.info("[magicLinks] Created token", { contractorId, email, token: token.substring(0, 8) + "..." });
  return token;
}

// Resolve token to contractor info
export async function resolveMagicLink(token: string): Promise<{
  success: true;
  contractorId: string;
  email: string;
  expiresAt: string;
} | {
  success: false;
  error: 'not_found' | 'expired';
}> {
  const links = loadFromStorage();
  const link = links.find(l => l.token === token);
  
  if (!link) {
    return { success: false, error: 'not_found' };
  }
  
  if (new Date(link.expiresAt) <= new Date()) {
    return { success: false, error: 'expired' };
  }
  
  // Update usage stats
  link.lastSeenAt = new Date().toISOString();
  link.usedCount++;
  saveToStorage(links);
  
  return {
    success: true,
    contractorId: link.contractorId,
    email: link.email,
    expiresAt: link.expiresAt
  };
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
  return `${baseUrl}/u/${token}`;
}