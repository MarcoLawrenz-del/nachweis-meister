import { useState, useEffect } from 'react';
import { listContractors, subscribe, type Contractor } from '@/services/contractors.store';

export function useAsyncContractors() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContractors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listContractors();
      setContractors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contractors');
      console.error('Error loading contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractors();
    
    // Subscribe to changes
    const unsubscribe = subscribe(() => {
      loadContractors();
    });

    return unsubscribe;
  }, []);

  return {
    contractors,
    loading,
    error,
    reload: loadContractors
  };
}