import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// Email configuration
const EMAIL_CONFIG = {
  reviews: {
    from: 'reviews@subfix.de',
    replyTo: 'support@subfix.de'
  }
} as const;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'assignment' | 'approval' | 'rejection' | 'escalation';
  requirementId: string;
  recipientEmail: string;
  recipientName: string;
  projectName: string;
  subcontractorName: string;
  documentType: string;
  reviewerName?: string;
  reason?: string;
  escalationReason?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  console.log('Review notification function called');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      type,
      requirementId,
      recipientEmail,
      recipientName,
      projectName,
      subcontractorName,
      documentType,
      reviewerName,
      reason,
      escalationReason
    }: NotificationRequest = await req.json();

    console.log('Sending notification:', { type, requirementId, recipientEmail });

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'assignment':
        subject = `Dokument zur Prüfung zugewiesen - ${projectName}`;
        htmlContent = `
          <h1>Neues Dokument zur Prüfung</h1>
          <p>Hallo ${recipientName},</p>
          <p>Ihnen wurde ein neues Dokument zur Prüfung zugewiesen:</p>
          <ul>
            <li><strong>Projekt:</strong> ${projectName}</li>
            <li><strong>Subunternehmer:</strong> ${subcontractorName}</li>
            <li><strong>Dokumenttyp:</strong> ${documentType}</li>
          </ul>
          <p>Bitte melden Sie sich in der Plattform an, um das Dokument zu prüfen.</p>
          <p>Mit freundlichen Grüßen,<br>Ihr Team</p>
        `;
        break;

      case 'approval':
        subject = `Dokument genehmigt - ${projectName}`;
        htmlContent = `
          <h1>Dokument genehmigt</h1>
          <p>Hallo ${recipientName},</p>
          <p>Ihr Dokument wurde genehmigt:</p>
          <ul>
            <li><strong>Projekt:</strong> ${projectName}</li>
            <li><strong>Dokumenttyp:</strong> ${documentType}</li>
            <li><strong>Geprüft von:</strong> ${reviewerName}</li>
          </ul>
          <p>Das Dokument ist nun als gültig markiert.</p>
          <p>Mit freundlichen Grüßen,<br>Ihr Team</p>
        `;
        break;

      case 'rejection':
        subject = `Dokument abgelehnt - ${projectName}`;
        htmlContent = `
          <h1>Dokument abgelehnt</h1>
          <p>Hallo ${recipientName},</p>
          <p>Ihr Dokument wurde leider abgelehnt:</p>
          <ul>
            <li><strong>Projekt:</strong> ${projectName}</li>
            <li><strong>Dokumenttyp:</strong> ${documentType}</li>
            <li><strong>Geprüft von:</strong> ${reviewerName}</li>
            <li><strong>Grund:</strong> ${reason}</li>
          </ul>
          <p>Bitte laden Sie ein korrigiertes Dokument hoch.</p>
          <p>Mit freundlichen Grüßen,<br>Ihr Team</p>
        `;
        break;

      case 'escalation':
        subject = `Dokument eskaliert - ${projectName}`;
        htmlContent = `
          <h1>Dokument eskaliert</h1>
          <p>Hallo ${recipientName},</p>
          <p>Ein Dokument wurde zur weiteren Prüfung eskaliert:</p>
          <ul>
            <li><strong>Projekt:</strong> ${projectName}</li>
            <li><strong>Subunternehmer:</strong> ${subcontractorName}</li>
            <li><strong>Dokumenttyp:</strong> ${documentType}</li>
            <li><strong>Eskalationsgrund:</strong> ${escalationReason}</li>
          </ul>
          <p>Bitte überprüfen Sie das Dokument und treffen Sie eine Entscheidung.</p>
          <p>Mit freundlichen Grüßen,<br>Ihr Team</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: EMAIL_CONFIG.reviews.from,
      to: [recipientEmail],
      reply_to: EMAIL_CONFIG.reviews.replyTo,
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-review-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);