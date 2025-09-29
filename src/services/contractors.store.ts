// ============= Use existing Supabase Hooks instead =============
// LocalStorage removed - Components should use hooks directly

// Re-export existing working Supabase hook interfaces
export type { Contractor } from './contractorsSupabase';

// Legacy compatibility - redirect to hooks
export function getContractors(): any[] {
  console.warn('getContractors() deprecated - use useSupabaseContractors() hook instead');
  return [];
}

export function getAllContractors(): any[] {
  console.warn('getAllContractors() deprecated - use useSupabaseContractors() hook instead');
  return [];
}

export function listContractors(): any[] {
  console.warn('listContractors() deprecated - use useSupabaseContractors() hook instead');
  return [];
}

export function getContractor(id: string): any {
  console.warn('getContractor() deprecated - use useSubcontractorProfile() hook instead');
  return null;
}

export function subscribe(callback: () => void): () => void {
  console.warn('subscribe() deprecated - hooks handle subscriptions automatically');
  return () => {};
}

// Async functions that still work
export { 
  createContractor, 
  updateContractor, 
  deleteContractor,
  updateConditionalAnswers,
  updateOrgFlags
} from './contractorsSupabase';

// Compatibility aliases
export const forceRefreshAsync = async () => [];
export const getContractorAsync = async (id: string) => null;
export const forceRefresh = () => {};