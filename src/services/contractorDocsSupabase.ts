// ============= Supabase-only Document Service =============
// All localStorage functionality removed - Supabase only

import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export interface ContractorDocument {
  contractorId: string;
  documentTypeId: string;
  status: 'missing' | 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'expired';
  requirement: 'required' | 'optional' | 'conditional';
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
  validUntil?: string;
  customName?: string;
  label?: string;
}

export interface ContractorMeta {
  lastRequestedAt?: string;
  notes?: string;
}

// Get documents for a contractor from Supabase requirements
export async function getDocs(contractorId: string): Promise<ContractorDocument[]> {
  try {
    const { data, error } = await supabase
      .from('requirements')
      .select(`
        id,
        status,
        document_type_id,
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
          valid_to
        ),
        project_subs!inner (
          subcontractor_id
        )
      `)
      .eq('project_subs.subcontractor_id', contractorId);

    if (error) throw error;

    return (data || []).map(req => ({
      contractorId,
      documentTypeId: req.document_type_id,
      status: mapSupabaseStatus(req.status),
      requirement: 'required' as const, // All requirements from Supabase are required by default
      fileName: req.documents?.[0]?.file_name,
      fileUrl: req.documents?.[0]?.file_url,
      uploadedAt: req.documents?.[0]?.uploaded_at,
      validUntil: req.documents?.[0]?.valid_to,
      customName: undefined,
      label: req.document_types?.name_de,
    }));
  } catch (error) {
    console.error('Error loading contractor documents:', error);
    return [];
  }
}

// Map Supabase status to legacy status
function mapSupabaseStatus(status: string): ContractorDocument['status'] {
  switch (status) {
    case 'missing': return 'missing';
    case 'submitted': return 'submitted';
    case 'in_review': return 'in_review';
    case 'valid': return 'accepted';
    case 'rejected': return 'rejected';
    case 'expired': return 'expired';
    case 'expiring': return 'accepted'; // Still valid but expiring
    default: return 'missing';
  }
}

// Set documents (not needed in Supabase mode - requirements are managed automatically)
export async function setDocs(contractorId: string, docs: ContractorDocument[]): Promise<void> {
  debug.log('setDocs called but not needed in Supabase mode');
  // No-op - requirements are managed through Supabase requirements table
}

// Upsert document (for creating/updating requirements)
export async function upsertDoc(doc: ContractorDocument): Promise<void> {
  try {
    // Find the requirement for this contractor and document type
    const { data: requirements, error: reqError } = await supabase
      .from('requirements')
      .select(`
        id,
        project_subs!inner (
          subcontractor_id
        )
      `)
      .eq('project_subs.subcontractor_id', doc.contractorId)
      .eq('document_type_id', doc.documentTypeId);

    if (reqError) throw reqError;

    if (requirements && requirements.length > 0) {
      // Update existing requirement status
      const { error: updateError } = await supabase
        .from('requirements')
        .update({ 
          status: mapLegacyToSupabaseStatus(doc.status),
          updated_at: new Date().toISOString()
        })
        .eq('id', requirements[0].id);

      if (updateError) throw updateError;
    }

    debug.log('Upserted document:', doc);
  } catch (error) {
    console.error('Error upserting document:', error);
  }
}

// Map legacy status to Supabase status
function mapLegacyToSupabaseStatus(status: string): string {
  switch (status) {
    case 'missing': return 'missing';
    case 'submitted': return 'submitted';
    case 'in_review': return 'in_review';
    case 'accepted': return 'valid';
    case 'rejected': return 'rejected';
    case 'expired': return 'expired';
    default: return 'missing';
  }
}

// Mark document as uploaded
export async function markUploaded(contractorId: string, documentTypeId: string): Promise<void> {
  await upsertDoc({
    contractorId,
    documentTypeId,
    status: 'submitted',
    requirement: 'required'
  });
}

// Update document requirement
export async function updateDocumentRequirement(
  contractorId: string, 
  documentTypeId: string, 
  requirement: ContractorDocument['requirement']
): Promise<void> {
  // In Supabase mode, requirement is determined by requirement_rules
  debug.log('updateDocumentRequirement called but managed by requirement_rules in Supabase mode');
}

// Get contractor metadata
export async function getContractorMeta(contractorId: string): Promise<ContractorMeta> {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('notes')
      .eq('id', contractorId)
      .single();

    if (error) throw error;

    return {
      notes: data?.notes || undefined,
      lastRequestedAt: undefined // Not tracked in current schema
    };
  } catch (error) {
    console.error('Error loading contractor meta:', error);
    return {};
  }
}

// Set contractor metadata
export async function setContractorMeta(contractorId: string, meta: ContractorMeta): Promise<void> {
  try {
    const { error } = await supabase
      .from('subcontractors')
      .update({
        notes: meta.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractorId);

    if (error) throw error;

    debug.log('Updated contractor meta:', contractorId);
  } catch (error) {
    console.error('Error updating contractor meta:', error);
  }
}

// Subscribe to changes (Real-time)
export function subscribe(callback: () => void): () => void {
  const channel = supabase
    .channel('documents-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'requirements'
      },
      (payload) => {
        debug.log('Requirements changed:', payload);
        callback();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents'
      },
      (payload) => {
        debug.log('Documents changed:', payload);
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}