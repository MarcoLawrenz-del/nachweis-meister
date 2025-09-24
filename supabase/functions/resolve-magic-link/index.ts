import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveMagicLinkRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: ResolveMagicLinkRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'token is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find and validate magic link
    const { data: linkData, error: linkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (linkError || !linkData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Update last seen and increment usage
    await supabase
      .from('magic_links')
      .update({
        last_seen_at: new Date().toISOString(),
        used_count: linkData.used_count + 1
      })
      .eq('token', token);

    // Fetch latest requirements snapshot
    const { data: snapshotData } = await supabase
      .from('contractor_requirements')
      .select('*')
      .eq('contractor_id', linkData.contractor_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const snapshot = snapshotData?.docs || [];

    console.info('[magic-link]', { 
      step: 'resolved', 
      token: token.substring(0, 8) + '...', 
      contractorId: linkData.contractor_id,
      snapshotCount: snapshot.length 
    });

    return new Response(
      JSON.stringify({ 
        contractorId: linkData.contractor_id,
        email: linkData.email,
        snapshot: snapshot
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in resolve-magic-link function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);