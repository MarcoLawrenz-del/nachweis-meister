import { z } from 'zod';
import { debug } from './debug';

// Input validation schemas
export const emailSchema = z.string().email('Ungültige E-Mail-Adresse').min(1, 'E-Mail ist erforderlich');

export const passwordSchema = z
  .string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten');

export const nameSchema = z
  .string()
  .min(2, 'Name muss mindestens 2 Zeichen lang sein')
  .max(100, 'Name darf höchstens 100 Zeichen lang sein')
  .regex(/^[a-zA-ZäöüÄÖÜß\s-']+$/, 'Name enthält ungültige Zeichen');

export const companyNameSchema = z
  .string()
  .min(2, 'Firmenname muss mindestens 2 Zeichen lang sein')
  .max(200, 'Firmenname darf höchstens 200 Zeichen lang sein')
  .regex(/^[a-zA-ZäöüÄÖÜß0-9\s\-&.,()]+$/, 'Firmenname enthält ungültige Zeichen');

export const tokenSchema = z
  .string()
  .min(10, 'Token zu kurz')
  .max(255, 'Token zu lang')
  .regex(/^[a-zA-Z0-9\-_]+$/, 'Token enthält ungültige Zeichen');

// Sanitization functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/[<>]/g, ''); // Remove < and > characters
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Rate limiting helper
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier);

    if (!attempts) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - attempts.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if limit exceeded
    if (attempts.count >= this.maxAttempts) {
      return false;
    }

    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier);
    if (!attempts || attempts.count < this.maxAttempts) {
      return 0;
    }

    const timeLeft = this.windowMs - (Date.now() - attempts.lastAttempt);
    return Math.max(0, timeLeft);
  }
}

// Export singleton rate limiter for authentication
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

// Audit logging
export interface AuditLogEntry {
  action: string;
  userId?: string;
  userEmail?: string;
  details?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];

  log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.logs.push(auditEntry);
    debug.log('AUDIT:', auditEntry);

    // TODO: Send to backend logging service
    // this.sendToBackend(auditEntry);
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  // private async sendToBackend(entry: AuditLogEntry) {
  //   try {
  //     await fetch('/api/audit-logs', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(entry),
  //     });
  //   } catch (error) {
  //     console.error('Failed to send audit log:', error);
  //   }
  // }
}

export const auditLogger = new AuditLogger();