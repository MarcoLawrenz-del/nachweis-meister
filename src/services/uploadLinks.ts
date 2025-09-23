// ============= Magic Link Management =============
// localStorage-based upload token system

const LS_KEY = "subfix.uploadTokens.v1";

interface UploadToken {
  contractorId: string;
  createdAtISO: string;
  lastUsedISO?: string;
}

function getTokenStore(): Record<string, UploadToken> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(LS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveTokenStore(store: Record<string, UploadToken>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {}
}

function generateToken(): string {
  // Generate a secure-looking token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createUploadToken(contractorId: string): { token: string; url: string } {
  const store = getTokenStore();
  
  // Check if token already exists for this contractor
  const existingToken = Object.entries(store).find(([_, data]) => data.contractorId === contractorId);
  
  let token: string;
  if (existingToken) {
    token = existingToken[0];
  } else {
    // Create new token
    token = generateToken();
    store[token] = {
      contractorId,
      createdAtISO: new Date().toISOString()
    };
    saveTokenStore(store);
  }
  
  const url = `${window.location.origin}/upload/${token}`;
  return { token, url };
}

export function resolveUploadToken(token: string): { contractorId: string } | null {
  const store = getTokenStore();
  const tokenData = store[token];
  
  if (!tokenData) {
    return null;
  }
  
  // Update last used timestamp
  tokenData.lastUsedISO = new Date().toISOString();
  store[token] = tokenData;
  saveTokenStore(store);
  
  return { contractorId: tokenData.contractorId };
}

export function getAllUploadTokens(): Array<{ token: string; contractorId: string; createdAt: string; lastUsed?: string }> {
  const store = getTokenStore();
  return Object.entries(store).map(([token, data]) => ({
    token,
    contractorId: data.contractorId,
    createdAt: data.createdAtISO,
    lastUsed: data.lastUsedISO
  }));
}