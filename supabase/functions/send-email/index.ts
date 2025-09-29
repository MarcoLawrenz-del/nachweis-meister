import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: string;
  payload: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, payload }: EmailRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate email content based on type
    const emailContent = getEmailTemplate(type, payload);

    const emailResponse = await resend.emails.send({
      from: getFromAddress(type),
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.data?.id,
        mode: "resend"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
    // Handle Resend-specific errors
    if (error.message?.includes('401') || error.message?.includes('403')) {
      return new Response(
        JSON.stringify({ 
          error: "auth",
          message: "Senden fehlgeschlagen. Bitte Domain bei Resend verifizieren oder Absender konfigurieren."
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getFromAddress(type: string): string {
  const fromMap: Record<string, string> = {
    invitation: 'invitations@gosubfix.de',
    reminder_missing: 'reminders@gosubfix.de',
    doc_accepted: 'reviews@gosubfix.de',
    doc_rejected: 'reviews@gosubfix.de',
    resume_upload: 'support@gosubfix.de',
    expiry_warning: 'reminders@gosubfix.de',
    test: 'test@gosubfix.de'
  };
  
  return fromMap[type] || 'noreply@gosubfix.de';
}

function getEmailTemplate(type: string, payload: any): { subject: string; html: string } {
  const { contractorName, companyName, magicLink, requiredDocs, docName, reason, daysUntilExpiry } = payload;

  switch (type) {
    case 'invitation':
      return {
        subject: `${companyName}: Dokumentenupload erforderlich`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Hallo ${contractorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 16px;">
              ${companyName} benötigt von Ihnen die folgenden Dokumente für die Zusammenarbeit:
            </p>
            
            <ul style="color: #4b5563; line-height: 1.6; margin-bottom: 24px; padding-left: 20px;">
              ${requiredDocs?.map((doc: string) => `<li>${doc}</li>`).join('') || '<li>Verschiedene Nachweise</li>'}
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Dokumente hochladen
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
              <a href="${magicLink}" style="color: #3b82f6; word-break: break-all;">${magicLink}</a>
            </p>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };

    case 'reminder_missing':
      return {
        subject: `${companyName}: Erinnerung – Dokumente noch erforderlich`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Hallo ${contractorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 16px;">
              dies ist eine Erinnerung: ${companyName} benötigt noch die folgenden Dokumente:
            </p>
            
            <ul style="color: #4b5563; line-height: 1.6; margin-bottom: 24px; padding-left: 20px;">
              ${requiredDocs?.map((doc: string) => `<li>${doc}</li>`).join('') || '<li>Verschiedene Nachweise</li>'}
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" 
                 style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Jetzt hochladen
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
              <a href="${magicLink}" style="color: #3b82f6; word-break: break-all;">${magicLink}</a>
            </p>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };

    case 'doc_accepted':
      return {
        subject: `${companyName}: Dokument "${docName}" akzeptiert`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Hallo ${contractorName},</h2>
            
            <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #065f46; margin: 0; font-weight: 500;">
                ✅ Ihr Dokument "${docName}" wurde erfolgreich akzeptiert!
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Vielen Dank für die Einreichung. Das Dokument erfüllt alle Anforderungen und ist damit gültig.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Status einsehen
              </a>
            </div>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };

    case 'doc_rejected':
      return {
        subject: `${companyName}: Dokument "${docName}" wurde abgelehnt`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Hallo ${contractorName},</h2>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #991b1b; margin: 0 0 8px 0; font-weight: 500;">
                ❌ Ihr Dokument "${docName}" wurde abgelehnt
              </p>
              ${reason ? `<p style="color: #7f1d1d; margin: 0; font-size: 14px;">Grund: ${reason}</p>` : ''}
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Bitte laden Sie ein korrigiertes Dokument hoch oder wenden Sie sich bei Fragen an ${companyName}.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" 
                 style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Neues Dokument hochladen
              </a>
            </div>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };

    case 'expiry_warning':
      return {
        subject: `${companyName}: Dokument "${docName}" läuft bald ab`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Hallo ${contractorName},</h2>
            
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">
                ⚠️ Ihr Dokument "${docName}" läuft in ${daysUntilExpiry} Tag(en) ab
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Um weiterhin einsatzbereit zu bleiben, laden Sie bitte rechtzeitig ein aktualisiertes Dokument hoch.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" 
                 style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Neues Dokument hochladen
              </a>
            </div>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };

    case 'resume_upload':
      return {
        subject: `${companyName}: Upload fortsetzen`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Hallo ${contractorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Sie können Ihren Dokumenten-Upload für ${companyName} hier fortsetzen:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Upload fortsetzen
              </a>
            </div>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };

    case 'test':
      return {
        subject: `Test-E-Mail von SubFix`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Test-E-Mail erfolgreich!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Diese Test-E-Mail bestätigt, dass Ihr E-Mail-System korrekt konfiguriert ist und funktioniert.
            </p>
            
            <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #065f46; margin: 0; font-weight: 500;">
                ✅ E-Mail-Integration funktioniert einwandfrei
              </p>
            </div>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };

    default:
      return {
        subject: `Nachricht von ${companyName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Hallo ${contractorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Sie haben eine neue Nachricht von ${companyName} erhalten.
            </p>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Powered by SubFix – Digitale Nachunternehmerverwaltung
            </p>
          </div>
        `
      };
  }
}

serve(handler);