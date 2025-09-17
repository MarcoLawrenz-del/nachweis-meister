import { useLocation } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthContext';

/**
 * Hook that returns the appropriate auth context based on current route.
 * For now, just returns the main auth context since we've simplified to local auth.
 */
export function useAppAuth() {
  const location = useLocation();
  const auth = useAuthContext();
  
  // Return user as profile for backward compatibility
  return {
    ...auth,
    profile: auth.user ? {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name || auth.user.email.split('@')[0],
      tenant_id: auth.user.id, // Use user ID as tenant ID for local auth
      role: 'owner' as const // Default role for local auth - gives full permissions
    } : null
  };
}