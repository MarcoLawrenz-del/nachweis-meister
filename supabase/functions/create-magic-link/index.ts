import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMagicLinkRequest {
  contractorId: string;
  email?: string;
  sendEmail?: boolean;
  validityDays?: number; // Optional, defaults to 14
}

interface CreateMagicLinkResponse {
  success: boolean;
  token?: string;
  magicLink?: string;
  expiresAt?: string;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contractorId, email, sendEmail = false, validityDays = 14 }: CreateMagicLinkRequest = await req.json();

    // Validate required fields
    if (!contractorId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'contractorId is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate secure token (32 characters)
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 4);
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    console.info('[create-magic-link] Generating token for contractor:', contractorId);

    // Store magic link in database
    const { data: magicLinkData, error: dbError } = await supabase
      .from('magic_links')
      .insert({
        token,
        contractor_id: contractorId,
        email: email || '',
        expires_at: expiresAt.toISOString(),
        created_by: null // Will be set by auth context if user is logged in
      })
      .select()
      .single();

    if (dbError) {
      console.error('[create-magic-link] Database error:', dbError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create magic link' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build magic link URL
    const baseUrl = req.headers.get('origin') || 'https://your-domain.com';
    const magicLink = `${baseUrl}/upload/${token}`;

    console.info('[create-magic-link] Magic link created successfully:', { token: token.substring(0, 8) + '...', contractorId });

    // Send email if requested
    if (sendEmail) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          
          const emailResult = await resend.emails.send({
            from: "Subfix <noreply@resend.dev>",
            to: [email],
            subject: "Dokumente hochladen - Subfix",
            html: `
              <h2>Dokumente hochladen</h2>
              <p>Hallo,</p>
              <p>bitte laden Sie Ihre Unterlagen über den folgenden Link hoch:</p>
              <p><a href="${magicLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Dokumente hochladen</a></p>
              <p>Der Link ist 14 Tage gültig. Sie können jederzeit zurückkehren und den Upload-Vorgang fortsetzen.</p>
              <p>Falls Sie Fragen haben, kontaktieren Sie uns gerne.</p>
              <p>Mit freundlichen Grüßen,<br>Ihr Subfix Team</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">Link: ${magicLink}</p>
            `,
          });

          console.info('[create-magic-link] Email sent successfully:', emailResult.id);
        } catch (emailError) {
          console.error('[create-magic-link] Email sending failed:', emailError);
          // Don't fail the request if email fails, just log it
        }
      } else {
        console.warn('[create-magic-link] Resend API key not configured, skipping email');
      }
    }

    const response: CreateMagicLinkResponse = {
      success: true,
      token,
      magicLink,
      expiresAt: expiresAt.toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[create-magic-link] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);