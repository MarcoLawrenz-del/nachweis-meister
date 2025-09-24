import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMagicLinkRequest {
  contractorId: string;
  requirements?: any[]; // Optional requirements snapshot to store
}

interface CreateMagicLinkResponse {
  success: boolean;
  token?: string;
  magicLink?: string;
  expiresAt?: string;
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

    const { contractorId, requirements }: CreateMagicLinkRequest = await req.json();

    // Validate required fields
    if (!contractorId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'contractorId is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate secure token (40-64 hex characters)
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    
    // Calculate expiration date (14 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    console.info('[create-magic-link] Generating token for contractor:', contractorId);

    // Store magic link in database
    const { data: magicLinkData, error: dbError } = await supabase
      .from('magic_links')
      .insert({
        token,
        contractor_id: contractorId,
        expires_at: expiresAt.toISOString(),
        revoked: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('[create-magic-link] Database error:', dbError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create magic link' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.info('[create-magic-link] Magic link created successfully:', { token: token.substring(0, 8) + '...', contractorId });

    // Store requirements snapshot if provided
    if (requirements && requirements.length > 0) {
      console.info('[create-magic-link] Storing requirements snapshot:', requirements.length, 'documents');
      
      const { error: snapshotError } = await supabase
        .from('contractor_requirements')
        .upsert({
          contractor_id: contractorId,
          docs: requirements,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'contractor_id'
        });

      if (snapshotError) {
        console.error('[create-magic-link] Error storing requirements snapshot:', snapshotError);
        // Don't fail the request if snapshot storage fails
      } else {
        console.info('[create-magic-link] Requirements snapshot stored successfully');
      }
    }

    const response: CreateMagicLinkResponse = {
      success: true,
      token
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[create-magic-link] Unexpected error:', error);
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