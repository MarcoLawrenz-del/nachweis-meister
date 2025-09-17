// ============= Organization Aggregates Service =============
// Pure aggregation utilities over localStorage stores

import { listContractors, type Contractor } from "./contractors.store";
import { getDocs, getContractorMeta } from "./contractorDocs.store";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import { aggregateContractorStatusById, type ContractorDocument } from "./contractors";
import { isExpiring, isExpired } from "@/utils/validity";

export interface OrgKPIs {
  activeContractors: number;
  missingRequiredDocs: number;
  inReview: number;
  expiring: number;
}

export interface RecentlyRequestedItem {
  contractor: Contractor;
  lastRequestedAt: string;
}

export interface ExpiringDocItem {
  contractor: Contractor;
  documentName: string;
  validUntil: string;
  documentTypeId: string;
}

export function calculateOrgKPIs(): OrgKPIs {
  const contractors = listContractors().filter(c => c.active);
  
  let missingRequiredDocs = 0;
  let inReview = 0;
  let expiring = 0;

  for (const contractor of contractors) {
    const docs = getDocs(contractor.id);
    
    // Count missing required docs (missing, rejected, expired)
    const missingRequired = docs.filter(d => 
      d.requirement === "required" && 
      ["missing", "rejected", "expired"].includes(d.status)
    ).length;
    missingRequiredDocs += missingRequired;

    // Count docs in review (submitted, in_review for all types)
    const reviewing = docs.filter(d => 
      ["submitted", "in_review"].includes(d.status)
    ).length;
    inReview += reviewing;

    // Count expiring docs (accepted docs expiring ≤30 days)
    const expiringDocs = docs.filter(d => 
      d.status === "accepted" && 
      d.validUntil && 
      isExpiring(new Date(d.validUntil), 30)
    ).length;
    expiring += expiringDocs;
  }

  return {
    activeContractors: contractors.length,
    missingRequiredDocs,
    inReview,
    expiring
  };
}

export function getRecentlyRequested(limit = 5): RecentlyRequestedItem[] {
  const contractors = listContractors().filter(c => c.active);
  const items: RecentlyRequestedItem[] = [];

  for (const contractor of contractors) {
    const meta = getContractorMeta(contractor.id);
    if (meta.lastRequestedAt) {
      items.push({
        contractor,
        lastRequestedAt: meta.lastRequestedAt
      });
    }
  }

  // Sort by most recent first
  return items
    .sort((a, b) => new Date(b.lastRequestedAt).getTime() - new Date(a.lastRequestedAt).getTime())
    .slice(0, limit);
}

export function getExpiringDocs(limit = 5): ExpiringDocItem[] {
  const contractors = listContractors().filter(c => c.active);
  const items: ExpiringDocItem[] = [];

  for (const contractor of contractors) {
    const docs = getDocs(contractor.id);
    
    const expiringDocs = docs.filter(d => 
      d.status === "accepted" && 
      d.validUntil && 
      isExpiring(new Date(d.validUntil), 30)
    );

    for (const doc of expiringDocs) {
      const docType = DOCUMENT_TYPES.find(dt => dt.id === doc.documentTypeId);
      const documentName = doc.label || doc.customName || docType?.label || doc.documentTypeId;
      
      items.push({
        contractor,
        documentName,
        validUntil: doc.validUntil!,
        documentTypeId: doc.documentTypeId
      });
    }
  }

  // Sort by earliest expiry first
  return items
    .sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime())
    .slice(0, limit);
}