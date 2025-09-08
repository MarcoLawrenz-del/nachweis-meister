import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInviteEmailRequest {
  to: string;
  subject: string;
  message: string;
  subcontractorName: string;
  projectName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const {
      to,
      subject,
      message,
      subcontractorName,
      projectName
    }: SendInviteEmailRequest = await req.json();

    console.log('Sending invite email to:', to);

    const emailResponse = await resend.emails.send({
      from: "Nachweis-Meister <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Dokumentenanforderung</h2>
          
          <p>Hallo ${subcontractorName},</p>
          
          <div style="white-space: pre-line; margin: 20px 0;">
            ${message}
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Projekt Details:</h3>
            <p><strong>Projekt:</strong> ${projectName}</p>
            <p><strong>Ihr Unternehmen:</strong> ${subcontractorName}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Bitte verwenden Sie den Link in der Nachricht oben, um Ihre Dokumente hochzuladen.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Diese E-Mail wurde automatisch von Nachweis-Meister generiert.
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending invite email:', error);
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