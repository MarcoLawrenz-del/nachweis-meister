import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { listSupabaseContractors } from '@/services/supabaseContractors';
import { useToast } from '@/hooks/use-toast';
import { debug } from '@/lib/debug';

/**
 * Centralized hook for production data management
 * Replaces localStorage-based stores in production mode
 */
export function useSupabaseData() {
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDemo) {
      initializeProductionData();
    }
  }, [isDemo]);

  const initializeProductionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      debug.log('🚀 Initializing production data from Supabase...');
      
      // Test basic connectivity
      const { data: testData, error: testError } = await supabase
        .from('subcontractors')
        .select('count')
        .limit(1);
      
      if (testError) {
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      
      debug.log('✅ Supabase connection successful');
      
      // Load initial data to verify everything works
      await listSupabaseContractors();
      
      debug.log('✅ Production data initialized successfully');
      
    } catch (err: any) {
      debug.error('❌ Failed to initialize production data:', err);
      setError(err.message);
      
      toast({
        title: "Datenbankfehler",
        description: "Produktionsdaten konnten nicht geladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isDemo,
    isProduction: !isDemo,
    loading,
    error,
    reinitialize: initializeProductionData
  };
}