import { supabase } from '@/integrations/supabase/client';

export interface SupabaseContractor {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_email: string;
  phone?: string;
  address?: string;
  country_code: string;
  notes?: string;
  status: string; // Changed from 'active' | 'inactive' to string for Supabase compatibility
  compliance_status: string;
  company_type: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

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

export async function updateSupabaseContractorStatus(
  id: string, 
  status: 'active' | 'inactive'
): Promise<boolean> {
  try {
    // First get the current contractor data to preserve all fields
    const currentData = await getSupabaseContractor(id);
    if (!currentData) {
      console.error('Contractor not found for status update:', id);
      return false;
    }

    // Only update the status field while preserving all other data
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

    console.log('Contractor status updated successfully:', { id, status, preservedData: currentData });
    return true;
  } catch (error) {
    console.error('Error updating contractor status:', error);
    return false;
  }
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