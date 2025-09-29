// ============= Reviews Store Migration to Supabase =============
// This replaces docsReview.store.ts with Supabase integration

export {
  // Review operations
  getSupabaseReviewHistory,
  addSupabaseReviewEntry,
  getRecentSupabaseActivity,
  subscribeToReviewChanges,
  
  // Legacy compatibility
  getAllRecentEvents,
  appendEvent,
  getDocReview,
  
  // Types
  type SupabaseReviewHistory
} from './supabaseReviews';

// Legacy types for backward compatibility
export type Uploader = "contractor" | "admin";
export type ReviewDecision = "pending" | "accepted" | "rejected";

export interface ReviewFile {
  id: string;
  contractorId: string;
  docType: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAtISO: string;
  uploader: Uploader;
  dataUrl?: string;
  blobUrl?: string;
}

export interface ReviewEvent {
  id: string;
  contractorId: string;
  docType: string;
  tsISO: string;
  kind: string;
  meta?: Record<string, any>;
  actor: "system" | "admin" | "contractor";
}

export interface ReviewDecisionState {
  contractorId: string;
  docType: string;
  decision: ReviewDecision;
  reason?: string;
  decidedAtISO?: string;
  decidedBy?: "admin";
}

export interface DocReviewAggregate {
  latestFile?: ReviewFile;
  decision: ReviewDecisionState;
  history: ReviewEvent[];
}

// Import Supabase functions
import { 
  getAllRecentEvents,
  appendEvent,
  getDocReview
} from './supabaseReviews';

// Legacy compatibility functions that are now no-ops or redirected to Supabase
export function addReviewFile(input: Omit<ReviewFile, "id" | "uploadedAtISO"> & { dataUrl?: string }): ReviewFile {
  console.warn('addReviewFile: Files are now managed through Supabase documents table');
  return {
    id: crypto.randomUUID(),
    uploadedAtISO: new Date().toISOString(),
    ...input
  };
}

export function getLatestFile(contractorId: string, docType: string): ReviewFile | undefined {
  console.warn('getLatestFile: Use Supabase documents instead');
  return undefined;
}

export function setDecision(input: { 
  contractorId: string; 
  docType: string; 
  decision: ReviewDecision; 
  reason?: string; 
  actor?: "admin" 
}): ReviewDecisionState {
  console.warn('setDecision: Use updateRequirementStatus instead');
  return {
    contractorId: input.contractorId,
    docType: input.docType,
    decision: input.decision,
    reason: input.reason,
    decidedAtISO: new Date().toISOString(),
    decidedBy: input.actor || "admin"
  };
}

export function listDocReviews(contractorId: string): DocReviewAggregate[] {
  console.warn('listDocReviews: Use Supabase requirements/documents instead');
  return [];
}

export function clearReviewForDoc(contractorId: string, docType: string): void {
  console.warn('clearReviewForDoc: Use Supabase document deletion instead');
}