// ============= Hybrid Documents Service =============
// Provides synchronous API with async Supabase backend + caching

import { 
  getDocumentsForContractor,
  subscribeToDocumentChanges
} from './supabaseDocuments';

export type ContractorDocument = {
  contractorId: string;
  documentTypeId: string;
  requirement: 'required' | 'optional' | 'hidden';
  status: 'missing' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'in_review';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
  uploadedBy?: 'admin' | 'contractor';
  uploadedAt?: string;
  validUntil?: string | null;
  validitySource?: 'admin' | 'auto' | 'none' | 'user';
  file?: any;
  review?: any;
  history?: any[];
  label?: string;
  customName?: string;
  userUnknownExpiry?: boolean;
  rejectionReason?: string;
};

// Cache layer
const docsCache = new Map<string, ContractorDocument[]>();
const cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = 30000; // 30 seconds
const listeners = new Map<string, Set<() => void>>();

// Refresh cache for contractor
async function refreshDocsCache(contractorId: string) {
  try {
    const supabaseDocs = await getDocumentsForContractor(contractorId);
    // Convert Supabase docs to legacy format
    const legacyDocs: ContractorDocument[] = supabaseDocs.map(doc => ({
      contractorId,
      documentTypeId: doc.document_type_id || '',
      requirement: 'required',
      status: (doc.status as any) || 'missing',
      fileName: doc.file_name,
      fileType: doc.mime_type,
      fileSize: doc.file_size,
      fileUrl: doc.file_url,
      uploadedBy: 'contractor',
      uploadedAt: doc.uploaded_at,
      validUntil: doc.valid_to,
      validitySource: 'auto',
      file: {
        url: doc.file_url,
        name: doc.file_name,
        size: doc.file_size,
        mime: doc.mime_type
      }
    }));
    
    docsCache.set(contractorId, legacyDocs);
    cacheTimestamps.set(contractorId, Date.now());
    
    // Notify listeners
    const contractorListeners = listeners.get(contractorId);
    if (contractorListeners) {
      contractorListeners.forEach(fn => fn());
    }
  } catch (error) {
    console.error('Error refreshing docs cache for contractor:', contractorId, error);
    // Set empty array on error
    docsCache.set(contractorId, []);
  }
}

// ============= SYNCHRONOUS API =============

export function getDocs(contractorId: string): ContractorDocument[] {
  const cached = docsCache.get(contractorId);
  const timestamp = cacheTimestamps.get(contractorId) || 0;
  
  // If no cache or expired, refresh asynchronously
  if (!cached || Date.now() - timestamp > CACHE_DURATION) {
    refreshDocsCache(contractorId);
    // Return empty array for now, will update when cache refreshes
    return cached || [];
  }
  
  return cached;
}

export async function setDocs(contractorId: string, docs: ContractorDocument[]): Promise<void> {
  // Update cache immediately
  docsCache.set(contractorId, docs);
  cacheTimestamps.set(contractorId, Date.now());
  
  // Notify listeners
  const contractorListeners = listeners.get(contractorId);
  if (contractorListeners) {
    contractorListeners.forEach(fn => fn());
  }
}

export async function upsertDoc(contractorId: string, doc: ContractorDocument): Promise<void> {
  const currentDocs = getDocs(contractorId);
  const existingIndex = currentDocs.findIndex(d => d.documentTypeId === doc.documentTypeId);
  
  let updatedDocs: ContractorDocument[];
  if (existingIndex >= 0) {
    updatedDocs = [...currentDocs];
    updatedDocs[existingIndex] = doc;
  } else {
    updatedDocs = [...currentDocs, doc];
  }
  
  await setDocs(contractorId, updatedDocs);
}

export function subscribe(contractorId: string, fn: () => void) {
  if (!listeners.has(contractorId)) {
    listeners.set(contractorId, new Set());
    
    // Set up Supabase subscription for this contractor
    subscribeToDocumentChanges(contractorId, () => {
      refreshDocsCache(contractorId);
    });
  }
  
  listeners.get(contractorId)!.add(fn);
  
  // Initial load
  refreshDocsCache(contractorId);
  
  return () => {
    const contractorListeners = listeners.get(contractorId);
    if (contractorListeners) {
      contractorListeners.delete(fn);
      if (contractorListeners.size === 0) {
        listeners.delete(contractorId);
      }
    }
  };
}

export async function markUploaded(args: {
  contractorId: string;
  type: string;
  file: { name: string; type: string; size: number; dataUrl: string };
  uploadedBy: 'admin' | 'contractor';
  accept?: boolean;
  validUntil?: string | null;
}): Promise<void> {
  const newDoc: ContractorDocument = {
    contractorId: args.contractorId,
    documentTypeId: args.type,
    requirement: 'required',
    status: args.accept ? 'accepted' : 'submitted',
    fileName: args.file.name,
    fileType: args.file.type,
    fileSize: args.file.size,
    fileUrl: args.file.dataUrl,
    uploadedBy: args.uploadedBy,
    uploadedAt: new Date().toISOString(),
    validUntil: args.validUntil,
    validitySource: 'admin',
    file: {
      url: args.file.dataUrl,
      name: args.file.name,
      size: args.file.size,
      mime: args.file.type
    }
  };
  
  await upsertDoc(args.contractorId, newDoc);
}

export type ContractorMeta = { lastRequestedAt?: string };

// Simple in-memory storage for contractor meta data
const contractorMetaCache = new Map<string, ContractorMeta>();

export function getContractorMeta(contractorId: string): ContractorMeta {
  return contractorMetaCache.get(contractorId) || {};
}

export function setContractorMeta(contractorId: string, meta: ContractorMeta): void {
  console.log('setContractorMeta called:', { contractorId, meta });
  
  // Update cache
  const existing = contractorMetaCache.get(contractorId) || {};
  contractorMetaCache.set(contractorId, { ...existing, ...meta });
  
  // TODO: In production, this should save to Supabase
  // For now, we just store in memory for demo purposes
}

export function updateDocumentRequirement(
  contractorId: string, 
  documentTypeId: string, 
  requirement: 'required' | 'optional'
): void {
  console.log('updateDocumentRequirement called:', { contractorId, documentTypeId, requirement });
  
  // Get current docs for contractor
  const currentDocs = docsCache.get(contractorId) || [];
  
  // Find or create document entry
  let docIndex = currentDocs.findIndex(doc => doc.documentTypeId === documentTypeId);
  
  if (docIndex >= 0) {
    // Update existing document requirement
    currentDocs[docIndex] = {
      ...currentDocs[docIndex],
      requirement
    };
  } else {
    // Create new document entry
    const newDoc: ContractorDocument = {
      contractorId,
      documentTypeId,
      status: 'missing',
      requirement,
      validitySource: 'admin'
    };
    currentDocs.push(newDoc);
  }
  
  // Update cache
  docsCache.set(contractorId, currentDocs);
  
  // Notify subscribers
  const contractorListeners = listeners.get(contractorId);
  if (contractorListeners) {
    contractorListeners.forEach(fn => fn());
  }
  
  console.log(`Updated ${documentTypeId} requirement to ${requirement} for contractor ${contractorId}`);
}