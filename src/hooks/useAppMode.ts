import { useLocation } from 'react-router-dom';

/**
 * Determines if the app is running in demo mode or production mode
 */
export function useAppMode() {
  const location = useLocation();
  
  // Demo mode is determined by URL path
  const isDemo = location.pathname.startsWith('/demo') || 
                 location.pathname.startsWith('/public-demo') ||
                 location.pathname.includes('demo');
  
  return {
    isDemo,
    isProduction: !isDemo
  };
}