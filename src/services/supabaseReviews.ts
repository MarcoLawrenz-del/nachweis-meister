import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export interface SupabaseReviewHistory {
  id: string;
  requirement_id: string;
  reviewer_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  comment?: string;
  created_at: string;
}

// Review history service for Supabase
export async function getSupabaseReviewHistory(
  requirementId?: string,
  subcontractorId?: string
): Promise<SupabaseReviewHistory[]> {
  try {
    let query = supabase
      .from('review_history')
      .select(`
        *,
        requirements!inner (
          id,
          project_subs!inner (
            subcontractor_id
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (requirementId) {
      query = query.eq('requirement_id', requirementId);
    }

    if (subcontractorId) {
      query = query.eq('requirements.project_subs.subcontractor_id', subcontractorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching review history:', error);
    return [];
  }
}

export async function addSupabaseReviewEntry(
  requirementId: string,
  reviewerId: string,
  action: string,
  oldStatus?: string,
  newStatus?: string,
  comment?: string
): Promise<SupabaseReviewHistory> {
  try {
    const { data, error } = await supabase
      .from('review_history')
      .insert({
        requirement_id: requirementId,
        reviewer_id: reviewerId,
        action,
        old_status: oldStatus,
        new_status: newStatus,
        comment
      })
      .select()
      .single();

    if (error) throw error;

    debug.log('✅ Review entry added to Supabase:', data);
    return data;
  } catch (error: any) {
    debug.error('❌ Failed to add review entry:', error);
    throw new Error(`Failed to add review entry: ${error.message}`);
  }
}

export async function getRecentSupabaseActivity(
  daysBack: number = 7,
  tenantId?: string
): Promise<any[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    let query = supabase
      .from('review_history')
      .select(`
        *,
        requirements!inner (
          document_type_id,
          project_subs!inner (
            subcontractor_id,
            subcontractors!inner (
              company_name,
              tenant_id
            )
          )
        )
      `)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('requirements.project_subs.subcontractors.tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to match legacy format
    return (data || []).map(entry => ({
      id: entry.id,
      contractorId: entry.requirements.project_subs.subcontractor_id,
      companyName: entry.requirements.project_subs.subcontractors.company_name,
      docType: entry.requirements.document_type_id,
      action: entry.action,
      tsISO: entry.created_at,
      actor: 'admin',
      meta: {
        oldStatus: entry.old_status,
        newStatus: entry.new_status,
        comment: entry.comment
      }
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

// Legacy compatibility functions
export async function getAllRecentEvents(daysBack: number = 7): Promise<any[]> {
  return getRecentSupabaseActivity(daysBack);
}

export async function appendEvent(event: any): Promise<any> {
  return addSupabaseReviewEntry(
    event.requirementId,
    event.reviewerId || 'system',
    event.kind,
    event.oldStatus,
    event.newStatus,
    event.comment
  );
}

export async function getDocReview(contractorId: string, docType: string): Promise<any> {
  try {
    // Get requirements for this contractor and document type
    const { data: requirements, error } = await supabase
      .from('requirements')
      .select(`
        *,
        project_subs!inner (
          subcontractor_id
        )
      `)
      .eq('project_subs.subcontractor_id', contractorId)
      .eq('document_type_id', docType)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!requirements || requirements.length === 0) {
      return {
        latestFile: null,
        decision: {
          contractorId,
          docType,
          decision: 'pending'
        },
        history: []
      };
    }

    const requirement = requirements[0];

    // Get latest document
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('requirement_id', requirement.id)
      .order('uploaded_at', { ascending: false })
      .limit(1);

    // Get review history
    const history = await getSupabaseReviewHistory(requirement.id);

    return {
      latestFile: documents?.[0] || null,
      decision: {
        contractorId,
        docType,
        decision: requirement.status === 'valid' ? 'accepted' : 
                  requirement.status === 'rejected' ? 'rejected' : 'pending',
        reason: requirement.rejection_reason,
        decidedAtISO: requirement.updated_at,
        decidedBy: 'admin'
      },
      history
    };
  } catch (error) {
    console.error('Error getting doc review:', error);
    return {
      latestFile: null,
      decision: { contractorId, docType, decision: 'pending' },
      history: []
    };
  }
}

// Subscribe to review changes
export function subscribeToReviewChanges(callback: () => void): () => void {
  const channel = supabase
    .channel('review-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'review_history'
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}