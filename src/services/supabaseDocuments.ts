import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export interface SupabaseDocument {
  id: string;
  requirement_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
  uploaded_by?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  valid_from?: string;
  valid_to?: string;
  issuer?: string;
  document_number?: string;
}

export interface SupabaseRequirement {
  id: string;
  project_sub_id: string;
  document_type_id: string;
  status: string;
  due_date?: string;
  valid_to?: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
  escalated: boolean;
  assigned_reviewer_id?: string;
}

// Documents service for Supabase
export async function getSupabaseDocuments(requirementId: string): Promise<SupabaseDocument[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('requirement_id', requirementId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export async function getSupabaseRequirements(subcontractorId: string): Promise<SupabaseRequirement[]> {
  try {
    const { data, error } = await supabase
      .from('requirements')
      .select(`
        *,
        project_subs!inner (
          subcontractor_id
        )
      `)
      .eq('project_subs.subcontractor_id', subcontractorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return [];
  }
}

export async function uploadDocumentToSupabase(
  requirementId: string,
  file: File,
  uploadedBy?: string
): Promise<SupabaseDocument> {
  try {
    // Upload file to Supabase Storage
    const fileName = `${requirementId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        requirement_id: requirementId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: uploadedBy
      })
      .select()
      .single();

    if (docError) throw docError;

    // Update requirement status
    await supabase
      .from('requirements')
      .update({ status: 'submitted' })
      .eq('id', requirementId);

    debug.log('✅ Document uploaded to Supabase:', document);
    return document;
  } catch (error: any) {
    debug.error('❌ Failed to upload document:', error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }
}

export async function updateRequirementStatus(
  requirementId: string,
  status: string,
  validFrom?: string,
  validTo?: string,
  rejectionReason?: string
): Promise<void> {
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (validFrom) updates.valid_from = validFrom;
    if (validTo) updates.valid_to = validTo;
    if (rejectionReason) updates.rejection_reason = rejectionReason;

    const { error } = await supabase
      .from('requirements')
      .update(updates)
      .eq('id', requirementId);

    if (error) throw error;

    debug.log('✅ Requirement status updated:', { requirementId, status });
  } catch (error: any) {
    debug.error('❌ Failed to update requirement status:', error);
    throw new Error(`Failed to update requirement status: ${error.message}`);
  }
}

export async function deleteSupabaseDocument(documentId: string): Promise<void> {
  try {
    // Get document info to delete file from storage
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from URL
    const url = new URL(document.file_url);
    const filePath = url.pathname.split('/documents/')[1];

    // Delete from storage
    if (filePath) {
      await supabase.storage
        .from('documents')
        .remove([filePath]);
    }

    // Delete document record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;

    debug.log('✅ Document deleted from Supabase:', documentId);
  } catch (error: any) {
    debug.error('❌ Failed to delete document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Legacy compatibility functions for gradual migration
export async function getDocumentsForContractor(contractorId: string): Promise<any[]> {
  try {
    const requirements = await getSupabaseRequirements(contractorId);
    const documents = [];

    for (const requirement of requirements) {
      const reqDocs = await getSupabaseDocuments(requirement.id);
      documents.push({
        contractorId,
        documentTypeId: requirement.document_type_id,
        requirement: 'required', // Default for now
        status: requirement.status,
        validUntil: requirement.valid_to,
        documents: reqDocs,
        requirementId: requirement.id
      });
    }

    return documents;
  } catch (error) {
    console.error('Error getting documents for contractor:', error);
    return [];
  }
}

// Subscribe to document changes (using realtime)
export function subscribeToDocumentChanges(
  subcontractorId: string,
  callback: () => void
): () => void {
  const channel = supabase
    .channel('document-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents'
      },
      () => callback()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'requirements'
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}