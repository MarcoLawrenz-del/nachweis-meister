import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🎯 PAYMENT-CREATE function called");
  
  if (req.method === "OPTIONS") {
    console.log("🎯 CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🎯 Starting payment creation");
    
    // Get environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.log("🎯 ERROR: No Stripe key");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    console.log("🎯 Stripe key found");

    // Parse request
    const { priceId } = await req.json();
    console.log("🎯 Request parsed, priceId:", priceId);
    
    if (!priceId) {
      throw new Error("Price ID is required");
    }

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("🎯 ERROR: No auth header");
      throw new Error("No authorization header");
    }
    console.log("🎯 Auth header found");

    // Create supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    console.log("🎯 Supabase client created");

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      console.log("🎯 ERROR: Auth failed", { userError });
      throw new Error("Authentication failed");
    }
    console.log("🎯 User authenticated:", userData.user.email);

    // Get user tenant directly from database using service role
    const { data: userRecord, error: userRecordError } = await supabaseClient
      .from("users")
      .select("tenant_id")
      .eq("id", userData.user.id)
      .single();

    console.log("🎯 User record lookup result:", { userRecord, userRecordError });
    
    if (userRecordError || !userRecord?.tenant_id) {
      throw new Error("User not found in database");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    console.log("🎯 Stripe initialized");

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userData.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin") || "http://localhost:3000"}/dashboard?success=true`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/pricing?canceled=true`,
      metadata: {
        tenant_id: userRecord.tenant_id,
        user_id: userData.user.id,
      }
    });
    
    console.log("🎯 Checkout session created:", session.id);
    console.log("🎯 Session URL:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("🎯 ERROR occurred:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});