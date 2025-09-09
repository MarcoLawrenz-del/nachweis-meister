import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🔥 SIMPLE TEST - Edge Function called!");
  
  if (req.method === "OPTIONS") {
    console.log("🔥 CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔥 Starting simple test");
    
    // Parse request body
    const body = await req.json();
    console.log("🔥 Request body:", body);
    
    return new Response(JSON.stringify({ 
      message: "Test successful", 
      receivedPriceId: body.priceId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("🔥 ERROR:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Unknown error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});