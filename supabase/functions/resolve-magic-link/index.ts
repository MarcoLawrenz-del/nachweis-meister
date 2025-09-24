import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveMagicLinkRequest {
  token: string;
}

interface ResolveMagicLinkResponse {
  success: boolean;
  contractorId?: string;
  snapshot?: any[];
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token }: ResolveMagicLinkRequest = await req.json();

    // Validate required fields
    if (!token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.info('[resolve-magic-link] Resolving token:', token.substring(0, 8) + '...');

    // Find and validate magic link
    const { data: magicLinkData, error: dbError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .eq('revoked', false)
      .single();

    if (dbError || !magicLinkData) {
      console.error('[resolve-magic-link] Token not found:', dbError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if token is expired
    if (magicLinkData.expires_at && new Date(magicLinkData.expires_at) < new Date()) {
      console.error('[resolve-magic-link] Token expired:', magicLinkData.expires_at);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token expired' 
      }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update last_used_at
    const { error: updateError } = await supabase
      .from('magic_links')
      .update({ 
        last_used_at: new Date().toISOString(),
        used_count: (magicLinkData.used_count || 0) + 1
      })
      .eq('token', token);

    if (updateError) {
      console.error('[resolve-magic-link] Error updating last_used_at:', updateError);
    }

    // Get latest requirements snapshot
    let snapshot = null;
    try {
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('contractor_requirements')
        .select('docs')
        .eq('contractor_id', magicLinkData.contractor_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (snapshotError) {
        console.warn('[resolve-magic-link] No requirements snapshot found:', snapshotError);
      } else {
        snapshot = snapshotData?.docs || null;
        console.info('[resolve-magic-link] Found requirements snapshot with', snapshot?.length || 0, 'documents');
      }
    } catch (error) {
      console.warn('[resolve-magic-link] Error loading snapshot:', error);
    }

    const response: ResolveMagicLinkResponse = {
      success: true,
      contractorId: magicLinkData.contractor_id,
      snapshot: snapshot
    };

    console.info('[resolve-magic-link] Token resolved successfully:', { 
      contractorId: magicLinkData.contractor_id,
      hasSnapshot: !!snapshot
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[resolve-magic-link] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);