-- Extend tenants table with subscription fields
ALTER TABLE public.tenants 
ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'pro', 'enterprise')),
ADD COLUMN active_subs_quota INTEGER DEFAULT 0,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete'));

-- Create subscription_events table for webhook handling
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Create policy for subscription events
CREATE POLICY "Users can view subscription events for their tenant" 
ON public.subscription_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.tenant_id = subscription_events.tenant_id 
  AND users.id = auth.uid()
));