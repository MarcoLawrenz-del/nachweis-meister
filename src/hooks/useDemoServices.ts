import { useLocation } from 'react-router-dom';
import { debug } from '@/lib/debug';

/**
 * Hook to disable external services in demo mode
 */
export function useDemoServices() {
  const location = useLocation();
  const isDemoMode = location.pathname.startsWith('/demo');
  
  // Mock functions that replace real service calls in demo mode
  const demoServices = {
    // Disable email sending
    sendEmail: async (...args: any[]) => {
      debug.log('📧 Demo: Email sending disabled', args);
      return { success: true, message: 'Demo mode: Email not sent' };
    },
    
    // Disable Stripe operations  
    createCheckoutSession: async (...args: any[]) => {
      debug.log('💳 Demo: Stripe disabled', args);
      return { success: false, error: 'Demo mode: Payments disabled' };
    },
    
    // Disable SSO operations
    ssoLogin: async (...args: any[]) => {
      debug.log('🔑 Demo: SSO disabled', args);
      return { success: false, error: 'Demo mode: SSO disabled' };
    },
    
    // Disable real data modifications
    saveData: async (...args: any[]) => {
      debug.log('💾 Demo: Data saving disabled', args);
      return { success: true, message: 'Demo mode: Changes not saved' };
    }
  };
  
  return {
    isDemoMode,
    services: isDemoMode ? demoServices : null
  };
}