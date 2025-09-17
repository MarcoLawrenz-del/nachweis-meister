// Contractor CRUD operations - thin wrapper around store
export { listContractors, getContractor, createContractor, updateContractor, deleteContractor } from "./contractors.store";

// P2: Extended types for tri-state requirements and document status
export type Requirement = "required" | "optional" | "hidden";
export type DocStatus = "missing" | "submitted" | "in_review" | "accepted" | "rejected" | "expired";

export type ContractorDocument = {
  contractorId: string;
  documentTypeId: string;
  requirement: Requirement;
  status: DocStatus;
  validUntil?: string | null;
  rejectionReason?: string | null;
};

// Map der (vorläufig) konfigurierten Anforderungen je Paket:
export type PackageProfile = Record<string, Requirement>;
export const PACKAGE_PROFILES: Record<string, PackageProfile> = {
  Standard: {
    haftpflicht: "required",
    freistellungsbescheinigung: "required",
    gewerbeanmeldung: "optional",
    unbedenklichkeitsbescheinigung: "optional",
    handelsregisterauszug: "optional",
    kk_unbedenklichkeit: "optional",
    bg_mitgliedschaft: "optional",
    avv: "optional",
    a1_bescheinigung: "hidden",
  },
  Minimal: {
    haftpflicht: "required",
    freistellungsbescheinigung: "required",
    gewerbeanmeldung: "hidden",
    unbedenklichkeitsbescheinigung: "hidden",
    handelsregisterauszug: "hidden",
    kk_unbedenklichkeit: "hidden",
    bg_mitgliedschaft: "hidden",
    avv: "hidden",
    a1_bescheinigung: "hidden",
  },
  Erweitert: {
    haftpflicht: "required",
    freistellungsbescheinigung: "required",
    gewerbeanmeldung: "optional",
    unbedenklichkeitsbescheinigung: "optional",
    handelsregisterauszug: "optional",
    kk_unbedenklichkeit: "optional",
    bg_mitgliedschaft: "optional",
    avv: "optional",
    a1_bescheinigung: "optional",
  },
} as const;

import { getDocs, setDocs, upsertDoc } from "./contractorDocs.store";
import { isExpiring } from "@/utils/validity";

export async function seedDocumentsForContractor(contractorId: string, packageId: string, customRequirements?: Record<string, Requirement>) {
  const profile = customRequirements || (PACKAGE_PROFILES[packageId] ?? {});
  const created: ContractorDocument[] = [];
  const seen = ((globalThis as any).__DOC_SEED__ ??= new Set<string>()) as Set<string>;
  
  for (const [documentTypeId, requirement] of Object.entries(profile)) {
    const key = `${contractorId}:${documentTypeId}`;
    if (seen.has(key)) continue;
    
    created.push({ 
      contractorId, 
      documentTypeId, 
      requirement, 
      status: "missing", 
      validUntil: null, 
      rejectionReason: null 
    });
    seen.add(key);
    
    console.info("[mock] createContractorDocument", { 
      contractorId, 
      documentTypeId, 
      status: "missing", 
      requirement 
    });
  }
  
  console.info("[mock] seeded docs", { 
    contractorId, 
    packageId, 
    count: created.length 
  });
  
  // Update store
  const merged = [...getDocs(contractorId)];
  for (const cd of created) { 
    if (!merged.some(x => x.documentTypeId === cd.documentTypeId)) merged.push(cd); 
  }
  setDocs(contractorId, merged);
  
  return created;
}

export async function setDocumentStatus(input: { 
  contractorId: string; 
  documentTypeId: string; 
  status: DocStatus; 
  validUntil?: string | null; 
  reason?: string | null; 
}) {
  console.info("[mock] setDocumentStatus", input);
  
  // Update store
  const currentReq = getDocs(input.contractorId).find(d => d.documentTypeId === input.documentTypeId)?.requirement ?? "required";
  upsertDoc(input.contractorId, {
    contractorId: input.contractorId,
    documentTypeId: input.documentTypeId,
    requirement: currentReq,
    status: input.status,
    validUntil: input.validUntil ?? null,
    rejectionReason: input.reason ?? null,
  });
  
  return input;
}

export type Aggregate = "complete" | "attention" | "missing";
export function aggregateContractorStatusById(contractorId:string): Aggregate {
  const docs = getDocs(contractorId);
  const required = docs.filter(d => d.requirement==="required");
  if (required.length===0) return "missing";
  const hasMissing = required.some(d => ["missing","rejected","expired"].includes(d.status));
  const hasReview  = docs.some(d => ["submitted","in_review"].includes(d.status));
  const hasExpiring = docs.some(d => d.status==="accepted" && d.validUntil && isExpiring(new Date(d.validUntil),30));
  if (hasMissing) return "missing";
  if (hasReview || hasExpiring) return "attention";
  return "complete";
}

export function aggregateContractorStatus(docs: ContractorDocument[]): "complete" | "attention" | "missing" {
  if (!docs || docs.length === 0) return "missing";
  
  const requiredDocs = docs.filter(doc => doc.requirement === "required");
  if (requiredDocs.length === 0) return "missing";
  
  const hasMissing = requiredDocs.some(d => ["missing","rejected","expired"].includes(d.status));
  const hasReview = docs.some(d => ["submitted","in_review"].includes(d.status));
  const hasExpiring = docs.some(d => d.status==="accepted" && d.validUntil && isExpiring(new Date(d.validUntil),30));
  
  if (hasMissing) return "missing";
  if (hasReview || hasExpiring) return "attention";
  return "complete";
}
