// ============= Unified Contractors Service =============
// This replaces contractors.store.ts with Supabase integration
// Maintains exact same API for backward compatibility but returns promises

import { 
  listSupabaseContractors,
  getSupabaseContractor,
  createSupabaseContractor,
  updateSupabaseContractor,
  deleteSupabaseContractor,
  subscribeToSupabaseContractors,
  subscribeToSupabaseContractorChanges,
  type SupabaseContractor
} from './supabaseContractors';

// Legacy Contractor type for backward compatibility
export type Contractor = {
  id: string;
  company_name: string;
  contact_name?: string;
  email: string; // Maps to contact_email in Supabase
  phone?: string;
  country?: string; // Maps to country_code in Supabase
  address?: string;
  notes?: string;
  created_at: string;
  active: boolean; // Maps to status === 'active' in Supabase
  // Conditional fields
  conditionalAnswers?: any;
  orgFlags?: { hrRegistered?: boolean };
  hasEmployees?: boolean;
  providesConstructionServices?: boolean;
  isSokaPflicht?: boolean;
  providesAbroad?: boolean;
  processesPersonalData?: boolean;
  selectedPackageId?: string;
};

// Convert Supabase contractor to legacy format
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

// Main CRUD operations - now async
export async function listContractors(): Promise<Contractor[]> {
  const supabaseContractors = await listSupabaseContractors();
  return supabaseContractors.map(convertToLegacy);
}

export async function getContractor(id: string): Promise<Contractor | undefined> {
  const supabaseContractor = await getSupabaseContractor(id);
  return supabaseContractor ? convertToLegacy(supabaseContractor) : undefined;
}

export async function createContractor(data: Omit<Contractor, "id"|"created_at"|"active"> & { active?: boolean }): Promise<Contractor> {
  const supabaseData = {
    company_name: data.company_name,
    contact_name: data.contact_name,
    contact_email: data.email,
    phone: data.phone,
    country_code: data.country || 'DE',
    address: data.address,
    notes: data.notes,
    company_type: 'baubetrieb',
    tenant_id: 'default-tenant', // TODO: Get from auth context
    requires_employees: data.hasEmployees,
    has_non_eu_workers: data.providesAbroad,
    employees_not_employed_in_germany: data.providesAbroad,
    active: data.active
  };
  
  const supabaseContractor = await createSupabaseContractor(supabaseData);
  return convertToLegacy(supabaseContractor);
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
  return convertToLegacy(supabaseContractor);
}

export async function deleteContractor(id: string): Promise<void> {
  return deleteSupabaseContractor(id);
}

export function subscribe(fn: () => void) {
  return subscribeToSupabaseContractors(fn);
}

export async function getContractors(): Promise<Contractor[]> {
  return listContractors();
}

export async function getAllContractors(): Promise<Contractor[]> {
  return listContractors();
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

// Re-export Supabase functions for direct access
export {
  listSupabaseContractors,
  getSupabaseContractor,
  createSupabaseContractor,
  updateSupabaseContractor,
  deleteSupabaseContractor,
  subscribeToSupabaseContractors,
  subscribeToSupabaseContractorChanges,
  type SupabaseContractor
};