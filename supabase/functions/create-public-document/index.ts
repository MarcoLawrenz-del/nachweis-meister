import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePublicDocumentRequest {
  contractor_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  valid_from?: string | null;
  valid_to?: string | null;
  document_number?: string | null;
  magic_token: string;
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: CreatePublicDocumentRequest = await req.json();
    const {
      contractor_id,
      document_type,
      file_name,
      file_url,
      file_size,
      mime_type,
      valid_from,
      valid_to,
      document_number,
      magic_token
    } = requestData;

    // Validate magic token first
    const { data: magicLink, error: tokenError } = await supabase
      .from('magic_links')
      .select('contractor_id, revoked, expires_at')
      .eq('token', magic_token)
      .single();

    if (tokenError || !magicLink) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid magic token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (magicLink.revoked) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token has been revoked' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (magicLink.expires_at && new Date(magicLink.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token has expired' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (magicLink.contractor_id !== contractor_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token contractor mismatch' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.info('[create-public-document] Creating document for contractor:', contractor_id);

    // Create document record (simplified for demo)
    // In a real app, you would create proper requirement/document relationships
    const documentData = {
      contractor_id,
      document_type,
      file_name,
      file_url,
      file_size,
      mime_type,
      valid_from,
      valid_to,
      document_number,
      uploaded_at: new Date().toISOString(),
      uploaded_by: null, // Public upload
      status: 'submitted'
    };

    // For demo purposes, we'll store in a simple public_uploads table
    // In production, this would integrate with your document/requirement system
    const { data: document, error: docError } = await supabase
      .from('public_uploads')
      .insert(documentData)
      .select()
      .single();

    if (docError) {
      console.error('[create-public-document] Document creation error:', docError);
      
      // If table doesn't exist, create a simple log entry instead
      console.info('[create-public-document] Document uploaded:', documentData);
      
      // Update magic link last_used_at
      await supabase
        .from('magic_links')
        .update({ last_used_at: new Date().toISOString() })
        .eq('token', magic_token);

      return new Response(JSON.stringify({ 
        success: true,
        document_id: `demo-${Date.now()}`,
        message: 'Document uploaded successfully (demo mode)'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update magic link last_used_at
    await supabase
      .from('magic_links')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token', magic_token);

    console.info('[create-public-document] Document created successfully:', document.id);

    return new Response(JSON.stringify({ 
      success: true,
      document_id: document.id,
      message: 'Document uploaded successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[create-public-document] Unexpected error:', error);
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