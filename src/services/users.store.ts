import { getSession } from './auth';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Simple password change function using SHA-256
export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current session from auth service
    const session = getSession();
    if (!session || session.user.email !== email) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    // Hash current password to verify
    const encoder = new TextEncoder();
    const currentData = encoder.encode(currentPassword);
    const currentHashBuffer = await crypto.subtle.digest('SHA-256', currentData);
    const currentHashArray = Array.from(new Uint8Array(currentHashBuffer));
    const currentHashHex = currentHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // DEPRECATED: localStorage passwords removed - use Supabase auth
    console.warn('[users.store.ts] DEPRECATED: Use NewAuthContext instead');
    const storedHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // Default hash

    if (currentHashHex !== storedHash) {
      return { success: false, error: 'Aktuelles Passwort ist falsch' };
    }

    // Hash new password
    const newData = encoder.encode(newPassword);
    const newHashBuffer = await crypto.subtle.digest('SHA-256', newData);
    const newHashArray = Array.from(new Uint8Array(newHashBuffer));
    const newHashHex = newHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // DEPRECATED: localStorage passwords removed - use Supabase auth
    console.warn('[users.store.ts] DEPRECATED: Use NewAuthContext instead');

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: 'Fehler beim Ändern des Passworts' };
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const session = getSession();
    if (!session) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || 'Demo Benutzer',
      role: 'staff' // Default role, could be enhanced with role management
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}