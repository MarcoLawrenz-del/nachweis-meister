// ============= Wizard Document Creation Service =============
// Create documents for new contractor based on wizard selections

import { getDocs, setDocs, setContractorMeta } from './contractorDocs.store';
import type { ContractorDocument } from '@/services/contractors';

export function createDocumentsForContractor(
  contractorId: string, 
  requirements: Record<string, 'required' | 'optional' | 'hidden'>
): void {
  const existingDocs = getDocs(contractorId);
  const newDocs: ContractorDocument[] = [];

  // Process requirements into documents
  Object.entries(requirements).forEach(([docId, requirement]) => {
    if (requirement === 'hidden') return;

    const existing = existingDocs.find(d => d.documentTypeId === docId);
    if (existing) {
      newDocs.push({ ...existing, requirement });
    } else {
      newDocs.push({
        contractorId,
        documentTypeId: docId,
        requirement,
        status: 'missing',
        validUntil: null,
        rejectionReason: null
      });
    }
  });

  // Save documents and set lastRequestedAt
  setDocs(contractorId, newDocs);
  setContractorMeta(contractorId, { 
    lastRequestedAt: new Date().toISOString() 
  });
}