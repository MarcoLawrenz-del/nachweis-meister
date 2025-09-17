import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

// Email configuration
const EMAIL_CONFIG = {
  reminders: {
    from: 'reminders@subfix.de',
    replyTo: 'support@subfix.de'
  }
} as const;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import email templates (simplified inline for now)
const EMAIL_TEMPLATES = {
  invite_initial: {
    subject: (data: any) => `Dokumentenanforderung: ${data.requirementName} für ${data.projectName || 'Compliance-Prüfung'}`,
    html: (data: any) => getEmailHtml('invite_initial', data)
  },
  reminder_soft: {
    subject: (data: any) => `Erinnerung: ${data.requirementName} - Dokument noch ausstehend`,
    html: (data: any) => getEmailHtml('reminder_soft', data)
  },
  reminder_hard: {
    subject: (data: any) => `DRINGEND: ${data.requirementName} - Sofortige Vorlage erforderlich`,
    html: (data: any) => getEmailHtml('reminder_hard', data)
  },
  escalation: {
    subject: (data: any) => `ESKALATION: Fehlende Dokumente ${data.subcontractorName} - ${data.requirementName}`,
    html: (data: any) => getEmailHtml('escalation', data)
  },
  monthly_refresh: {
    subject: (data: any) => `Monatliche Dokumentenprüfung - ${data.requirementName}`,
    html: (data: any) => getEmailHtml('monthly_refresh', data)
  }
};

interface SendReminderRequest {
  to?: string; // Optional for escalations
  templateType: keyof typeof EMAIL_TEMPLATES;
  templateData: any;
  requirementId: string;
  subcontractorId: string;
  tenantId: string;
  isEscalation?: boolean;
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

    const {
      to,
      templateType,
      templateData,
      requirementId,
      subcontractorId,
      tenantId,
      isEscalation = false
    }: SendReminderRequest = await req.json();

    console.log(`Sending ${templateType} email for requirement ${requirementId}`);

    const template = EMAIL_TEMPLATES[templateType];
    if (!template) {
      throw new Error(`Unknown template type: ${templateType}`);
    }

    const subject = template.subject(templateData);
    const html = template.html(templateData);

    let recipients: string[] = [];

    if (isEscalation) {
      // For escalations, send to project managers/owners of the tenant
      const { data: managers, error: managersError } = await supabaseClient
        .from('users')
        .select('email')
        .eq('tenant_id', tenantId)
        .in('role', ['owner', 'admin']);

      if (managersError) throw managersError;
      
      recipients = managers?.map(m => m.email) || [];
      
      // Also CC the original subcontractor
      if (to) recipients.push(to);
    } else {
      // Regular reminder to subcontractor
      if (!to) throw new Error('Recipient email required for non-escalation emails');
      recipients = [to];
    }

    if (recipients.length === 0) {
      throw new Error('No recipients found');
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: EMAIL_CONFIG.reminders.from,
      to: recipients,
      reply_to: EMAIL_CONFIG.reminders.replyTo,
      subject: subject,
      html: html,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log('Email sent successfully:', emailResponse.data?.id);

    // Log the email
    const { error: logError } = await supabaseClient
      .from('email_logs')
      .insert({
        tenant_id: tenantId,
        subcontractor_id: subcontractorId,
        requirement_id: requirementId,
        to_email: recipients.join(', '),
        subject: subject,
        template_key: templateType,
        status: 'sent',
        sent_at: new Date().toISOString(),
        preview_snippet: `${templateType}: ${templateData.requirementName}`
      });

    if (logError) {
      console.error('Error logging email:', logError);
      // Don't fail the request for logging errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResponse.data?.id,
        recipients: recipients.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-reminder-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

function getEmailHtml(templateType: string, data: any): string {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #FF7A00; }
      .logo { max-height: 60px; margin-bottom: 10px; }
      .title { color: #2C5F5D; font-size: 24px; margin: 0; }
      .content { margin: 20px 0; }
      .highlight { background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF7A00; margin: 20px 0; }
      .cta-button { display: inline-block; background: #FF7A00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
  `;

  switch (templateType) {
    case 'invite_initial':
      return `
        <!DOCTYPE html>
        <html lang="de">
        <head><meta charset="UTF-8">${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              ${data.tenantLogoUrl ? `<img src="${data.tenantLogoUrl}" alt="${data.tenantName}" class="logo">` : ''}
              <h1 class="title">${data.tenantName}</h1>
            </div>
            <div class="content">
              <h2>Dokumentenanforderung</h2>
              <p>Hallo ${data.subcontractorName},</p>
              <p>wir benötigen von Ihnen das folgende Dokument${data.projectName ? ` für das Projekt "${data.projectName}"` : ''}:</p>
              <div class="highlight">
                <strong>${data.requirementName}</strong>
                ${data.dueDate ? `<br><strong>Fällig bis:</strong> ${data.dueDate}` : ''}
              </div>
              <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button">Jetzt Dokument hochladen</a>
              </p>
              <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
              <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

    case 'reminder_soft':
      return `
        <!DOCTYPE html>
        <html lang="de">
        <head><meta charset="UTF-8">${baseStyles.replace('#FF7A00', '#FFA726')}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">Freundliche Erinnerung</h1>
            </div>
            <div class="content">
              <p>Hallo ${data.subcontractorName},</p>
              <p>wir möchten Sie freundlich daran erinnern, dass wir noch das folgende Dokument von Ihnen benötigen:</p>
              <div class="highlight">
                <strong>${data.requirementName}</strong>
                ${data.attemptNumber ? `<br><small>Erinnerung Nr. ${data.attemptNumber}</small>` : ''}
              </div>
              <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button">Dokument jetzt hochladen</a>
              </p>
              <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

    case 'reminder_hard':
      return `
        <!DOCTYPE html>
        <html lang="de">
        <head><meta charset="UTF-8">${baseStyles.replace('#FF7A00', '#F44336')}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title" style="color: #F44336;">⚠️ DRINGENDE MAHNUNG</h1>
            </div>
            <div class="content">
              <p>Sehr geehrte Damen und Herren von ${data.subcontractorName},</p>
              <p><strong>Trotz mehrfacher Aufforderung fehlt noch immer das folgende Dokument:</strong></p>
              <div class="highlight" style="background-color: #ffebee; border-left-color: #F44336;">
                <strong>${data.requirementName}</strong>
                <br><strong>Mahnung Nr. ${data.attemptNumber || 'X'}</strong>
              </div>
              <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button" style="background: #F44336;">🚨 SOFORT HOCHLADEN</a>
              </p>
              <p>Bei weiteren Verzögerungen müssen wir den Vorgang an die Projektleitung eskalieren.</p>
              <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

    case 'escalation':
      return `
        <!DOCTYPE html>
        <html lang="de">
        <head><meta charset="UTF-8">${baseStyles.replace('#FF7A00', '#D32F2F')}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title" style="color: #D32F2F;">🚨 ESKALATION PROJEKTLEITUNG</h1>
            </div>
            <div class="content">
              <p><strong>Betreff:</strong> Fehlende Compliance-Dokumente</p>
              <div class="highlight" style="background-color: #ffcdd2; border-left-color: #D32F2F;">
                <strong>Subunternehmer:</strong> ${data.subcontractorName}<br>
                <strong>Fehlendes Dokument:</strong> ${data.requirementName}<br>
                <strong>Anzahl Erinnerungen:</strong> ${data.attemptNumber || 'Unbekannt'}
              </div>
              <p>Trotz ${data.attemptNumber || 'mehrfacher'} Erinnerungen wurde das Dokument nicht eingereicht.</p>
              <p><strong>Upload-Link für Subunternehmer:</strong><br>
              <a href="${data.uploadUrl}">${data.uploadUrl}</a></p>
              <p>Mit freundlichen Grüßen<br>Compliance-System ${data.tenantName}</p>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

    case 'monthly_refresh':
      return `
        <!DOCTYPE html>
        <html lang="de">
        <head><meta charset="UTF-8">${baseStyles.replace('#FF7A00', '#2196F3')}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">📋 Monatliche Dokumentenprüfung</h1>
            </div>
            <div class="content">
              <p>Hallo ${data.subcontractorName},</p>
              <p>im Rahmen unserer monatlichen Compliance-Prüfung benötigen wir eine Aktualisierung folgenden Dokuments:</p>
              <div class="highlight" style="background-color: #e3f2fd; border-left-color: #2196F3;">
                <strong>${data.requirementName}</strong>
              </div>
              <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button" style="background: #2196F3;">Aktuelles Dokument hochladen</a>
              </p>
              <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

function getEmailFooter(): string {
  return `
    <div class="footer">
      <p><strong>Nachweis-Meister Compliance-System</strong></p>
      <p>Diese E-Mail wurde automatisch generiert.</p>
      <p>
        📚 <a href="https://www.bundesregierung.de/breg-de/themen/buerokratieabbau/gewerbeanmeldung-384746">Gewerbeschein-Info</a> |
        🔗 <a href="https://www.zoll.de/DE/Fachthemen/Arbeit/Mindestlohn/Anmeldung-Dienstleistung/anmeldung-dienstleistung_node.html">GZD-Anmeldung</a>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
      <p style="text-align: center; color: #999; font-size: 11px;">
        © ${new Date().getFullYear()} Nachweis-Meister | Compliance-Management-System
      </p>
    </div>`;
}

serve(handler);