import type { ValidityStrategy } from "@/config/documentTypes";
import { getValidityRule, type DocValidityRule } from "@/config/docValidity.defaults";

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

// New validity computation based on document validity rules
export function computeValidUntilFromRule(
  documentTypeId: string, 
  acceptedAt = new Date(), 
  userDate?: string | null
): {
  validUntil: string | null;
  validitySource: "user" | "auto" | "none";
} {
  // If user provided a date, use it
  if (userDate) {
    return {
      validUntil: userDate,
      validitySource: "user"
    };
  }

  const rule = getValidityRule(documentTypeId);
  
  switch (rule.mode) {
    case "none":
      return {
        validUntil: null,
        validitySource: "none"
      };
      
    case "fixedMonths":
    case "maxMonths": {
      const d = new Date(acceptedAt);
      d.setMonth(d.getMonth() + rule.months);
      return {
        validUntil: d.toISOString().split('T')[0],
        validitySource: "auto"
      };
    }
    
    case "custom": {
      const d = new Date(acceptedAt);
      d.setMonth(d.getMonth() + rule.defaultMonths);
      return {
        validUntil: d.toISOString().split('T')[0],
        validitySource: "auto"
      };
    }
    
    default:
      return {
        validUntil: null,
        validitySource: "none"
      };
  }
}

export const isExpired = (dt: Date | null) => !!dt && +dt < Date.now();

export const isExpiring = (dt: Date | null, days = 30) => 
  dt ? (+dt - Date.now()) > 0 && (+dt - Date.now()) <= days * 864e5 : false;