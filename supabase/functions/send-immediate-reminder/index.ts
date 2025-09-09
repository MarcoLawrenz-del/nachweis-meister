import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendImmediateReminderRequest {
  requirementId: string;
  subcontractorId: string;
}

const handler = async (req: Request): Promise<Response> => {
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

    const { requirementId, subcontractorId }: SendImmediateReminderRequest = await req.json();

    console.log(`Sending immediate reminder for requirement ${requirementId} to subcontractor ${subcontractorId}`);

    // Fetch requirement details
    const { data: requirement, error: reqError } = await supabaseClient
      .from('requirements')
      .select(`
        id,
        due_date,
        document_type:document_types (
          name_de,
          code
        ),
        project_sub:project_subs (
          subcontractor:subcontractors (
            id,
            company_name,
            contact_email
          ),
          project:projects (
            name,
            tenant:tenants (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq('id', requirementId)
      .single();

    if (reqError || !requirement) {
      throw new Error('Requirement not found');
    }

    // Generate upload URL (you might need to create a token for this)
    const uploadUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/public/upload/reminder/${requirementId}`;
    
    const templateData = {
      subcontractorName: requirement.project_sub.subcontractor.company_name,
      projectName: requirement.project_sub.project.name,
      requirementName: requirement.document_type.name_de,
      documentTypeCode: requirement.document_type.code,
      dueDate: requirement.due_date ? new Date(requirement.due_date).toLocaleDateString('de-DE') : undefined,
      uploadUrl,
      tenantName: requirement.project_sub.project.tenant.name,
      tenantLogoUrl: requirement.project_sub.project.tenant.logo_url,
      attemptNumber: 'Sofort'
    };

    // Send immediate reminder email
    const { error: emailError } = await supabaseClient.functions.invoke('send-reminder-email', {
      body: {
        to: requirement.project_sub.subcontractor.contact_email,
        templateType: 'reminder_soft',
        templateData,
        requirementId: requirementId,
        subcontractorId: subcontractorId,
        tenantId: requirement.project_sub.project.tenant.id
      }
    });

    if (emailError) {
      console.error('Failed to send immediate reminder:', emailError);
      throw emailError;
    }

    console.log('Immediate reminder sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Immediate reminder sent' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-immediate-reminder function:', error);
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