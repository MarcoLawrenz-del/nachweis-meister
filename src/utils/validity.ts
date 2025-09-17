import type { ValidityStrategy } from "@/config/documentTypes";

export function computeValidUntil(strategy: ValidityStrategy, issuedAt = new Date()) {
  if (strategy.kind === "fixed_days") { 
    const d = new Date(issuedAt); 
    d.setDate(d.getDate() + strategy.days); 
    return d; 
  }
  if (strategy.kind === "end_of_year") { 
    return new Date(issuedAt.getFullYear(), 11, 31, 23, 59, 59); 
  }
  return null;
}

export const isExpired = (dt: Date | null) => !!dt && +dt < Date.now();

export const isExpiring = (dt: Date | null, days = 30) => 
  dt ? (+dt - Date.now()) > 0 && (+dt - Date.now()) <= days * 864e5 : false;