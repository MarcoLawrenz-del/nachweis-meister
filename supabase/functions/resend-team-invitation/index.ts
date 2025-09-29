import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendTeamInvitationRequest {
  invitation_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitation_id }: ResendTeamInvitationRequest = await req.json();

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Resending team invitation:', invitation_id);

    // Get existing invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select(`
        *,
        invited_by:users!invitations_invited_by_fkey(name, tenant_id),
        tenant:tenants!users_tenant_id_fkey(name)
      `)
      .eq('id', invitation_id)
      .single();

    if (inviteError || !invitation) {
      console.error('Error fetching invitation:', inviteError);
      throw new Error('Invitation not found');
    }

    // Generate new token and extend expiry
    const newToken = crypto.randomUUID();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days expiry

    // Update invitation with new token and expiry
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
        status: 'sent'
      })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      throw new Error('Failed to update invitation');
    }

    // Send invitation email
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/v1/verify?token=${newToken}&type=invite&redirect_to=${encodeURIComponent(`${Deno.env.get('SITE_URL') || 'https://app.lovable.dev'}/accept-invitation`)}`;

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
            .reminder { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Erinnerung: Team-Einladung</h1>
              <p>Sie wurden zu ${invitation.tenant?.name} eingeladen</p>
            </div>
            <div class="content">
              <div class="reminder">
                <strong>Dies ist eine Erinnerung</strong> - Ihre Einladung läuft bald ab!
              </div>
              
              <p>Hallo,</p>
              <p><strong>${invitation.invited_by?.name}</strong> hat Sie eingeladen, dem Team <strong>${invitation.tenant?.name}</strong> beizutreten.</p>
              
              <p>Ihre Rolle: <span class="role-badge">${roleLabels[invitation.role as keyof typeof roleLabels]}</span></p>
              
              <p>Klicken Sie auf den Button unten, um die Einladung anzunehmen und Ihr Konto zu erstellen:</p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Einladung annehmen</a>
              </div>
              
              <p><small>Dieser neue Link läuft ab am: ${format(newExpiresAt, 'dd.MM.yyyy HH:mm')} Uhr</small></p>
              
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
      from: 'Subfix <noreply@subfix.de>',
      to: [invitation.email],
      subject: `Erinnerung: Einladung zum Team ${invitation.tenant?.name}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending reminder email:', emailError);
      throw new Error('Failed to send reminder email');
    }

    console.log('Team invitation reminder sent successfully');

    return new Response(JSON.stringify({ 
      success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in resend-team-invitation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to resend team invitation' 
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