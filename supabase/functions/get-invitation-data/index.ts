import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email identities configuration
const EMAIL_IDENTITIES = {
  invitations: 'invitations@subfix.de',
  reminders: 'reminders@subfix.de', 
  reviews: 'reviews@subfix.de',
  onboarding: 'onboarding@subfix.de',
  team: 'team@subfix.de',
  support: 'support@subfix.de'
};

interface GetInvitationRequest {
  token: string;
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

    const { token }: GetInvitationRequest = await req.json();

    console.log('Fetching invitation data for token:', token);

    // Get invitation with related data
    const { data: inviteData, error: inviteError } = await supabaseClient
      .from('invitations')
      .select(`
        id,
        email,
        project_sub_id,
        subcontractor_id,
        invitation_type,
        status,
        expires_at
      `)
      .eq('token', token)
      .eq('status', 'sent')
      .single();

    if (inviteError || !inviteData) {
      console.error('Invitation not found:', inviteError);
      throw new Error('Invitation not found or expired');
    }

    // Check if invitation is expired
    if (new Date(inviteData.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    console.log('Invitation type:', inviteData.invitation_type);

    let responseData: any;
    let enrichedRequirements: any[] = [];

    if (inviteData.invitation_type === 'global') {
      // Handle global invitation
      console.log('Processing global invitation for subcontractor:', inviteData.subcontractor_id);
      
      // Get subcontractor details
      const { data: subcontractorData, error: subcontractorError } = await supabaseClient
        .from('subcontractors')
        .select(`
          id,
          company_name,
          tenant_id
        `)
        .eq('id', inviteData.subcontractor_id)
        .single();

      if (subcontractorError) throw subcontractorError;

      // Get tenant details
      const { data: tenantData, error: tenantError } = await supabaseClient
        .from('tenants')
        .select(`
          id,
          name,
          logo_url
        `)
        .eq('id', subcontractorData.tenant_id)
        .single();

      if (tenantError) throw tenantError;

      // For global invitations, get all requirements for all project_subs of this subcontractor
      const { data: projectSubs, error: projectSubError } = await supabaseClient
        .from('project_subs')
        .select('id')
        .eq('subcontractor_id', inviteData.subcontractor_id);

      if (projectSubError) throw projectSubError;

      if (projectSubs.length > 0) {
        const projectSubIds = projectSubs.map(ps => ps.id);
        
        // Get requirements
        const { data: requirements, error: reqError } = await supabaseClient
          .from('requirements')
          .select(`
            id,
            status,
            due_date,
            document_type_id
          `)
          .in('project_sub_id', projectSubIds)
          .order('created_at', { ascending: true });

        if (reqError) throw reqError;

        // Get document types
        if (requirements.length > 0) {
          const documentTypeIds = [...new Set(requirements.map(r => r.document_type_id))];
          const { data: documentTypes, error: docTypeError } = await supabaseClient
            .from('document_types')
            .select('id, name_de, code, description_de, required_by_default')
            .in('id', documentTypeIds);

          if (docTypeError) throw docTypeError;

          // Get documents for requirements
          const requirementIds = requirements.map(r => r.id);
          const { data: documents, error: docError } = await supabaseClient
            .from('documents')
            .select(`
              id,
              requirement_id,
              file_name,
              file_size,
              valid_from,
              valid_to,
              uploaded_at
            `)
            .in('requirement_id', requirementIds);

          if (docError) throw docError;

          // Combine all data
          enrichedRequirements = requirements.map(req => {
            const docType = documentTypes.find(dt => dt.id === req.document_type_id);
            const reqDocs = documents.filter(doc => doc.requirement_id === req.id);
            
            return {
              ...req,
              document_type: docType,
              documents: reqDocs
            };
          });
        }
      }

      responseData = {
        id: inviteData.id,
        email: inviteData.email,
        project_sub: {
          id: null,
          project: {
            name: 'Globale Compliance-Prüfung',
            code: 'GLOBAL',
            tenant: {
              name: tenantData.name,
              logo_url: tenantData.logo_url
            }
          },
          subcontractor: {
            company_name: subcontractorData.company_name
          }
        }
      };

    } else {
      // Handle project-specific invitation (existing logic)
      if (!inviteData.project_sub_id) {
        throw new Error('Project-specific invitation missing project_sub_id');
      }

      // Get project-sub details
      const { data: projectSubData, error: projectSubError } = await supabaseClient
        .from('project_subs')
        .select(`
          id,
          project_id,
          subcontractor_id
        `)
        .eq('id', inviteData.project_sub_id)
        .single();

      if (projectSubError) {
        console.error('Project-sub not found:', projectSubError);
        throw projectSubError;
      }

      // Get project details
      const { data: projectData, error: projectError } = await supabaseClient
        .from('projects')
        .select(`
          id,
          name,
          code,
          tenant_id
        `)
        .eq('id', projectSubData.project_id)
        .single();

      if (projectError) throw projectError;

      // Get tenant details
      const { data: tenantData, error: tenantError } = await supabaseClient
        .from('tenants')
        .select(`
          id,
          name,
          logo_url
        `)
        .eq('id', projectData.tenant_id)
        .single();

      if (tenantError) throw tenantError;

      // Get subcontractor details
      const { data: subcontractorData, error: subcontractorError } = await supabaseClient
        .from('subcontractors')
        .select(`
          id,
          company_name
        `)
        .eq('id', projectSubData.subcontractor_id)
        .single();

      if (subcontractorError) throw subcontractorError;

      // Get requirements for this project-sub
      const { data: requirements, error: reqError } = await supabaseClient
        .from('requirements')
        .select(`
          id,
          status,
          due_date,
          document_type_id
        `)
        .eq('project_sub_id', inviteData.project_sub_id)
        .order('created_at', { ascending: true });

      if (reqError) throw reqError;

      // Get document types
      const documentTypeIds = [...new Set(requirements.map(r => r.document_type_id))];
      const { data: documentTypes, error: docTypeError } = await supabaseClient
        .from('document_types')
        .select('id, name_de, code, description_de, required_by_default')
        .in('id', documentTypeIds);

      if (docTypeError) throw docTypeError;

      // Get documents for requirements
      const requirementIds = requirements.map(r => r.id);
      const { data: documents, error: docError } = await supabaseClient
        .from('documents')
        .select(`
          id,
          requirement_id,
          file_name,
          file_size,
          valid_from,
          valid_to,
          uploaded_at
        `)
        .in('requirement_id', requirementIds);

      if (docError) throw docError;

      // Combine all data
      const enrichedRequirements = requirements.map(req => {
        const docType = documentTypes.find(dt => dt.id === req.document_type_id);
        const reqDocs = documents.filter(doc => doc.requirement_id === req.id);
        
        return {
          ...req,
          document_type: docType,
          documents: reqDocs
        };
      });

      const responseData = {
        id: inviteData.id,
        email: inviteData.email,
        project_sub: {
          id: projectSubData.id,
          project: {
            name: projectData.name,
            code: projectData.code,
            tenant: {
              name: tenantData.name,
              logo_url: tenantData.logo_url
            }
          },
          subcontractor: {
            company_name: subcontractorData.company_name
          }
        }
      };
    }

    console.log('Successfully fetched invitation data for:', responseData?.email);

    console.log('Successfully fetched invitation data for:', responseData?.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseData,
        requirements: enrichedRequirements 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in get-invitation-data function:', error);
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