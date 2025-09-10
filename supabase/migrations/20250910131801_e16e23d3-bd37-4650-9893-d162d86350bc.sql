-- Fix critical security vulnerability in subscribers table
-- The update policy currently allows any authenticated user to modify any subscription record
-- This restricts updates to only the subscription owner

DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create proper policy that restricts updates to subscription owner only
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE 
USING (user_id = auth.uid() OR email = auth.email());

-- Add comment documenting the security fix
COMMENT ON POLICY "update_own_subscription" ON public.subscribers IS 'Users can only update their own subscription records. Fixed security vulnerability that allowed any authenticated user to modify any subscription.';