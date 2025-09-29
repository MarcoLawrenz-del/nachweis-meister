import { useState, useEffect } from 'react';
import { getDocs, subscribe, type ContractorDocument } from '@/services/contractorDocs.store';

export function useAsyncContractorDocs(contractorId: string) {
  const [docs, setDocs] = useState<ContractorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = async () => {
    if (!contractorId) {
      setDocs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDocs(contractorId);
      setDocs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      console.error('Error loading contractor docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
    
    // Subscribe to changes for this contractor
    const unsubscribe = subscribe(contractorId, () => {
      loadDocs();
    });

    return unsubscribe;
  }, [contractorId]);

  return {
    docs,
    loading,
    error,
    reload: loadDocs
  };
}