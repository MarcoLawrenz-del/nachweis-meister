import { supabase } from '@/integrations/supabase/client';
import { ConditionalAnswers, DEFAULT_CONDITIONAL_ANSWERS } from '@/config/conditionalQuestions';

export interface SupabaseContractor {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_email: string;
  phone?: string;
  address?: string;
  country_code: string;
  notes?: string;
  status: string;
  compliance_status: string;
  company_type: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  requires_employees?: boolean;
  has_non_eu_workers?: boolean;
  employees_not_employed_in_germany?: boolean;
}

// Create a unified contractor service that replaces localStorage
let listeners = new Set<() => void>();

export async function getSupabaseContractor(id: string): Promise<SupabaseContractor | null> {
  const { data, error } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching contractor:', error);
    return null;
  }

  return data;
}

export async function listSupabaseContractors(tenantId?: string): Promise<SupabaseContractor[]> {
  try {
    let query = supabase
      .from('subcontractors')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contractors:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return [];
  }
}

export async function createSupabaseContractor(
  data: Omit<SupabaseContractor, "id" | "created_at" | "updated_at" | "status" | "compliance_status"> & { 
    active?: boolean;
    conditionalAnswers?: ConditionalAnswers;
    orgFlags?: { hrRegistered?: boolean };
  }
): Promise<SupabaseContractor> {
  // For demo mode, ensure we have a valid tenant_id
  let effectiveTenantId = data.tenant_id;
  
  if (!effectiveTenantId) {
    console.log('No tenant_id provided, creating demo environment...');
    
    // Create or sync demo user/tenant  
    const { data: demoUserId, error: syncError } = await supabase.rpc('sync_local_user', {
      local_user_id: 'demo-user',
      user_email: 'demo@subfix.de', 
      user_name: 'Demo User',
      tenant_name: 'Demo Tenant'
    });
    
    if (syncError) {
      console.error('Failed to sync demo user:', syncError);
      throw new Error(`Failed to prepare demo environment: ${syncError.message}`);
    }
    
    // Get the tenant ID for demo
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'Demo Tenant')
      .single();
      
    if (tenantError || !tenant) {
      console.error('Failed to get demo tenant:', tenantError);
      throw new Error('Demo tenant not found');
    }
    
    effectiveTenantId = tenant.id;
    console.log('Using demo tenant ID:', effectiveTenantId);
  }

  const { data: contractor, error } = await supabase
    .from('subcontractors')
    .insert({
      company_name: data.company_name,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      phone: data.phone,
      address: data.address,
      country_code: data.country_code || 'DE',
      notes: data.notes,
      tenant_id: effectiveTenantId,
      company_type: data.company_type || 'baubetrieb',
      requires_employees: data.requires_employees,
      has_non_eu_workers: data.has_non_eu_workers,
      employees_not_employed_in_germany: data.employees_not_employed_in_germany,
      status: data.active !== false ? 'active' : 'inactive'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contractor: ${error.message}`);
  }

  // Notify listeners
  listeners.forEach(fn => fn());
  
  return contractor;
}

export async function updateSupabaseContractor(
  id: string, 
  patch: Partial<SupabaseContractor>
): Promise<SupabaseContractor> {
  const { data: contractor, error } = await supabase
    .from('subcontractors')
    .update({
      ...patch,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update contractor: ${error.message}`);
  }

  // Notify listeners
  listeners.forEach(fn => fn());
  
  return contractor;
}

export async function updateSupabaseContractorStatus(
  id: string, 
  status: 'active' | 'inactive'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subcontractors')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating contractor status:', error);
      return false;
    }

    // Notify listeners
    listeners.forEach(fn => fn());
    
    return true;
  } catch (error) {
    console.error('Error updating contractor status:', error);
    return false;
  }
}

export async function deleteSupabaseContractor(id: string): Promise<void> {
  const { error } = await supabase
    .from('subcontractors')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete contractor: ${error.message}`);
  }

  // Notify listeners
  listeners.forEach(fn => fn());
}

export function subscribeToSupabaseContractors(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Real-time subscription for contractors
export function subscribeToSupabaseContractorChanges(callback: () => void): () => void {
  const channel = supabase
    .channel('contractor-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'subcontractors'
      },
      () => {
        console.log('Contractor change detected');
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Legacy compatibility functions that map to Supabase
export async function listContractors(): Promise<SupabaseContractor[]> {
  return listSupabaseContractors();
}

export async function getContractor(id: string): Promise<SupabaseContractor | null> {
  return getSupabaseContractor(id);
}

export async function createContractor(data: any): Promise<SupabaseContractor> {
  return createSupabaseContractor(data);
}

export async function updateContractor(id: string, patch: any): Promise<SupabaseContractor> {
  return updateSupabaseContractor(id, patch);
}

export async function deleteContractor(id: string): Promise<void> {
  return deleteSupabaseContractor(id);
}

export function subscribe(fn: () => void) {
  return subscribeToSupabaseContractors(fn);
}

export function getContractors(): Promise<SupabaseContractor[]> {
  return listSupabaseContractors();
}

export function getAllContractors(): Promise<SupabaseContractor[]> {
  return listSupabaseContractors();
}

// Conditional answers compatibility
export async function updateConditionalAnswers(id: string, answers: ConditionalAnswers): Promise<SupabaseContractor> {
  return updateSupabaseContractor(id, { 
    requires_employees: answers.hasEmployees === 'yes',
    has_non_eu_workers: answers.sendsAbroad === 'yes',
    employees_not_employed_in_germany: answers.sendsAbroad === 'yes'
  });
}

export async function updateOrgFlags(id: string, orgFlags: { hrRegistered?: boolean }): Promise<SupabaseContractor> {
  return updateSupabaseContractor(id, { 
    // Map orgFlags to appropriate Supabase fields if needed
    notes: orgFlags.hrRegistered ? 'HR registered' : undefined 
  });
}