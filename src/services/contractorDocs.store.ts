// ============= Use existing Supabase Hooks instead =============
// LocalStorage removed - Components should use hooks directly

// Re-export types
export type { ContractorDocument, ContractorMeta } from './contractorDocsSupabase';

// Legacy compatibility - redirect to hooks
export function getDocs(contractorId: string): any[] {
  console.warn('getDocs() deprecated - use useSupabaseRequirements() hook instead');
  return [];
}

export function setDocs(contractorId: string, docs: any[]): void {
  console.warn('setDocs() deprecated - use Supabase directly');
}

export function subscribe(callback: () => void): () => void {
  console.warn('subscribe() deprecated - hooks handle subscriptions automatically');
  return () => {};
}

// Async functions that still work
export { 
  upsertDoc,
  markUploaded,
  updateDocumentRequirement,
  getContractorMeta,
  setContractorMeta
} from './contractorDocsSupabase';