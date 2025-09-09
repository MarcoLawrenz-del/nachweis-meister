import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Stripe Payment Links - Live Mode
const STRIPE_PAYMENT_LINKS = {
  starter: "https://buy.stripe.com/cNi00c8wV50i8Wq4zB6AM02",
  growth: "https://buy.stripe.com/9B6cMY28xboGb4y7LN6AM01",   
  pro: "https://buy.stripe.com/aFaeV63cB3We7Sm9TV6AM00"
};

const PRICE_TO_PAYMENT_LINK = {
  "price_1S5Olj1U5YNMmnrGFgjjYEdM": STRIPE_PAYMENT_LINKS.starter,
  "price_1S5OnJ1U5YNMmnrGljX4feMn": STRIPE_PAYMENT_LINKS.growth,
  "price_1S5Onm1U5YNMmnrG04D1BaX2": STRIPE_PAYMENT_LINKS.pro,
};

export interface SubscriptionStatus {
  plan: 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  trial_ends_at: string | null;
  active_subs_quota: number;
  is_trial_expired: boolean;
  days_left: number;
  can_upload: boolean;
  can_invite: boolean;
}

export function useSubscription() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUsage, setCurrentUsage] = useState(0);

  const fetchSubscriptionStatus = async () => {
    if (!profile?.tenant_id) return;

    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('plan, subscription_status, trial_ends_at, active_subs_quota')
        .eq('id', profile.tenant_id)
        .single();

      if (error) throw error;

      const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
      const now = new Date();
      const isTrialExpired = trialEndsAt ? now > trialEndsAt : false;
      const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      // Check if user can perform actions (upload/invite)
      const canPerformActions = tenant.subscription_status === 'active' || !isTrialExpired;

      setSubscription({
        plan: tenant.plan as 'free' | 'starter' | 'growth' | 'pro' | 'enterprise',
        subscription_status: tenant.subscription_status as 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete',
        trial_ends_at: tenant.trial_ends_at,
        active_subs_quota: tenant.active_subs_quota,
        is_trial_expired: isTrialExpired,
        days_left: daysLeft,
        can_upload: canPerformActions,
        can_invite: canPerformActions,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Fehler beim Laden der Abonnement-Informationen');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUsage = async () => {
    if (!profile?.tenant_id) return;

    try {
      // Count active subcontractors (global active + active engagements)
      const { data: activeGlobalSubs } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'active');

      const { data: activeEngagements } = await supabase
        .from('project_subs')
        .select('subcontractor_id, projects!inner(tenant_id)')
        .eq('projects.tenant_id', profile.tenant_id)
        .eq('status', 'active')
        .or('end_at.is.null,end_at.gt.now()');

      // Combine and deduplicate
      const activeSubIds = new Set([
        ...(activeGlobalSubs || []).map(s => s.id),
        ...(activeEngagements || []).map(e => e.subcontractor_id)
      ]);

      setCurrentUsage(activeSubIds.size);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      console.log('🚀 Starting Stripe Payment Link checkout with priceId:', priceId);
      console.log('👤 Current profile:', profile);
      console.log('🏢 Tenant ID:', profile?.tenant_id);
      
      if (!profile?.tenant_id) {
        console.error('❌ Missing profile or tenant_id:', { profile, tenantId: profile?.tenant_id });
        toast.error('Benutzer-Informationen nicht gefunden. Bitte loggen Sie sich erneut ein.');
        return;
      }

      console.log('✅ Profile found:', { tenantId: profile.tenant_id });
      
      const paymentLink = PRICE_TO_PAYMENT_LINK[priceId as keyof typeof PRICE_TO_PAYMENT_LINK];
      
      if (!paymentLink) {
        console.error('❌ No payment link found for priceId:', priceId);
        toast.error('Payment Link für diesen Plan nicht gefunden');
        return;
      }
      
      console.log('✅ Opening direct Stripe Payment Link:', paymentLink);
      toast.success('Weiterleitung zu Stripe Checkout...');
      
      // Open Stripe Payment Link in new tab (better for security)
      window.open(paymentLink, '_blank');
      
    } catch (error) {
      console.error('❌ Error in payment link checkout:', error);
      toast.error('Fehler beim Öffnen des Stripe Checkout');
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Fehler beim Öffnen des Kundenportals');
    }
  };

  const checkUsageLimit = (action: 'upload' | 'invite'): boolean => {
    if (!subscription) return false;
    
    if (subscription.is_trial_expired && subscription.subscription_status !== 'active') {
      toast.error(`${action === 'upload' ? 'Upload' : 'Einladung'} gesperrt. Bitte aktivieren Sie einen Plan.`);
      return false;
    }

    if (subscription.subscription_status === 'active' && currentUsage >= subscription.active_subs_quota) {
      toast.error(`Limit erreicht (${currentUsage}/${subscription.active_subs_quota}). Bitte upgraden Sie Ihren Plan.`);
      return false;
    }

    return true;
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchCurrentUsage();
  }, [profile?.tenant_id]);

  // Refresh usage when needed
  const refreshUsage = () => {
    fetchCurrentUsage();
  };

  return {
    subscription,
    currentUsage,
    loading,
    createCheckoutSession,
    openCustomerPortal,
    checkUsageLimit,
    refreshSubscriptionStatus: fetchSubscriptionStatus,
    refreshUsage,
  };
}