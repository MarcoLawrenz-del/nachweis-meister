import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  getPlan, 
  getSubscriptionStatus, 
  refreshSubscriptionStatus, 
  isDemoMode,
  checkUsageLimit,
  getCurrentUsage,
  createCheckoutSession,
  openCustomerPortal,
  type SubscriptionStatus 
} from '@/services/subscription.service';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUsage, setCurrentUsage] = useState(0);

  const fetchSubscriptionStatus = async () => {
    try {
      // Use static demo service instead of Supabase
      const status = await refreshSubscriptionStatus();
      setSubscription(status);
      setCurrentUsage(getCurrentUsage());
    } catch (error) {
      // Only show error if not in demo mode
      if (!isDemoMode()) {
        console.error('Error fetching subscription:', error);
        toast.error('Fehler beim Laden der Abonnement-Informationen');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUsage = async () => {
    // Use static demo service
    setCurrentUsage(getCurrentUsage());
  };

  const handleCreateCheckoutSession = async (priceId: string) => {
    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      if (!isDemoMode()) {
        console.error('Error in payment link checkout:', error);
        toast.error('Fehler beim Öffnen des Stripe Checkout');
      }
    }
  };

  const handleOpenCustomerPortal = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      if (!isDemoMode()) {
        console.error('Error opening customer portal:', error);
        toast.error('Fehler beim Öffnen des Kundenportals');
      }
    }
  };

  const handleCheckUsageLimit = (action: 'upload' | 'invite'): boolean => {
    return checkUsageLimit(action);
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchCurrentUsage();
  }, []);

  // Refresh usage when needed
  const refreshUsage = () => {
    fetchCurrentUsage();
  };

  return {
    subscription,
    currentUsage,
    loading,
    createCheckoutSession: handleCreateCheckoutSession,
    openCustomerPortal: handleOpenCustomerPortal,
    checkUsageLimit: handleCheckUsageLimit,
    refreshSubscriptionStatus: fetchSubscriptionStatus,
    refreshUsage,
  };
}