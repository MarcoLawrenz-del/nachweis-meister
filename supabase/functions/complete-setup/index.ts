import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with service role to bypass RLS
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client to get user info
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, companyName } = await req.json();

    console.log('Starting setup for user:', user.id);

    // Create tenant using service role (bypasses RLS)
    const { data: tenant, error: tenantError } = await supabaseServiceRole
      .from('tenants')
      .insert({
        name: companyName,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      throw tenantError;
    }

    console.log('Created tenant:', tenant.id);

    // Update or create user profile using service role (bypasses RLS)
    const { error: profileError } = await supabaseServiceRole
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        name: name,
        tenant_id: tenant.id,
        role: 'owner',
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    console.log('Setup completed successfully');

    return new Response(JSON.stringify({ success: true, tenant_id: tenant.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in complete-setup function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});