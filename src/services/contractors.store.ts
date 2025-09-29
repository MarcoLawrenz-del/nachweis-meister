// ============= Hybrid Contractors Service =============
// This provides synchronous API with Supabase backend through caching

// Re-export from hybrid service
export {
  listContractors,
  getContractors,
  getAllContractors,
  getContractor,
  getContractorAsync,
  createContractor,
  updateContractor,
  deleteContractor,
  updateConditionalAnswers,
  updateOrgFlags,
  subscribe,
  forceRefresh,
  forceRefreshAsync,
  type Contractor
} from './contractors.hybrid';