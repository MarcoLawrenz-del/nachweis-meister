export async function sendInvitation(args: { 
  contractorId: string; 
  email: string; 
  subject?: string; 
  message: string; 
  contractorName?: string; 
}): Promise<void> {
  console.log("[stub] sendInvitation", args);
}

export async function sendReminderMissing(args: { 
  contractorId: string; 
  email: string; 
  missingDocs: string[]; 
  message?: string; 
}): Promise<void> {
  console.log("[stub] sendReminderMissing", args);
}

export async function sendReminderExpiring(p: any): Promise<void> {
  console.log("[stub] sendReminderExpiring", p);
}