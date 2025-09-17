import { useEffect, useState } from 'react';
import { useAppAuth } from './useAppAuth';
import { listContractors } from '@/services/contractors.store';

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

      // Calculate KPIs from local contractor store
      const contractors = listContractors();
      const activeContractors = contractors.filter(c => c.active);
      
      const kpiData: KPIData = {
        total_subcontractors: contractors.length,
        active_subcontractors: activeContractors.length,
        inactive_subcontractors: contractors.length - activeContractors.length,
        total_requirements: 0,
        missing_requirements: 0,
        submitted_requirements: 0,
        in_review_requirements: 0,
        valid_requirements: 0,
        rejected_requirements: 0,
        expiring_requirements: 0,
        expired_requirements: 0,
        compliance_rate: 0,
        last_updated: new Date().toISOString(),
        // Legacy support
        total: contractors.length,
        expired: 0,
        expiring: 0,
        valid: 0,
        complianceRate: 0,
      };
      
      setKpis(kpiData);
    } catch (err) {
      console.error('Error calculating KPIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.tenant_id) return;

    fetchKPIs();
    
    // No real-time updates needed for local storage
    return () => {};
  }, [profile?.tenant_id]);

  return {
    kpis,
    isLoading,
    error,
    refetch: fetchKPIs
  };
}