// ============= Hybrid Documents Service =============
// This provides synchronous API with Supabase backend through caching

// Re-export from hybrid service
export {
  getDocs,
  setDocs,
  upsertDoc,
  subscribe,
  markUploaded,
  getContractorMeta,
  setContractorMeta,
  updateDocumentRequirement,
  type ContractorDocument,
  type ContractorMeta
} from './contractorDocs.hybrid';