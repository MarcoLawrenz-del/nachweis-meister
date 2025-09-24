import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMagicLinkRequest {
  contractorId: string;
  email?: string;
  requirements?: any[]; // Requirements snapshot to store
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractorId, email, requirements }: CreateMagicLinkRequest = await req.json();

    if (!contractorId) {
      return new Response(
        JSON.stringify({ error: 'contractorId is required' }),
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

    // Generate secure token (48 chars hex)
    const token = crypto.randomUUID().replace(/-/g, '') + 
                  crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // Store/update requirements snapshot if provided
    if (requirements && requirements.length > 0) {
      console.info('[create-magic-link] Storing requirements snapshot:', requirements.length, 'documents');
      
      const { error: snapshotError } = await supabase
        .from('contractor_requirements')
        .upsert({
          contractor_id: contractorId,
          docs: requirements
        });

      if (snapshotError) {
        console.error('Error storing requirements snapshot:', snapshotError);
        return new Response(
          JSON.stringify({ error: 'Failed to store requirements snapshot' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    // Store in magic_links table
    const { error: linkError } = await supabase
      .from('magic_links')
      .upsert({
        token,
        contractor_id: contractorId,
        email: email || `contractor-${contractorId}@placeholder.com`,
        created_by: null,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        used_count: 0
      });

    if (linkError) {
      console.error('Error creating magic link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to create magic link' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.info('[magic-link]', { step: 'created', token: token.substring(0, 8) + '...', contractorId });

    return new Response(
      JSON.stringify({ token }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in create-magic-link function:', error);
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