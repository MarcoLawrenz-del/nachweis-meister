import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateInvitationRequest {
  project_sub_id?: string; // Optional for global invitations
  subcontractor_id?: string; // For global invitations
  email: string;
  token: string;
  subject: string;
  message: string;
  invited_by: string;
  invitation_type?: 'project' | 'global'; // New field
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
      project_sub_id,
      subcontractor_id,
      email,
      token,
      subject,
      message,
      invited_by,
      invitation_type = 'project'
    }: CreateInvitationRequest = await req.json();

    console.log('Creating invitation:', { project_sub_id, subcontractor_id, email, token, invitation_type });

    // Validate required fields based on invitation type
    if (invitation_type === 'project' && !project_sub_id) {
      throw new Error('project_sub_id is required for project invitations');
    }
    if (invitation_type === 'global' && !subcontractor_id) {
      throw new Error('subcontractor_id is required for global invitations');
    }

    // Prepare invitation data based on type
    let invitationData;
    
    if (invitation_type === 'project') {
      invitationData = {
        project_sub_id,
        email,
        token,
        subject,
        message,
        status: 'sent',
        invited_by,
        invitation_type,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
    } else {
      invitationData = {
        subcontractor_id,
        email,
        token,
        subject,
        message,
        status: 'sent',
        invited_by,
        invitation_type,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
    }

    // Insert invitation record using Service Role (bypasses RLS)
    const { data, error } = await supabaseClient
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }

    console.log('Invitation created successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, invitation_id: data.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-invitation function:', error);
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