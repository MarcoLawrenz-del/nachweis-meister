import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { stripePromise } from '@/lib/stripe';

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
      console.log('🚀 Starting Stripe client-side checkout with priceId:', priceId);
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      console.log('✅ Stripe loaded successfully');
      
      // Direct redirect to Stripe Checkout
      // This is a secure approach using Stripe's client-side integration
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        clientReferenceId: profile?.tenant_id || 'unknown',
      });

      if (error) {
        console.error('❌ Stripe checkout error:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      toast.error('Fehler beim Öffnen des Checkout. Bitte versuchen Sie es erneut.');
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