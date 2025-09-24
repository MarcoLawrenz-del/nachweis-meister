import { supabase } from '@/integrations/supabase/client';

export interface DocRequirement {
  type: string;
  label: string;
  description?: string;
  requirement: 'required' | 'optional';
}

// Guard against localStorage usage in public flow
const assertNoLocalStorageInPublic = () => {
  if (window.location.pathname.startsWith('/upload/')) {
    console.error('forbidden: localStorage in public flow');
    throw new Error('localStorage usage forbidden in public upload flow');
  }
};

export const fetchLatestSnapshot = async (contractorId: string): Promise<DocRequirement[]> => {
  try {
    console.info('[RequirementsSnapshot] Fetching latest snapshot for contractor:', contractorId);
    
    // Fetch from Supabase only
    const { data, error } = await supabase
      .from('contractor_requirements')
      .select('docs')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[RequirementsSnapshot] Error fetching from Supabase:', error);
      throw error;
    }

    if (data?.docs && Array.isArray(data.docs) && data.docs.length > 0) {
      console.info('[RequirementsSnapshot] Found snapshot in Supabase:', data.docs.length, 'requirements');
      return data.docs as unknown as DocRequirement[];
    }

    console.warn('[RequirementsSnapshot] No snapshot found in Supabase');
    return [];
  } catch (error: any) {
    console.error('[RequirementsSnapshot] fetchLatestSnapshot failed:', error);
    return [];
  }
};

export const storeSnapshot = async (contractorId: string, requirements: DocRequirement[]): Promise<void> => {
  try {
    // Assert no localStorage usage in public flow
    assertNoLocalStorageInPublic();
    
    console.info('[RequirementsSnapshot] Storing snapshot for contractor:', contractorId, requirements.length, 'requirements');
    
    // Store in Supabase only
    const { error } = await supabase
      .from('contractor_requirements')
      .upsert({
        contractor_id: contractorId,
        docs: requirements as any
      });

    if (error) {
      console.error('[RequirementsSnapshot] Error storing in Supabase:', error);
      throw error;
    }
    
    console.info('[RequirementsSnapshot] Snapshot stored successfully');
  } catch (error: any) {
    console.error('[RequirementsSnapshot] storeSnapshot failed:', error);
    throw error;
  }
};