// ============= Central Email Service =============
// Production-ready email system with Resend + Demo-Stub

import { getContractor } from './contractors.store';
import { createUploadToken } from './uploadLinks';
import { isErr, type Result } from "@/utils/result";

export type EmailType =
  | "invitation"
  | "reminder_missing"
  | "upload_received"
  | "doc_accepted"
  | "doc_rejected"
  | "expiry_warning"
  | "resume_upload";

export interface EmailPayload {
  to: string;
  contractorName: string;
  customerName: string;
  contractorId: string;
  requiredDocs?: string[];
  magicLink?: string;
  docLabel?: string;
  reason?: string;
  validUntil?: string;
  days?: number;
}

// Rate limiting storage
const RATE_LIMIT_KEY = "subfix.email.activity.v1";
const ACTIVITY_LOG_KEY = "subfix.email.activity.v1";

interface RateLimitEntry {
  lastSentAt: string;
}

interface ActivityEntry {
  tsISO: string;
  type: EmailType;
  contractorId: string;
  to: string;
  mode: "resend" | "stub";
  result: "ok" | "error";
  error?: string;
}

function getRateLimitStore(): Record<string, RateLimitEntry> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveRateLimitStore(store: Record<string, RateLimitEntry>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(store));
  } catch {}
}

function logActivity(entry: ActivityEntry) {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(ACTIVITY_LOG_KEY);
    const activities: ActivityEntry[] = existing ? JSON.parse(existing) : [];
    activities.push(entry);
    // Keep only last 1000 entries
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000);
    }
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(activities));
  } catch {}
}

function checkRateLimit(contractorId: string, type: EmailType): boolean {
  const store = getRateLimitStore();
  const key = `${contractorId}:${type}`;
  const entry = store[key];
  
  if (!entry) return true; // No previous send
  
  const lastSent = new Date(entry.lastSentAt);
  const now = new Date();
  const hoursSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastSend >= 24; // 24 hour rate limit
}

function updateRateLimit(contractorId: string, type: EmailType) {
  const store = getRateLimitStore();
  const key = `${contractorId}:${type}`;
  store[key] = { lastSentAt: new Date().toISOString() };
  saveRateLimitStore(store);
}

async function sendViaResend(type: EmailType, payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  const from = import.meta.env.VITE_MAIL_FROM || "onboarding@resend.dev";
  
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const { subject, html, text } = getEmailTemplate(type, payload);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        return { 
          ok: false, 
          error: "Senden fehlgeschlagen. Bitte Domain bei Resend verifizieren oder Absender konfigurieren." 
        };
      }
      return { ok: false, error: errorData.message || `HTTP ${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

function getEmailTemplate(type: EmailType, payload: EmailPayload): { subject: string; html: string; text: string } {
  const templates = {
    invitation: {
      subject: `Bitte laden Sie Ihre Unterlagen hoch – ${payload.customerName} nutzt Subfix`,
      html: getInvitationHTML(payload),
      text: getInvitationText(payload)
    },
    reminder_missing: {
      subject: `Erinnerung: Es fehlen noch Unterlagen für ${payload.customerName}`,
      html: getReminderHTML(payload),
      text: getReminderText(payload)
    },
    upload_received: {
      subject: "Vielen Dank! Wir haben Ihre Unterlagen erhalten",
      html: getUploadReceivedHTML(payload),
      text: getUploadReceivedText(payload)
    },
    doc_accepted: {
      subject: `Unterlage akzeptiert: ${payload.docLabel}`,
      html: getDocAcceptedHTML(payload),
      text: getDocAcceptedText(payload)
    },
    doc_rejected: {
      subject: `Bitte korrigieren: ${payload.docLabel}`,
      html: getDocRejectedHTML(payload),
      text: getDocRejectedText(payload)
    },
    expiry_warning: {
      subject: `Hinweis: ${payload.docLabel} läuft in ${payload.days} Tagen ab`,
      html: getExpiryWarningHTML(payload),
      text: getExpiryWarningText(payload)
    },
    resume_upload: {
      subject: "Sie können Ihren Upload fortsetzen",
      html: getResumeUploadHTML(payload),
      text: getResumeUploadText(payload)
    }
  };

  return templates[type];
}

// Email template functions
function getInvitationHTML(payload: EmailPayload): string {
  const docsList = payload.requiredDocs?.slice(0, 6).join(', ') + (payload.requiredDocs && payload.requiredDocs.length > 6 ? ' …und weitere' : '');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload-Einladung</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Subfix</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Digitale Nachunternehmer-Verwaltung</p>
      </div>
      
      <h2 style="color: #1f2937;">Hallo ${payload.contractorName},</h2>
      
      <p><strong>${payload.customerName}</strong> nutzt Subfix für die digitale Verwaltung von Nachunternehmern. Für einen schnellen Projektstart benötigen wir einige Ihrer Unterlagen.</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Benötigte Unterlagen:</h3>
        <p style="margin-bottom: 0;">${docsList}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payload.magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Upload starten</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Hinweis:</strong> Sie können den Upload jederzeit unterbrechen und später über denselben Link fortsetzen. Fotos per Smartphone sind vollkommen ausreichend.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:support@subfix.app">support@subfix.app</a><br>
        Diese E-Mail wurde im Auftrag von ${payload.customerName} gesendet.
      </p>
    </body>
    </html>
  `;
}

function getInvitationText(payload: EmailPayload): string {
  const docsList = payload.requiredDocs?.slice(0, 6).join(', ') + (payload.requiredDocs && payload.requiredDocs.length > 6 ? ' …und weitere' : '');
  
  return `
Hallo ${payload.contractorName},

${payload.customerName} nutzt Subfix für die digitale Verwaltung von Nachunternehmern. Für einen schnellen Projektstart benötigen wir einige Ihrer Unterlagen.

Benötigte Unterlagen:
${docsList}

Upload starten: ${payload.magicLink}

Hinweis: Sie können den Upload jederzeit unterbrechen und später über denselben Link fortsetzen. Fotos per Smartphone sind vollkommen ausreichend.

Bei Fragen erreichen Sie uns unter support@subfix.app
Diese E-Mail wurde im Auftrag von ${payload.customerName} gesendet.
  `.trim();
}

function getReminderHTML(payload: EmailPayload): string {
  const docsList = payload.requiredDocs?.join(', ') || '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Erinnerung</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Subfix</h1>
      </div>
      
      <h2 style="color: #1f2937;">Hallo ${payload.contractorName},</h2>
      
      <p>für Ihr Projekt mit <strong>${payload.customerName}</strong> fehlen noch folgende Unterlagen:</p>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>Fehlende Unterlagen:</strong><br>${docsList}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payload.magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Upload fortsetzen</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Tipp:</strong> Fotos per Smartphone sind völlig ausreichend – Sie müssen die Dokumente nicht scannen.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:support@subfix.app">support@subfix.app</a>
      </p>
    </body>
    </html>
  `;
}

function getReminderText(payload: EmailPayload): string {
  const docsList = payload.requiredDocs?.join(', ') || '';
  
  return `
Hallo ${payload.contractorName},

für Ihr Projekt mit ${payload.customerName} fehlen noch folgende Unterlagen:

${docsList}

Upload fortsetzen: ${payload.magicLink}

Tipp: Fotos per Smartphone sind völlig ausreichend – Sie müssen die Dokumente nicht scannen.

Bei Fragen erreichen Sie uns unter support@subfix.app
  `.trim();
}

function getUploadReceivedHTML(payload: EmailPayload): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload erhalten</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Subfix</h1>
      </div>
      
      <h2 style="color: #1f2937;">Vielen Dank, ${payload.contractorName}!</h2>
      
      <p>Wir haben Ihre Unterlagen erhalten und werden sie schnellstmöglich prüfen.</p>
      
      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;"><strong>Nächste Schritte:</strong><br>
        ${payload.customerName} prüft Ihre Unterlagen und gibt Ihnen Bescheid, sobald alles in Ordnung ist.</p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:support@subfix.app">support@subfix.app</a>
      </p>
    </body>
    </html>
  `;
}

function getUploadReceivedText(payload: EmailPayload): string {
  return `
Vielen Dank, ${payload.contractorName}!

Wir haben Ihre Unterlagen erhalten und werden sie schnellstmöglich prüfen.

Nächste Schritte:
${payload.customerName} prüft Ihre Unterlagen und gibt Ihnen Bescheid, sobald alles in Ordnung ist.

Bei Fragen erreichen Sie uns unter support@subfix.app
  `.trim();
}

function getDocAcceptedHTML(payload: EmailPayload): string {
  const validityInfo = payload.validUntil ? `<p><strong>Gültig bis:</strong> ${payload.validUntil}</p>` : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dokument akzeptiert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Subfix</h1>
      </div>
      
      <h2 style="color: #1f2937;">Dokument akzeptiert ✅</h2>
      
      <p>Hallo ${payload.contractorName},</p>
      
      <p>Ihr Dokument <strong>"${payload.docLabel}"</strong> wurde erfolgreich akzeptiert.</p>
      
      ${validityInfo}
      
      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;">Kein weiterer Handlungsbedarf für dieses Dokument.</p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:support@subfix.app">support@subfix.app</a>
      </p>
    </body>
    </html>
  `;
}

function getDocAcceptedText(payload: EmailPayload): string {
  const validityInfo = payload.validUntil ? `Gültig bis: ${payload.validUntil}` : '';
  
  return `
Dokument akzeptiert ✅

Hallo ${payload.contractorName},

Ihr Dokument "${payload.docLabel}" wurde erfolgreich akzeptiert.

${validityInfo}

Kein weiterer Handlungsbedarf für dieses Dokument.

Bei Fragen erreichen Sie uns unter support@subfix.app
  `.trim();
}

function getDocRejectedHTML(payload: EmailPayload): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dokument korrigieren</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Subfix</h1>
      </div>
      
      <h2 style="color: #1f2937;">Bitte korrigieren Sie Ihr Dokument</h2>
      
      <p>Hallo ${payload.contractorName},</p>
      
      <p>Ihr Dokument <strong>"${payload.docLabel}"</strong> konnte leider nicht akzeptiert werden.</p>
      
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Grund:</strong><br>${payload.reason}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payload.magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Dokument neu hochladen</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:support@subfix.app">support@subfix.app</a>
      </p>
    </body>
    </html>
  `;
}

function getDocRejectedText(payload: EmailPayload): string {
  return `
Bitte korrigieren Sie Ihr Dokument

Hallo ${payload.contractorName},

Ihr Dokument "${payload.docLabel}" konnte leider nicht akzeptiert werden.

Grund: ${payload.reason}

Dokument neu hochladen: ${payload.magicLink}

Bei Fragen erreichen Sie uns unter support@subfix.app
  `.trim();
}

function getExpiryWarningHTML(payload: EmailPayload): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ablaufwarnung</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Subfix</h1>
      </div>
      
      <h2 style="color: #1f2937;">Dokument läuft bald ab ⏰</h2>
      
      <p>Hallo ${payload.contractorName},</p>
      
      <p>Ihr Dokument <strong>"${payload.docLabel}"</strong> läuft in <strong>${payload.days} Tagen</strong> ab.</p>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;">Bitte laden Sie eine aktualisierte Version hoch, um Unterbrechungen zu vermeiden.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payload.magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Aktualisierte Unterlage hochladen</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:support@subfix.app">support@subfix.app</a>
      </p>
    </body>
    </html>
  `;
}

function getExpiryWarningText(payload: EmailPayload): string {
  return `
Dokument läuft bald ab ⏰

Hallo ${payload.contractorName},

Ihr Dokument "${payload.docLabel}" läuft in ${payload.days} Tagen ab.

Bitte laden Sie eine aktualisierte Version hoch, um Unterbrechungen zu vermeiden.

Aktualisierte Unterlage hochladen: ${payload.magicLink}

Bei Fragen erreichen Sie uns unter support@subfix.app
  `.trim();
}

function getResumeUploadHTML(payload: EmailPayload): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload fortsetzen</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Subfix</h1>
      </div>
      
      <h2 style="color: #1f2937;">Hallo ${payload.contractorName},</h2>
      
      <p>Sie können Ihren Upload jederzeit fortsetzen.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payload.magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Upload fortsetzen</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:support@subfix.app">support@subfix.app</a>
      </p>
    </body>
    </html>
  `;
}

function getResumeUploadText(payload: EmailPayload): string {
  return `
Hallo ${payload.contractorName},

Sie können Ihren Upload jederzeit fortsetzen.

Upload fortsetzen: ${payload.magicLink}

Bei Fragen erreichen Sie uns unter support@subfix.app
  `.trim();
}

export async function sendEmail(
  type: EmailType,
  payload: EmailPayload
): Promise<{ ok: true; mode: "resend" | "stub" } | { ok: false; error: string }> {
  try {
    // Check if contractor exists and is active
    const contractor = getContractor(payload.contractorId);
    if (!contractor) {
      return { ok: false, error: "Nachunternehmer nicht gefunden" };
    }
    
    if (!contractor.active) {
      return { ok: false, error: "inactive" };
    }
    
    if (!payload.to) {
      return { ok: false, error: "Keine E-Mail-Adresse hinterlegt" };
    }
    
    // Check rate limit
    if (!checkRateLimit(payload.contractorId, type)) {
      return { ok: false, error: "rate_limited" };
    }
    
    // Create magic link if needed
    if (["invitation", "reminder_missing", "doc_rejected", "expiry_warning", "resume_upload"].includes(type)) {
      if (!payload.magicLink) {
        const { url } = createUploadToken(payload.contractorId);
        payload.magicLink = url;
      }
    }
    
    // Send email
    const hasResendKey = !!import.meta.env.VITE_RESEND_API_KEY;
    let result: { ok: boolean; error?: string };
    let mode: "resend" | "stub";
    
    if (hasResendKey) {
      result = await sendViaResend(type, payload);
      mode = "resend";
    } else {
      // Stub mode
      console.info('[email:stub]', { type, payload: { ...payload, magicLink: payload.magicLink ? '***MASKED***' : undefined } });
      result = { ok: true };
      mode = "stub";
    }
    
    // Update rate limit and log activity
    if (result.ok) {
      updateRateLimit(payload.contractorId, type);
    }
    
    logActivity({
      tsISO: new Date().toISOString(),
      type,
      contractorId: payload.contractorId,
      to: payload.to,
      mode,
      result: result.ok ? "ok" : "error",
      error: result.ok ? undefined : (result as any).error
    });
    
    if (result.ok) {
      return { ok: true, mode };
    } else {
      return { ok: false, error: (result as any).error || "Unknown error" };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    logActivity({
      tsISO: new Date().toISOString(),
      type,
      contractorId: payload.contractorId,
      to: payload.to,
      mode: "stub",
      result: "error",
      error: errorMessage
    });
    
    return { ok: false, error: errorMessage };
  }
}

// Export activity log for admin views
export function getEmailActivity(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(ACTIVITY_LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Legacy functions for backward compatibility
export async function sendInvitation(args: {
  to: string;
  inviteMessage: string;
  contractorName: string;
  magicLink: string;
}): Promise<{ isStub: boolean }> {
  // Legacy function - keep for compatibility
  console.info('[email:stub] sendInvitation', args);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { isStub: true };
}

// New magic-link invitation function
export async function sendMagicInvitation(args: {
  contractorId: string;
  email: string;
  contractorName: string;
  companyName: string;
  requiredDocs: string[];
}): Promise<{ isStub: boolean; magicLink?: string }> {
  try {
    // Create magic link token
    const { url: magicLinkUrl } = createUploadToken(args.contractorId);
    
    console.info('[email] Sending magic link invitation', { 
      contractorId: args.contractorId, 
      email: args.email,
      magicLink: magicLinkUrl
    });

    const result = await sendEmail('invitation', {
      to: args.email,
      contractorName: args.contractorName,
      customerName: args.companyName,
      contractorId: args.contractorId,
      requiredDocs: args.requiredDocs,
      magicLink: magicLinkUrl
    });

    if (result.ok) {
      console.log("Magic link invitation sent successfully:", result);
      return { isStub: result.mode === 'stub', magicLink: magicLinkUrl };
    } else {
      const errorMessage = result.ok ? 'Unknown error' : (result as any).error || 'Unknown error';
      console.warn('Email sending failed, using stub mode:', errorMessage);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { isStub: true, magicLink: magicLinkUrl };
    }
    
  } catch (error: any) {
    console.warn("Error sending magic link invitation, falling back to stub:", error);
    
    // Create magic link even if email fails
    const { url: magicLinkUrl } = createUploadToken(args.contractorId);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return { isStub: true, magicLink: magicLinkUrl };
  }
}

export async function sendReminderMissing(args: {
  to: string;
  missingDocs: string[];
  contractorName: string;
  magicLink: string;
}): Promise<{ isStub: boolean }> {
  try {
    console.log('Sending reminder email via new system:', args);
    
    // We need contractorId to use the new system, but legacy doesn't provide it
    // For now, fall back to stub mode
    console.info('[email:stub] sendReminderMissing (legacy)', args);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { isStub: true };
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
