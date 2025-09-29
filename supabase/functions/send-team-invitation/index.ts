import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

// Email configuration
const EMAIL_CONFIG = {
  team: {
    from: 'team@subfix.de',
    replyTo: 'support@subfix.de'
  }
} as const;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendTeamInvitationRequest {
  email: string;
  role: 'admin' | 'staff';
  tenant_id: string;
  invited_by: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, tenant_id, invited_by }: SendTeamInvitationRequest = await req.json();

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing team invitation:', { email, role, tenant_id });

    // Check if domain is allowed for magic links
    const emailDomain = email.split('@')[1];
    const { data: isAllowed, error: domainCheckError } = await supabase
      .rpc('is_domain_allowed_for_magic_link', { 
        email_param: email, 
        tenant_id_param: tenant_id 
      });

    if (domainCheckError) {
      console.error('Error checking domain allowlist:', domainCheckError);
      throw new Error('Error checking domain permissions');
    }

    if (!isAllowed) {
      console.log('Domain not allowed for magic link:', emailDomain);
      throw new Error('domain not allowed');
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Get inviter information
    const { data: inviterData, error: inviterError } = await supabase
      .from('users')
      .select('name, tenant_id')
      .eq('id', invited_by)
      .single();

    if (inviterError) {
      console.error('Error fetching inviter:', inviterError);
      throw new Error('Invalid inviter');
    }

    // Get tenant information
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenant_id)
      .single();

    if (tenantError) {
      console.error('Error fetching tenant:', tenantError);
      throw new Error('Invalid tenant');
    }

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        invitation_type: 'team',
        invited_by,
        status: 'sent',
        subject: `Einladung zum Team ${tenantData.name}`,
        message: `Sie wurden von ${inviterData.name} zum Team ${tenantData.name} als ${role === 'admin' ? 'Administrator' : 'Mitarbeiter'} eingeladen.`
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw new Error('Failed to create invitation');
    }

    // Send invitation email
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/v1/verify?token=${token}&type=invite&redirect_to=${encodeURIComponent(`${Deno.env.get('SITE_URL') || 'https://app.lovable.dev'}/accept-invitation`)}`;

    const roleLabels = {
      admin: 'Administrator',
      staff: 'Mitarbeiter'
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
            .role-badge { background: #ddd6fe; color: #5b21b6; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Team-Einladung</h1>
              <p>Sie wurden zu ${tenantData.name} eingeladen</p>
            </div>
            <div class="content">
              <p>Hallo,</p>
              <p><strong>${inviterData.name}</strong> hat Sie eingeladen, dem Team <strong>${tenantData.name}</strong> beizutreten.</p>
              
              <p>Ihre Rolle: <span class="role-badge">${roleLabels[role]}</span></p>
              
              <p>Klicken Sie auf den Button unten, um die Einladung anzunehmen und Ihr Konto zu erstellen:</p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Einladung annehmen</a>
              </div>
              
              <p><small>Dieser Link läuft ab am: ${format(expiresAt, 'dd.MM.yyyy HH:mm')} Uhr</small></p>
              
              <p>Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Subfix - Compliance-Management System</p>
              <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: EMAIL_CONFIG.team.from,
      to: [email],
      replyTo: EMAIL_CONFIG.team.replyTo,
      subject: `Einladung zum Team ${tenantData.name}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending invitation email:', emailError);
      
      // Mark invitation as failed
      await supabase
        .from('invitations')
        .update({ status: 'failed' })
        .eq('id', invitation.id);
        
      throw new Error('Failed to send invitation email');
    }

    console.log('Team invitation sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      invitation_id: invitation.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-team-invitation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send team invitation' 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Helper function for date formatting
function format(date: Date, formatStr: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return formatStr
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', year.toString())
    .replace('HH', hours)
    .replace('mm', minutes);
}

serve(handler);