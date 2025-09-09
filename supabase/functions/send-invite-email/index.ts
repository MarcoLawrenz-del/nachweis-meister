import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    console.log('Starting send-invite-email function...');
    
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log('RESEND_API_KEY exists:', !!apiKey);
    console.log('RESEND_API_KEY length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      throw new Error('RESEND_API_KEY not found in environment variables');
    }
    
    console.log('Loading Resend module...');
    const { Resend } = await import("npm:resend@2.0.0");
    console.log('Resend module loaded successfully');
    
    const resend = new Resend(apiKey);
    console.log('Resend client initialized');
    
    const requestData = await req.json();
    console.log('Request data received:', JSON.stringify(requestData, null, 2));
    
    const {
      to,
      subject,
      message,
      subcontractorName,
      projectName
    }: SendInviteEmailRequest = requestData;

    console.log('Sending invite email to:', to);
    console.log('Subject:', subject);
    console.log('Subcontractor name:', subcontractorName);

    console.log('Calling resend.emails.send...');
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

    console.log('Resend API Response:', JSON.stringify(emailResponse, null, 2));
    
    if (emailResponse.error) {
      console.error('Resend API Error:', emailResponse.error);
      throw new Error(`Resend API Error: ${JSON.stringify(emailResponse.error)}`);
    }

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
    console.error('=== ERROR IN SEND-INVITE-EMAIL ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('================================');
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: typeof error,
        errorDetails: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);