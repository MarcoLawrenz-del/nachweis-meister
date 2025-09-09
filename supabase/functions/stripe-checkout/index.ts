import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile with SERVICE_ROLE_KEY (bypasses RLS)
    logStep("Looking up user profile", { userId: user.id });
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    logStep("User profile result", { userProfile, profileError });
    if (profileError || !userProfile?.tenant_id) {
      throw new Error(`User profile not found: ${profileError?.message || 'No profile'}`);
    }

    // Get tenant info 
    logStep("Looking up tenant", { tenantId: userProfile.tenant_id });
    const { data: tenant, error: tenantError } = await supabaseClient
      .from("tenants")
      .select("id, name, stripe_customer_id, plan, subscription_status")
      .eq("id", userProfile.tenant_id)
      .single();

    logStep("Tenant result", { tenant, tenantError });
    if (tenantError || !tenant) {
      throw new Error(`Tenant not found: ${tenantError?.message || 'No tenant'}`);
    }

    logStep("Retrieved tenant info", { tenantId: tenant.id, currentPlan: tenant.plan });

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    let customerId = tenant.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Update tenant with customer ID
        await supabaseClient
          .from("tenants")
          .update({ stripe_customer_id: customerId })
          .eq("id", tenant.id);
      }
    }

    logStep("Creating checkout session", { customerId, priceId });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        tenant_id: tenant.id,
        user_id: user.id,
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});