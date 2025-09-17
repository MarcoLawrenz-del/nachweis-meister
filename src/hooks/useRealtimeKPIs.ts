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

      // For local auth, return default/empty KPIs to avoid Supabase calls
      console.log('📊 useRealtimeKPIs: Using local auth - returning default values');
      
      setKpis({
        total_subcontractors: 0,
        active_subcontractors: 0,
        inactive_subcontractors: 0,
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
        total: 0,
        expired: 0,
        expiring: 0,
        valid: 0,
        complianceRate: 0,
      });
    } catch (err) {
      console.error('Error setting default KPIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.tenant_id) return;

    // Initial fetch
    fetchKPIs();

    // For local auth, skip real-time subscriptions to avoid Supabase calls
    console.log('📊 useRealtimeKPIs: Skipping real-time subscriptions for local auth');
    
    return () => {
      // No cleanup needed for local auth
    };
  }, [profile?.tenant_id]);

  return {
    kpis,
    isLoading,
    error,
    refetch: fetchKPIs
  };
}