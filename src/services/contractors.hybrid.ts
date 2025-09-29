// ============= Hybrid Contractors Service =============
// Provides synchronous API with async Supabase backend + caching

import { 
  listSupabaseContractors,
  getSupabaseContractor,
  createSupabaseContractor,
  updateSupabaseContractor,
  deleteSupabaseContractor,
  subscribeToSupabaseContractors,
  type SupabaseContractor
} from './supabaseContractors';
import { supabase } from '@/integrations/supabase/client';

// Legacy Contractor type
export type Contractor = {
  id: string;
  company_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  country?: string;
  address?: string;
  notes?: string;
  created_at: string;
  active: boolean;
  conditionalAnswers?: any;
  orgFlags?: { hrRegistered?: boolean };
  hasEmployees?: boolean;
  providesConstructionServices?: boolean;
  isSokaPflicht?: boolean;
  providesAbroad?: boolean;
  processesPersonalData?: boolean;
  selectedPackageId?: string;
};

// Cache layer
let contractorsCache: Contractor[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds
let listeners = new Set<() => void>();

// Convert Supabase to legacy format
function convertToLegacy(supabaseContractor: SupabaseContractor): Contractor {
  return {
    id: supabaseContractor.id,
    company_name: supabaseContractor.company_name,
    contact_name: supabaseContractor.contact_name,
    email: supabaseContractor.contact_email,
    phone: supabaseContractor.phone,
    country: supabaseContractor.country_code,
    address: supabaseContractor.address,
    notes: supabaseContractor.notes,
    created_at: supabaseContractor.created_at,
    active: supabaseContractor.status === 'active',
    hasEmployees: supabaseContractor.requires_employees,
    providesAbroad: supabaseContractor.has_non_eu_workers
  };
}

// Refresh cache from Supabase
async function refreshCache() {
  try {
    console.log('Refreshing contractors cache...');
    const supabaseContractors = await listSupabaseContractors();
    contractorsCache = supabaseContractors.map(convertToLegacy);
    cacheTimestamp = Date.now();
    
    console.log('Cache refreshed:', contractorsCache.length, 'contractors');
    
    // Notify listeners
    listeners.forEach(fn => fn());
  } catch (error) {
    console.error('Error refreshing contractors cache:', error);
  }
}

// Force refresh and wait for completion
async function forceRefreshAndWait(): Promise<void> {
  await refreshCache();
}

// Initialize cache
refreshCache();

// Set up realtime updates
subscribeToSupabaseContractors(() => {
  refreshCache();
});

// ============= SYNCHRONOUS API =============

export function listContractors(): Contractor[] {
  // Trigger async refresh if cache is empty or expired
  if (contractorsCache.length === 0 || Date.now() - cacheTimestamp > CACHE_DURATION) {
    console.log('Cache empty or expired, refreshing...');
    refreshCache();
  }
  
  return contractorsCache;
}

export function getContractors(): Contractor[] {
  return listContractors();
}

export function getAllContractors(): Contractor[] {
  return listContractors();
}

export function getContractor(id: string): Contractor | undefined {
  // Ensure cache is populated
  if (contractorsCache.length === 0) {
    refreshCache();
  }
  return contractorsCache.find(c => c.id === id);
}

// Async version that waits for cache refresh if needed
export async function getContractorAsync(id: string): Promise<Contractor | undefined> {
  // If cache is empty or contractor not found, force refresh and wait
  let contractor = contractorsCache.find(c => c.id === id);
  if (!contractor || contractorsCache.length === 0) {
    console.log('Contractor not in cache, forcing refresh...');
    await forceRefreshAndWait();
    contractor = contractorsCache.find(c => c.id === id);
  }
  return contractor;
}

// Async operations (background updates)
export async function createContractor(data: Omit<Contractor, "id"|"created_at"|"active"> & { active?: boolean }): Promise<Contractor> {
  const supabaseData = {
    company_name: data.company_name,
    contact_name: data.contact_name,
    contact_email: data.email,
    phone: data.phone,
    country_code: data.country || 'DE',
    address: data.address,
    notes: data.notes,
    company_type: 'baubetrieb' as const,
    // For demo mode, use a fixed tenant_id that matches our RLS policies
    tenant_id: '00000000-0000-0000-0000-000000000001',
    requires_employees: data.hasEmployees,
    has_non_eu_workers: data.providesAbroad,
    employees_not_employed_in_germany: data.providesAbroad,
    active: data.active
  };
  
  const supabaseContractor = await createSupabaseContractor(supabaseData);
  const contractor = convertToLegacy(supabaseContractor);
  
  // Update cache immediately
  contractorsCache.push(contractor);
  listeners.forEach(fn => fn());
  
  return contractor;
}

export async function updateContractor(id: string, patch: Partial<Contractor>): Promise<Contractor> {
  const supabasePatch: Partial<SupabaseContractor> = {};
  
  if (patch.company_name) supabasePatch.company_name = patch.company_name;
  if (patch.contact_name) supabasePatch.contact_name = patch.contact_name;
  if (patch.email) supabasePatch.contact_email = patch.email;
  if (patch.phone) supabasePatch.phone = patch.phone;
  if (patch.country) supabasePatch.country_code = patch.country;
  if (patch.address) supabasePatch.address = patch.address;
  if (patch.notes) supabasePatch.notes = patch.notes;
  if (patch.active !== undefined) supabasePatch.status = patch.active ? 'active' : 'inactive';
  if (patch.hasEmployees !== undefined) supabasePatch.requires_employees = patch.hasEmployees;
  if (patch.providesAbroad !== undefined) {
    supabasePatch.has_non_eu_workers = patch.providesAbroad;
    supabasePatch.employees_not_employed_in_germany = patch.providesAbroad;
  }
  
  const supabaseContractor = await updateSupabaseContractor(id, supabasePatch);
  const contractor = convertToLegacy(supabaseContractor);
  
  // Update cache immediately
  const index = contractorsCache.findIndex(c => c.id === id);
  if (index >= 0) {
    contractorsCache[index] = contractor;
    listeners.forEach(fn => fn());
  }
  
  return contractor;
}

export async function deleteContractor(id: string): Promise<void> {
  await deleteSupabaseContractor(id);
  
  // Update cache immediately
  contractorsCache = contractorsCache.filter(c => c.id !== id);
  listeners.forEach(fn => fn());
}

export async function updateConditionalAnswers(id: string, answers: any): Promise<Contractor> {
  return updateContractor(id, { 
    hasEmployees: answers.hasEmployees === 'yes',
    providesAbroad: answers.sendsAbroad === 'yes'
  });
}

export async function updateOrgFlags(id: string, orgFlags: { hrRegistered?: boolean }): Promise<Contractor> {
  return updateContractor(id, {
    notes: orgFlags.hrRegistered ? 'HR registered' : undefined
  });
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Force refresh cache (for manual sync)
export function forceRefresh() {
  refreshCache();
}

// Force refresh and wait for completion
export async function forceRefreshAsync(): Promise<void> {
  await forceRefreshAndWait();
}