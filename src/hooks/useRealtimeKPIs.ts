import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from './useAppAuth';

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
  // Legacy support for old format
  total?: number;
  expired?: number;
  expiring?: number;
  valid?: number;
  complianceRate?: number;
}

export function useRealtimeKPIs() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAppAuth();

  const fetchKPIs = async () => {
    if (!profile?.tenant_id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Manually calculate KPIs for now until types are updated
      // Fetch subcontractors
      const { data: subcontractors, error: subError } = await supabase
        .from('subcontractors')
        .select('id, status')
        .eq('tenant_id', profile.tenant_id);

      if (subError) throw subError;

      // Fetch requirements with project filtering
      const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select(`
          id, 
          status,
          project_subs!inner (
            project_id,
            projects!inner (
              tenant_id
            )
          )
        `)
        .eq('project_subs.projects.tenant_id', profile.tenant_id);

      if (reqError) throw reqError;

      // Calculate KPIs
      const totalSubs = subcontractors?.length || 0;
      const activeSubs = subcontractors?.filter(s => s.status === 'active').length || 0;
      const inactiveSubs = totalSubs - activeSubs;

      const totalReqs = requirements?.length || 0;
      const statusCounts = requirements?.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const complianceRate = totalReqs > 0 
        ? Math.round(((statusCounts.valid || 0) / totalReqs) * 100) 
        : 0;

      setKpis({
        total_subcontractors: totalSubs,
        active_subcontractors: activeSubs,
        inactive_subcontractors: inactiveSubs,
        total_requirements: totalReqs,
        missing_requirements: statusCounts.missing || 0,
        submitted_requirements: statusCounts.submitted || 0,
        in_review_requirements: statusCounts.in_review || 0,
        valid_requirements: statusCounts.valid || 0,
        rejected_requirements: statusCounts.rejected || 0,
        expiring_requirements: statusCounts.expiring || 0,
        expired_requirements: statusCounts.expired || 0,
        compliance_rate: complianceRate,
        last_updated: new Date().toISOString(),
        // Legacy support
        total: totalSubs,
        expired: statusCounts.expired || 0,
        expiring: statusCounts.expiring || 0,
        valid: statusCounts.valid || 0,
        complianceRate: complianceRate,
      });
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.tenant_id) return;

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
          filter: `tenant_id=eq.${profile.tenant_id}`
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
  }, [profile?.tenant_id]);

  return {
    kpis,
    isLoading,
    error,
    refetch: fetchKPIs
  };
}