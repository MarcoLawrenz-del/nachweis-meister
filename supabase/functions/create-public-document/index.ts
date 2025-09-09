import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDocumentRequest {
  requirement_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  valid_from: string | null;
  valid_to: string | null;
  document_number: string | null;
  invitation_token: string;
  new_status?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const {
      requirement_id,
      file_name,
      file_url,
      file_size,
      mime_type,
      valid_from,
      valid_to,
      document_number,
      invitation_token,
      new_status = 'submitted' // Default to submitted as per state transition rules
    }: CreateDocumentRequest = await req.json();

    console.log('Creating document for requirement:', requirement_id);

    // Verify the invitation token is valid
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitations')
      .select('id, project_sub_id, status, expires_at')
      .eq('token', invitation_token)
      .eq('status', 'sent')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Verify the requirement belongs to this project-sub
    const { data: requirement, error: reqError } = await supabaseClient
      .from('requirements')
      .select('id, project_sub_id')
      .eq('id', requirement_id)
      .eq('project_sub_id', invitation.project_sub_id)
      .single();

    if (reqError || !requirement) {
      throw new Error('Invalid requirement for this invitation');
    }

    // Insert document record using Service Role (bypasses RLS)
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .insert({
        requirement_id,
        file_name,
        file_url,
        file_size,
        mime_type,
        valid_from,
        valid_to,
        document_number,
        uploaded_at: new Date().toISOString(),
        uploaded_by: null // Public upload, no authenticated user
      })
      .select()
      .single();

    if (docError) {
      console.error('Error creating document:', docError);
      throw docError;
    }

    // Update requirement status according to state transition rules
    // missing -> submitted (public upload) -> in_review (when reviewer opens)
    const targetStatus = new_status === 'submitted' ? 'submitted' : 'in_review';
    
    const { error: updateError } = await supabaseClient
      .from('requirements')
      .update({ 
        status: targetStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requirement_id);

    if (updateError) {
      console.error('Error updating requirement status:', updateError);
      // Don't throw here, document was created successfully
    }

    console.log('Document created successfully:', document.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        document_id: document.id,
        new_status: targetStatus,
        message: `Document uploaded successfully and status changed to ${targetStatus}`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-public-document function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);