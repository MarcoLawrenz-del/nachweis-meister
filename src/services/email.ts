import { setContractorMeta } from "./contractorDocs.store";

// Check if we have Resend configured for production use
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const MAIL_FROM = import.meta.env.VITE_MAIL_FROM || "onboarding@resend.dev";
const IS_STUB_MODE = !RESEND_API_KEY;

export interface SendInvitationArgs {
  to: string;
  inviteMessage: string;
  contractorName: string;
  magicLink: string;
}

export interface SendReminderMissingArgs {
  to: string;
  missingDocs: string[];
  contractorName: string;
  magicLink: string;
}

// Resend API call function (frontend-compatible)
async function callResendAPI(endpoint: string, data: any) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch(`https://api.resend.com/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Resend API error: ${response.status} - ${error.message || 'Unknown error'}`);
  }

  return response.json();
}

export async function sendInvitation(args: SendInvitationArgs): Promise<{ isStub: boolean }> {
  if (IS_STUB_MODE) {
    console.info('[email:stub] sendInvitation', args);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { isStub: true };
  }

  try {
    const emailData = {
      from: MAIL_FROM,
      to: [args.to],
      subject: `Dokumentenanfrage - ${args.contractorName}`,
      html: `
        <h1>Hallo ${args.contractorName}!</h1>
        <p>${args.inviteMessage}</p>
        <p><a href="${args.magicLink}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Dokumente hochladen</a></p>
        <p>Oder kopieren Sie diesen Link: <br><code>${args.magicLink}</code></p>
        <hr>
        <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch generiert.</p>
      `,
    };

    const response = await callResendAPI('emails', emailData);
    console.log("Email sent successfully:", response);
    return { isStub: false };
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    throw error;
  }
}

export async function sendReminderMissing(args: SendReminderMissingArgs): Promise<{ isStub: boolean }> {
  if (IS_STUB_MODE) {
    console.info('[email:stub] sendReminderMissing', args);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { isStub: true };
  }

  try {
    const docsList = args.missingDocs.map(doc => `<li>${doc}</li>`).join('');
    
    const emailData = {
      from: MAIL_FROM,
      to: [args.to],
      subject: `Erinnerung: Fehlende Dokumente - ${args.contractorName}`,
      html: `
        <h1>Erinnerung für ${args.contractorName}</h1>
        <p>Bitte reichen Sie die folgenden fehlenden Dokumente nach:</p>
        <ul>${docsList}</ul>
        <p><a href="${args.magicLink}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Dokumente hochladen</a></p>
        <p>Oder kopieren Sie diesen Link: <br><code>${args.magicLink}</code></p>
        <hr>
        <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch generiert.</p>
      `,
    };

    const response = await callResendAPI('emails', emailData);
    console.log("Reminder sent successfully:", response);
    return { isStub: false };
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    throw error;
  }
}

// Helper function to get proper error message for toasts
export function getEmailErrorMessage(error: any): string {
  if (error.message?.includes('401') || error.message?.includes('403')) {
    return "Senden fehlgeschlagen. Bitte Domain bei Resend verifizieren oder Absender onboarding@resend.dev im Test nutzen.";
  }
  return `E-Mail konnte nicht gesendet werden: ${error.message || 'Unbekannter Fehler'}`;
}

// Legacy functions for backward compatibility
export async function sendInvitationLegacy(args: { 
  contractorId: string; 
  email: string; 
  subject?: string; 
  message: string; 
  contractorName?: string; 
}): Promise<{ isStub: boolean }> {
  const magicLink = `${window.location.origin}/upload?cid=${args.contractorId}`;
  return await sendInvitation({
    to: args.email,
    inviteMessage: args.message,
    contractorName: args.contractorName || "Unbekannt",
    magicLink
  });
}

export async function sendReminderMissingLegacy(args: { 
  contractorId: string; 
  email: string; 
  missingDocs: string[]; 
  message?: string; 
}): Promise<{ isStub: boolean }> {
  const magicLink = `${window.location.origin}/upload?cid=${args.contractorId}`;
  return await sendReminderMissing({
    to: args.email,
    missingDocs: args.missingDocs,
    contractorName: "Nachunternehmer",
    magicLink
  });
}

export async function sendReminderExpiring(p: any): Promise<void> {
  console.log("[stub] sendReminderExpiring", p);
}