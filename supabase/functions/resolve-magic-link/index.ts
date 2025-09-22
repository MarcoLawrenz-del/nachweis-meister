import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

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
  email?: string;
  expiresAt?: string;
  error?: 'not_found' | 'expired' | 'invalid';
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
    // Initialize Supabase client (using anon key for read access)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { token }: ResolveMagicLinkRequest = await req.json();

    // Validate required fields
    if (!token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'invalid' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.info('[resolve-magic-link] Resolving token:', token.substring(0, 8) + '...');

    // First, clean up expired tokens
    await supabase
      .from('magic_links')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Find the magic link
    const { data: magicLink, error: dbError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (dbError || !magicLink) {
      console.info('[resolve-magic-link] Token not found:', token.substring(0, 8) + '...');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'not_found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if token is expired
    const expiresAt = new Date(magicLink.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      console.info('[resolve-magic-link] Token expired:', { 
        token: token.substring(0, 8) + '...', 
        expiresAt: expiresAt.toISOString() 
      });
      
      // Delete expired token
      await supabase
        .from('magic_links')
        .delete()
        .eq('token', token);

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'expired' 
      }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update last seen timestamp and usage count
    await supabase
      .from('magic_links')
      .update({
        last_seen_at: new Date().toISOString(),
        used_count: magicLink.used_count + 1
      })
      .eq('token', token);

    console.info('[resolve-magic-link] Token resolved successfully:', {
      contractorId: magicLink.contractor_id,
      email: magicLink.email,
      usedCount: magicLink.used_count + 1
    });

    const response: ResolveMagicLinkResponse = {
      success: true,
      contractorId: magicLink.contractor_id,
      email: magicLink.email,
      expiresAt: magicLink.expires_at
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[resolve-magic-link] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'invalid' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);