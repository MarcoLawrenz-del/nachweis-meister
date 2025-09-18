import { setContractorMeta } from "./contractorDocs.store";
import { supabase } from "@/integrations/supabase/client";

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

export async function sendInvitation(args: SendInvitationArgs): Promise<{ isStub: boolean }> {
  // For now, return stub mode for invitations - implement Edge Function if needed
  console.info('[email:stub] sendInvitation', args);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { isStub: true };
}

export async function sendReminderMissing(args: SendReminderMissingArgs): Promise<{ isStub: boolean }> {
  try {
    console.log('Sending reminder email via Edge Function:', args);
    
    const { data, error } = await supabase.functions.invoke('send-reminder-email', {
      body: {
        to: args.to,
        contractorName: args.contractorName,
        missingDocs: args.missingDocs,
        magicLink: args.magicLink
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(`E-Mail-Versand fehlgeschlagen: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Unbekannter Fehler beim E-Mail-Versand');
    }

    console.log("Reminder sent successfully via Edge Function:", data);
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