import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseRequirement {
  id: string;
  project_sub_id: string;
  document_type_id: string;
  status: string;
  due_date?: string;
  valid_to?: string;
  created_at: string;
  updated_at: string;
  document_types: {
    id: string;
    name_de: string;
    code: string;
  };
  documents?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    uploaded_at: string;
    valid_from?: string;
    valid_to?: string;
  }>;
}

export function useSupabaseRequirements(subcontractorId: string) {
  const [requirements, setRequirements] = useState<SupabaseRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading requirements for subcontractor:', subcontractorId);

      // First get project_subs for this subcontractor
      const { data: projectSubs, error: projectSubError } = await supabase
        .from('project_subs')
        .select('id')
        .eq('subcontractor_id', subcontractorId);

      if (projectSubError) {
        throw projectSubError;
      }

      if (!projectSubs || projectSubs.length === 0) {
        console.log('No project_subs found for subcontractor:', subcontractorId);
        setRequirements([]);
        return;
      }

      const projectSubIds = projectSubs.map(ps => ps.id);
      console.log('Found project_sub IDs:', projectSubIds);

      // Then get requirements for these project_subs
      const { data, error: fetchError } = await supabase
        .from('requirements')
        .select(`
          id,
          project_sub_id,
          document_type_id,
          status,
          due_date,
          valid_to,
          created_at,
          updated_at,
          document_types (
            id,
            name_de,
            code
          ),
          documents (
            id,
            file_name,
            file_url,
            uploaded_at,
            valid_from,
            valid_to
          )
        `)
        .in('project_sub_id', projectSubIds);

      console.log('Requirements query result:', { data, fetchError });

      if (fetchError) {
        throw fetchError;
      }

      setRequirements(data || []);
    } catch (err) {
      console.error('Error loading requirements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subcontractorId) {
      loadRequirements();
    }
  }, [subcontractorId]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!subcontractorId) return;

    const channel = supabase
      .channel('requirements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requirements'
        },
        (payload) => {
          console.log('Requirements changed:', payload);
          loadRequirements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subcontractorId]);

  return {
    requirements,
    loading,
    error,
    reload: loadRequirements
  };
}