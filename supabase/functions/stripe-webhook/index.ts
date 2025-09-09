import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const PLAN_QUOTAS = {
  starter: 10,
  growth: 50,
  pro: 200,
  enterprise: 999999
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) throw new Error("No Stripe signature found");

    // Verify webhook signature (webhook endpoint secret would be configured in Stripe)
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    logStep("Event type", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenant_id;
        
        if (!tenantId) {
          logStep("No tenant_id in session metadata");
          break;
        }

        // Get subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;
          
          // Determine plan from price ID
          let plan = 'starter';
          if (priceId?.includes('growth')) plan = 'growth';
          else if (priceId?.includes('pro')) plan = 'pro';
          else if (priceId?.includes('enterprise')) plan = 'enterprise';

          const quota = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS];

          logStep("Updating tenant subscription", { tenantId, plan, quota });

          await supabaseClient
            .from("tenants")
            .update({
              plan,
              active_subs_quota: quota,
              subscription_status: 'active',
              stripe_customer_id: session.customer as string,
            })
            .eq("id", tenantId);
        }
        
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find tenant by customer ID
        const { data: tenant } = await supabaseClient
          .from("tenants")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!tenant) {
          logStep("No tenant found for customer", { customerId });
          break;
        }

        let plan = 'free';
        let quota = 0;
        let status = 'canceled';

        if (event.type === "customer.subscription.updated" && subscription.status === 'active') {
          const priceId = subscription.items.data[0]?.price.id;
          
          if (priceId?.includes('starter')) { plan = 'starter'; quota = 10; }
          else if (priceId?.includes('growth')) { plan = 'growth'; quota = 50; }
          else if (priceId?.includes('pro')) { plan = 'pro'; quota = 200; }
          else if (priceId?.includes('enterprise')) { plan = 'enterprise'; quota = 999999; }
          
          status = 'active';
        }

        logStep("Updating tenant from subscription change", { tenantId: tenant.id, plan, quota, status });

        await supabaseClient
          .from("tenants")
          .update({
            plan,
            active_subs_quota: quota,
            subscription_status: status,
          })
          .eq("id", tenant.id);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: tenant } = await supabaseClient
          .from("tenants")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (tenant) {
          await supabaseClient
            .from("tenants")
            .update({ subscription_status: 'past_due' })
            .eq("id", tenant.id);
        }
        break;
      }
    }

    // Log the event
    const tenantId = event.data.object.metadata?.tenant_id || 
                     (await supabaseClient
                       .from("tenants")
                       .select("id")
                       .eq("stripe_customer_id", (event.data.object as any).customer)
                       .single())?.data?.id;

    if (tenantId) {
      await supabaseClient
        .from("subscription_events")
        .insert({
          tenant_id: tenantId,
          stripe_event_id: event.id,
          event_type: event.type,
          data: event.data.object,
        });
    }

    logStep("Webhook processed successfully");

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});