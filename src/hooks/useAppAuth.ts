import { useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDemoAuthContext } from '@/contexts/DemoContext';

/**
 * Hook that returns the appropriate auth context based on current route.
 * Uses demo context when in /demo routes, real auth context otherwise.
 */
export function useAppAuth() {
  const location = useLocation();
  const realAuth = useAuthContext();
  const demoAuth = useDemoAuthContext();
  
  const isDemo = location.pathname.startsWith('/demo');
  
  return isDemo ? demoAuth : realAuth;
}