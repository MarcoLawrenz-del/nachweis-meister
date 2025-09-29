// ============= Documents Store Migration to Supabase =============
// This replaces contractorDocs.store.ts with Supabase integration

export {
  // Document operations
  getSupabaseDocuments,
  getSupabaseRequirements,
  uploadDocumentToSupabase,
  updateRequirementStatus,
  deleteSupabaseDocument,
  getDocumentsForContractor,
  subscribeToDocumentChanges,
  
  // Types
  type SupabaseDocument,
  type SupabaseRequirement
} from './supabaseDocuments';

// Legacy compatibility functions
import { 
  getDocumentsForContractor,
  getSupabaseRequirements,
  uploadDocumentToSupabase,
  subscribeToDocumentChanges
} from './supabaseDocuments';

export type ContractorDocument = {
  contractorId: string;
  documentTypeId: string;
  requirement: 'required' | 'optional' | 'hidden';
  status: 'missing' | 'submitted' | 'accepted' | 'rejected' | 'expired';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
  uploadedBy?: 'admin' | 'contractor';
  uploadedAt?: string;
  validUntil?: string | null;
  validitySource?: 'admin' | 'auto';
  file?: any;
  review?: any;
  history?: any[];
};

export async function getDocs(contractorId: string): Promise<ContractorDocument[]> {
  return getDocumentsForContractor(contractorId);
}

export async function setDocs(contractorId: string, docs: ContractorDocument[]): Promise<void> {
  // For now, this is a no-op since we're reading from Supabase
  // Documents are managed through requirements/documents tables
  console.warn('setDocs: Direct document setting not supported with Supabase backend');
}

export async function upsertDoc(contractorId: string, doc: ContractorDocument): Promise<void> {
  console.warn('upsertDoc: Use uploadDocumentToSupabase instead');
}

export function subscribe(contractorId: string, fn: () => void) {
  return subscribeToDocumentChanges(contractorId, fn);
}

export async function markUploaded(args: {
  contractorId: string;
  type: string;
  file: { name: string; type: string; size: number; dataUrl: string };
  uploadedBy: 'admin' | 'contractor';
  accept?: boolean;
  validUntil?: string | null;
}): Promise<void> {
  try {
    // Get requirements for this contractor and document type
    const requirements = await getSupabaseRequirements(args.contractorId);
    const requirement = requirements.find(r => r.document_type_id === args.type);
    
    if (!requirement) {
      console.error('No requirement found for contractor/document type');
      return;
    }

    // Convert dataUrl to File object
    const response = await fetch(args.file.dataUrl);
    const blob = await response.blob();
    const file = new File([blob], args.file.name, { type: args.file.type });

    // Upload document
    await uploadDocumentToSupabase(requirement.id, file, args.uploadedBy);
    
    // Update requirement status if accepting
    if (args.accept) {
      await updateRequirementStatus(
        requirement.id,
        'valid',
        new Date().toISOString(),
        args.validUntil || undefined
      );
    }
  } catch (error) {
    console.error('Error in markUploaded:', error);
    throw error;
  }
}

export type ContractorMeta = { lastRequestedAt?: string };

export function getContractorMeta(contractorId: string): ContractorMeta {
  // For now return empty meta - could be stored in Supabase profiles if needed
  return {};
}

export function setContractorMeta(contractorId: string, meta: ContractorMeta): void {
  // No-op for now - could store in Supabase if needed
  console.log('setContractorMeta called:', { contractorId, meta });
}

export function updateDocumentRequirement(
  contractorId: string, 
  documentTypeId: string, 
  requirement: 'required' | 'optional'
): void {
  console.warn('updateDocumentRequirement: Requirement updates should go through Supabase requirement_rules');
}