import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from './useAppAuth';
import { useToast } from './use-toast';
import { debug } from '@/lib/debug';

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

/**
 * Unified hook to replace localStorage-based contractor management
 * Uses Supabase as single source of truth
 */
export function useSupabaseContractors() {
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');
  const { profile } = useAppAuth();
  const { toast } = useToast();
  
  const [contractors, setContractors] = useState<SupabaseContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contractors from Supabase
  const loadContractors = async () => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      debug.log('🔄 Loading contractors from Supabase...');
      
      let query = supabase
        .from('subcontractors')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by tenant if user is authenticated
      if (profile?.tenant_id) {
        query = query.eq('tenant_id', profile.tenant_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to load contractors: ${fetchError.message}`);
      }

      setContractors(data || []);
      debug.log('✅ Contractors loaded successfully:', data?.length || 0);
      
    } catch (err: any) {
      debug.error('❌ Failed to load contractors:', err);
      setError(err.message);
      
      toast({
        title: "Fehler beim Laden",
        description: "Nachunternehmer konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create contractor in Supabase
  const createContractor = async (data: Omit<SupabaseContractor, "id" | "created_at" | "updated_at" | "status" | "compliance_status">) => {
    try {
      // For demo mode, use fixed demo tenant_id when no profile
      const effectiveTenantId = profile?.tenant_id || '00000000-0000-0000-0000-000000000001';
      
      const { data: contractor, error } = await supabase
        .from('subcontractors')
        .insert({
          ...data,
          tenant_id: effectiveTenantId,
          status: 'active',
          compliance_status: 'non_compliant'
        })
        .select()
        .single();

      if (error) throw error;

      await loadContractors(); // Refresh list
      return contractor;
    } catch (error: any) {
      throw new Error(`Failed to create contractor: ${error.message}`);
    }
  };

  // Update contractor in Supabase
  const updateContractor = async (id: string, updates: Partial<SupabaseContractor>) => {
    try {
      const { data: contractor, error } = await supabase
        .from('subcontractors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadContractors(); // Refresh list
      return contractor;
    } catch (error: any) {
      throw new Error(`Failed to update contractor: ${error.message}`);
    }
  };

  // Delete contractor from Supabase
  const deleteContractor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadContractors(); // Refresh list
    } catch (error: any) {
      throw new Error(`Failed to delete contractor: ${error.message}`);
    }
  };

  // Get single contractor
  const getContractor = (id: string): SupabaseContractor | undefined => {
    return contractors.find(c => c.id === id);
  };

  // Load contractors on mount
  useEffect(() => {
    if (!isDemo) {
      loadContractors();
    }
  }, [isDemo, profile?.tenant_id]);

  return {
    contractors,
    loading,
    error,
    createContractor,
    updateContractor,
    deleteContractor,
    getContractor,
    refreshContractors: loadContractors,
    isDemo
  };
}