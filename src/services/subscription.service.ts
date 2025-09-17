// ============= Static Subscription Service for Demo Mode =============
// Returns demo plan data to eliminate subscription loading errors

export type Plan = {
  name: 'Demo';
  seats: number;
  used: number;
  renewsAt?: string;
  status: 'active';
  features: string[];
};

export type SubscriptionStatus = {
  plan: 'demo';
  subscription_status: 'active';
  trial_ends_at: string | null;
  active_subs_quota: number;
  is_trial_expired: boolean;
  days_left: number;
  can_upload: boolean;
  can_invite: boolean;
};

/**
 * Returns static demo plan configuration
 * No async operations, no errors, instant response
 */
export function getPlan(): Plan {
  return {
    name: 'Demo',
    seats: 10,
    used: 1,
    renewsAt: undefined,
    status: 'active',
    features: [
      'Unbegrenzte Nachunternehmer',
      'Alle Dokumenttypen',
      'E-Mail Benachrichtigungen',
      'Compliance Dashboard',
      'Export Funktionen'
    ]
  };
}

/**
 * Returns static subscription status for demo mode
 * Compatible with existing useSubscription hook interface
 */
export function getSubscriptionStatus(): SubscriptionStatus {
  return {
    plan: 'demo',
    subscription_status: 'active',
    trial_ends_at: null,
    active_subs_quota: 10,
    is_trial_expired: false,
    days_left: 0,
    can_upload: true,
    can_invite: true
  };
}

/**
 * Mock function for subscription status refresh
 * Always resolves immediately with demo data
 */
export async function refreshSubscriptionStatus(): Promise<SubscriptionStatus> {
  // Simulate very brief delay to match expected async behavior
  await new Promise(resolve => setTimeout(resolve, 1));
  return getSubscriptionStatus();
}

/**
 * Check if current plan is demo mode
 * Used to hide subscription warnings/errors in UI
 */
export function isDemoMode(): boolean {
  return true; // Always demo mode in this service
}

/**
 * Mock function for usage limit checking
 * Always allows actions in demo mode
 */
export function checkUsageLimit(action: 'upload' | 'invite'): boolean {
  return true; // Always allow in demo mode
}

/**
 * Get current usage stats for demo mode
 */
export function getCurrentUsage(): number {
  return 1; // Static demo usage
}

/**
 * Mock function for creating checkout sessions
 * Not used in demo mode but provided for compatibility
 */
export async function createCheckoutSession(priceId: string): Promise<void> {
  console.info('[Demo Mode] Checkout session creation simulated for:', priceId);
  // No-op in demo mode
}

/**
 * Mock function for opening customer portal
 * Not used in demo mode but provided for compatibility
 */
export async function openCustomerPortal(): Promise<void> {
  console.info('[Demo Mode] Customer portal access simulated');
  // No-op in demo mode
}