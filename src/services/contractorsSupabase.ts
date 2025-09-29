// ============= Supabase-only Contractors Service =============
// All localStorage functionality removed - Supabase only

import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export interface Contractor {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_email: string;
  phone?: string;
  address?: string;
  country_code: string;
  notes?: string;
  status: 'active' | 'inactive';
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  company_type: 'einzelunternehmen' | 'gbr' | 'baubetrieb';
  requires_employees?: boolean;
  has_non_eu_workers?: boolean;
  employees_not_employed_in_germany?: boolean;
  active: boolean; // Legacy compatibility
  created_at: string;
  updated_at: string;
}

// Get all subcontractors from Supabase
export async function listContractors(): Promise<Contractor[]> {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .order('company_name');

    if (error) throw error;

    return (data || []).map(sub => ({
      ...sub,
      status: sub.status as 'active' | 'inactive',
      compliance_status: sub.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon',
      company_type: sub.company_type as 'einzelunternehmen' | 'gbr' | 'baubetrieb',
      active: sub.status === 'active' // Legacy compatibility
    }));
  } catch (error) {
    console.error('Error loading contractors:', error);
    return [];
  }
}

// Get single contractor by ID
export async function getContractor(id: string): Promise<Contractor | null> {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data ? {
      ...data,
      status: data.status as 'active' | 'inactive',
      compliance_status: data.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon',
      company_type: data.company_type as 'einzelunternehmen' | 'gbr' | 'baubetrieb',
      active: data.status === 'active' // Legacy compatibility
    } : null;
  } catch (error) {
    console.error('Error loading contractor:', error);
    return null;
  }
}

// Create new contractor
export async function createContractor(contractor: Omit<Contractor, 'id' | 'created_at' | 'updated_at' | 'active'>): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .insert({
        ...contractor,
        tenant_id: '00000000-0000-0000-0000-000000000001', // Demo tenant
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;

    debug.log('Created contractor:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating contractor:', error);
    throw error;
  }
}

// Update contractor
export async function updateContractor(id: string, updates: Partial<Contractor>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subcontractors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    debug.log('Updated contractor:', id);
    return true;
  } catch (error) {
    console.error('Error updating contractor:', error);
    return false;
  }
}

// Delete contractor
export async function deleteContractor(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subcontractors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    debug.log('Deleted contractor:', id);
    return true;
  } catch (error) {
    console.error('Error deleting contractor:', error);
    return false;
  }
}

// Legacy compatibility functions - kept synchronous but return empty data
export function getContractors(): Contractor[] {
  console.warn('getContractors() called - use listContractors() instead for Supabase data');
  return [];
}

export function getAllContractors(): Contractor[] {
  console.warn('getAllContractors() called - use listContractors() instead for Supabase data');
  return [];
}

export const forceRefreshAsync = listContractors;

// Subscribe to changes (Real-time)
export function subscribe(callback: () => void): () => void {
  const channel = supabase
    .channel('contractors-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'subcontractors'
      },
      (payload) => {
        debug.log('Contractors changed:', payload);
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Legacy conditional requirements functions (for compatibility)
export function updateConditionalAnswers(contractorId: string, answers: any): Promise<boolean> {
  return updateContractor(contractorId, {
    requires_employees: answers.requiresEmployees,
    has_non_eu_workers: answers.hasNonEuWorkers,
    employees_not_employed_in_germany: answers.employeesNotEmployedInGermany
  });
}

export function updateOrgFlags(flags: any): Promise<boolean> {
  // Org flags not needed in Supabase mode
  return Promise.resolve(true);
}

// Async version for compatibility
export const getContractorAsync = getContractor;