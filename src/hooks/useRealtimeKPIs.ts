import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface KPIData {
  total_subcontractors: number;
  active_subcontractors: number;
  inactive_subcontractors: number;
  total_requirements: number;
  missing_requirements: number;
  submitted_requirements: number;
  in_review_requirements: number;
  valid_requirements: number;
  rejected_requirements: number;
  expiring_requirements: number;
  expired_requirements: number;
  compliance_rate: number;
  last_updated: string;
}

export function useRealtimeKPIs() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchKPIs = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call RPC function to get aggregated KPIs
      const { data, error: rpcError } = await supabase
        .rpc('get_tenant_kpis', { tenant_id: user.tenant_id });

      if (rpcError) {
        throw rpcError;
      }

      setKpis(data);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.tenant_id) return;

    // Initial fetch
    fetchKPIs();

    // Set up real-time subscriptions for relevant tables
    const channel = supabase
      .channel('kpi-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcontractors',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        () => {
          console.log('Subcontractors table changed, refreshing KPIs');
          fetchKPIs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requirements'
        },
        (payload) => {
          console.log('Requirements table changed:', payload);
          fetchKPIs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        () => {
          console.log('Documents table changed, refreshing KPIs');
          fetchKPIs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_subs'
        },
        () => {
          console.log('Project subs changed, refreshing KPIs');
          fetchKPIs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id]);

  return {
    kpis,
    isLoading,
    error,
    refetch: fetchKPIs
  };
}