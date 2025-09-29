// ============= Hybrid Contractors Service =============
// This provides synchronous API with Supabase backend through caching

// Re-export from hybrid service
export {
  listContractors,
  getContractors,
  getAllContractors,
  getContractor,
  createContractor,
  updateContractor,
  deleteContractor,
  updateConditionalAnswers,
  updateOrgFlags,
  subscribe,
  forceRefresh,
  type Contractor
} from './contractors.hybrid';