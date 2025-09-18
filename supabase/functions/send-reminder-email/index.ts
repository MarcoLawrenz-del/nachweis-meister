import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendReminderRequest {
  to: string;
  contractorName: string;
  missingDocs: string[];
  magicLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, contractorName, missingDocs, magicLink }: SendReminderRequest = await req.json();

    console.log("Sending reminder email to:", to, "for contractor:", contractorName);

    const docsList = missingDocs.map(doc => `<li>${doc}</li>`).join('');
    
    const emailResponse = await resend.emails.send({
      from: "Bausicht <onboarding@resend.dev>", // Anpassen Sie die From-Adresse
      to: [to],
      subject: `Erinnerung: Fehlende Dokumente - ${contractorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            Erinnerung für ${contractorName}
          </h1>
          
          <p style="color: #555; font-size: 16px;">
            Bitte reichen Sie die folgenden fehlenden Dokumente nach:
          </p>
          
          <ul style="color: #555; font-size: 14px; line-height: 1.6;">
            ${docsList}
          </ul>
          
          ${magicLink ? `
            <div style="margin: 30px 0; text-align: center;">
              <a href="${magicLink}" 
                 style="background: #0066cc; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block;">
                Dokumente hochladen
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px;">
              Oder kopieren Sie diesen Link in Ihren Browser:<br>
              <code style="background: #f4f4f4; padding: 5px; border-radius: 3px;">${magicLink}</code>
            </p>
          ` : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #888; font-size: 12px;">
            Diese E-Mail wurde automatisch generiert. Bei Fragen wenden Sie sich bitte an Ihr Projektteam.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      messageId: emailResponse.data?.id,
      message: "Erinnerungs-E-Mail erfolgreich versendet"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Unbekannter Fehler beim E-Mail-Versand"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);