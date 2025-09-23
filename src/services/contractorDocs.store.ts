import type { ContractorDocument } from "./contractors";
import { isExpired } from "@/utils/validity";

const db = new Map<string, ContractorDocument[]>();
const listeners = new Map<string, Set<() => void>>();

const LS_KEY = (id: string) => `contractorDocs:${id}`;
function load(id: string) { 
  if (typeof window === "undefined") return null; 
  try { 
    const s = localStorage.getItem(LS_KEY(id)); 
    return s ? JSON.parse(s) : null; 
  } catch { 
    return null; 
  } 
}
function save(id: string, docs: ContractorDocument[]) { 
  if (typeof window === "undefined") return; 
  try { 
    localStorage.setItem(LS_KEY(id), JSON.stringify(docs)); 
  } catch {} 
}

// Function to update expired documents
function updateExpiredDocuments(docs: ContractorDocument[]): ContractorDocument[] {
  return docs.map(doc => {
    // Only check accepted documents with validUntil dates
    if (doc.status === 'accepted' && doc.validUntil) {
      const validUntilDate = new Date(doc.validUntil);
      if (isExpired(validUntilDate)) {
        return { ...doc, status: 'expired' as ContractorDocument['status'] };
      }
    }
    return doc;
  });
}

export function getDocs(id: string) { 
  const m = db.get(id); 
  if (m) {
    // Check for expired documents and update if needed
    const updatedDocs = updateExpiredDocuments(m);
    if (JSON.stringify(updatedDocs) !== JSON.stringify(m)) {
      setDocs(id, updatedDocs);
      return updatedDocs;
    }
    return m;
  } 
  const fromLS = load(id) ?? []; 
  const updatedDocs = updateExpiredDocuments(fromLS);
  db.set(id, updatedDocs); 
  if (JSON.stringify(updatedDocs) !== JSON.stringify(fromLS)) {
    save(id, updatedDocs);
  }
  return updatedDocs; 
}

export function setDocs(id: string, docs: ContractorDocument[]) { 
  db.set(id, docs); 
  save(id, docs); 
  listeners.get(id)?.forEach(fn => fn()); 
}

export function upsertDoc(id: string, doc: ContractorDocument) {
  const cur = getDocs(id); 
  const i = cur.findIndex(d => d.documentTypeId === doc.documentTypeId);
  if (i >= 0) cur[i] = doc; 
  else cur.push(doc); 
  setDocs(id, [...cur]);
}

export function markUploaded(args: {
  contractorId: string;
  type: string;
  file: { name: string; type: string; size: number; dataUrl: string };
  uploadedBy: 'admin' | 'contractor';
  accept?: boolean;
  validUntil?: string | null;
}) {
  const { contractorId, type, file, uploadedBy, accept = false, validUntil } = args;
  const cur = getDocs(contractorId);
  const doc = cur.find(d => d.documentTypeId === type);
  
  if (!doc) return;
  
  let finalValidUntil = validUntil;
  if (accept && !validUntil) {
    // Auto-compute validity if accepting without explicit date
    const { computeValidUntil } = require('@/utils/validity');
    const { DOCUMENT_TYPES } = require('@/config/documentTypes');
    const docType = DOCUMENT_TYPES.find(dt => dt.id === type);
    if (docType?.validity) {
      const computed = computeValidUntil(docType.validity);
      finalValidUntil = computed?.toISOString() || null;
    }
  }
  
  const updatedDoc: ContractorDocument = {
    ...doc,
    status: (accept ? 'accepted' : 'submitted') as ContractorDocument['status'],
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileUrl: file.dataUrl,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    validUntil: finalValidUntil,
  };
  
  upsertDoc(contractorId, updatedDoc);
}

export function subscribe(id: string, fn: () => void) { 
  const s = listeners.get(id) ?? new Set(); 
  s.add(fn); 
  listeners.set(id, s); 
  return () => { s.delete(fn); }; 
}

// Meta
type ContractorMeta = { lastRequestedAt?: string };
const metaDb = new Map<string, ContractorMeta>();
const META_KEY = (id:string)=>`contractorDocsMeta:${id}`;
export function getContractorMeta(id:string): ContractorMeta {
  if (!metaDb.get(id)) {
    const raw = localStorage.getItem(META_KEY(id));
    metaDb.set(id, raw ? JSON.parse(raw) : {});
  }
  return metaDb.get(id)!;
}
export function setContractorMeta(id:string, m:ContractorMeta){
  const cur = { ...getContractorMeta(id), ...m };
  metaDb.set(id, cur);
  localStorage.setItem(META_KEY(id), JSON.stringify(cur));
  listeners.get(id)?.forEach(fn=>fn());
}

export function updateDocumentRequirement(contractorId: string, documentTypeId: string, requirement: 'required' | 'optional') {
  const docs = getDocs(contractorId);
  const docIndex = docs.findIndex(d => d.documentTypeId === documentTypeId);
  
  if (docIndex >= 0) {
    const updatedDoc = { ...docs[docIndex], requirement };
    const updatedDocs = [...docs];
    updatedDocs[docIndex] = updatedDoc;
    setDocs(contractorId, updatedDocs);
  }
}