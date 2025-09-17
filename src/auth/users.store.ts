// ============= Local User Store =============
// localStorage-based user management with hashed passwords

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

const LS_KEY = "subfix.users.v1";

// SHA-256 hash with fallback for demo
export async function sha256Base64(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return btoa(String.fromCharCode.apply(null, hashArray));
    } catch {
      // Fallback for demo environments
      return btoa(text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }
  }
  // Simple fallback hash for demo
  return btoa(text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

// Get all users from localStorage
function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save users to localStorage
function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(users));
}

// Initialize demo user on first run
async function initializeDemoUser(): Promise<void> {
  const users = getUsers();
  const demoExists = users.some(u => u.email === "demo@subfix.app");
  
  if (!demoExists) {
    const passwordHash = await sha256Base64("Subfix!2024");
    const demoUser: User = {
      id: "demo-user-id",
      email: "demo@subfix.app",
      name: "Demo Admin",
      passwordHash,
      createdAt: new Date().toISOString()
    };
    users.push(demoUser);
    saveUsers(users);
  }
}

// Initialize on module load
initializeDemoUser();

export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function verifyPassword(email: string, password: string): Promise<{ ok: boolean; user?: { id: string; email: string; name: string } }> {
  const user = getUserByEmail(email);
  if (!user) {
    return { ok: false };
  }
  
  const inputHash = await sha256Base64(password);
  if (inputHash === user.passwordHash) {
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }
  
  return { ok: false };
}

export async function createUser({ email, name, password }: { email: string; name: string; password: string }): Promise<{ id: string }> {
  const users = getUsers();
  
  // Check if user already exists
  if (getUserByEmail(email)) {
    throw new Error("Benutzer mit dieser E-Mail existiert bereits");
  }
  
  const passwordHash = await sha256Base64(password);
  const newUser: User = {
    id: crypto?.randomUUID?.() ?? `user-${Date.now()}`,
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  return { id: newUser.id };
}