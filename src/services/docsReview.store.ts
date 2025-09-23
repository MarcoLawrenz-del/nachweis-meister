import { v4 as uuidv4 } from 'uuid';

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
  kind:
    | "file_uploaded"
    | "status_set_submitted" 
    | "status_set_in_review"
    | "status_set_accepted"
    | "status_set_rejected"
    | "note_added";
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

const STORAGE_KEY = 'subfix.docsReview.v1';

interface StoreData {
  files: ReviewFile[];
  decisions: ReviewDecisionState[];
  events: ReviewEvent[];
}

function getStore(): StoreData {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { files: [], decisions: [], events: [] };
  }
  try {
    return JSON.parse(data);
  } catch {
    return { files: [], decisions: [], events: [] };
  }
}

function saveStore(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addReviewFile(input: Omit<ReviewFile, "id" | "uploadedAtISO"> & { dataUrl?: string }): ReviewFile {
  const file: ReviewFile = {
    ...input,
    id: uuidv4(),
    uploadedAtISO: new Date().toISOString()
  };
  
  const store = getStore();
  store.files.push(file);
  saveStore(store);
  
  return file;
}

export function getLatestFile(contractorId: string, docType: string): ReviewFile | undefined {
  const store = getStore();
  const files = store.files
    .filter(f => f.contractorId === contractorId && f.docType === docType)
    .sort((a, b) => new Date(b.uploadedAtISO).getTime() - new Date(a.uploadedAtISO).getTime());
  
  return files[0];
}

export function setDecision(input: { 
  contractorId: string; 
  docType: string; 
  decision: ReviewDecision; 
  reason?: string; 
  actor?: "admin" 
}): ReviewDecisionState {
  const decision: ReviewDecisionState = {
    contractorId: input.contractorId,
    docType: input.docType,
    decision: input.decision,
    reason: input.reason,
    decidedAtISO: new Date().toISOString(),
    decidedBy: input.actor || "admin"
  };
  
  const store = getStore();
  const existingIndex = store.decisions.findIndex(
    d => d.contractorId === input.contractorId && d.docType === input.docType
  );
  
  if (existingIndex >= 0) {
    store.decisions[existingIndex] = decision;
  } else {
    store.decisions.push(decision);
  }
  
  saveStore(store);
  return decision;
}

export function appendEvent(ev: Omit<ReviewEvent, "id" | "tsISO">): ReviewEvent {
  const event: ReviewEvent = {
    ...ev,
    id: uuidv4(),
    tsISO: new Date().toISOString()
  };
  
  const store = getStore();
  store.events.unshift(event); // newest first
  saveStore(store);
  
  return event;
}

export function getDocReview(contractorId: string, docType: string): DocReviewAggregate {
  const store = getStore();
  
  const latestFile = getLatestFile(contractorId, docType);
  
  let decision = store.decisions.find(
    d => d.contractorId === contractorId && d.docType === docType
  );
  
  if (!decision) {
    decision = {
      contractorId,
      docType,
      decision: "pending"
    };
  }
  
  const history = store.events.filter(
    e => e.contractorId === contractorId && e.docType === docType
  );
  
  return {
    latestFile,
    decision,
    history
  };
}

export function listDocReviews(contractorId: string): DocReviewAggregate[] {
  const store = getStore();
  
  // Get all unique doc types for this contractor
  const docTypes = new Set<string>();
  store.files.forEach(f => {
    if (f.contractorId === contractorId) {
      docTypes.add(f.docType);
    }
  });
  store.decisions.forEach(d => {
    if (d.contractorId === contractorId) {
      docTypes.add(d.docType);
    }
  });
  store.events.forEach(e => {
    if (e.contractorId === contractorId) {
      docTypes.add(e.docType);
    }
  });
  
  return Array.from(docTypes).map(docType => getDocReview(contractorId, docType));
}

export function getAllRecentEvents(daysBack: number = 7): ReviewEvent[] {
  const store = getStore();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  
  return store.events.filter(e => new Date(e.tsISO) >= cutoff);
}

export function clearReviewForDoc(contractorId: string, docType: string): void {
  const store = getStore();
  
  store.files = store.files.filter(f => !(f.contractorId === contractorId && f.docType === docType));
  store.decisions = store.decisions.filter(d => !(d.contractorId === contractorId && d.docType === docType));
  store.events = store.events.filter(e => !(e.contractorId === contractorId && e.docType === docType));
  
  saveStore(store);
}