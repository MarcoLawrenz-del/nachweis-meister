// Requirements Snapshot Service - Supabase backend storage (with localStorage fallback)
import { supabase } from '@/integrations/supabase/client';

export interface DocRequirement {
  type: string;
  label: string;
  description?: string;
  requirement: 'required' | 'optional';
  sortOrder?: number;
}

export interface RequirementSnapshot {
  id: string;
  contractorId: string;
  docs: DocRequirement[];
  createdAt: string;
}

// Temporary localStorage fallback until contractor_requirements table is available
const STORAGE_KEY = "subfix.requirements.snapshots.v1";

function getStorageData(): RequirementSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStorageData(snapshots: RequirementSnapshot[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch (e) {
    console.error("Failed to save snapshots:", e);
  }
}

// Create or update requirements snapshot
export async function createRequirementsSnapshot(
  contractorId: string, 
  docs: DocRequirement[]
): Promise<string> {
  console.info('[requirementsSnapshot] Creating snapshot for contractor:', contractorId, { docCount: docs.length });
  
  try {
    // Try Supabase first
    try {
      const { data, error } = await (supabase as any)
        .from('contractor_requirements')
        .upsert({
          contractor_id: contractorId,
          docs,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'contractor_id'
        })
        .select('contractor_id')
        .single();

      if (!error && data) {
        console.info('[requirementsSnapshot] Snapshot created successfully (Supabase):', data.contractor_id);
        return data.contractor_id;
      }
    } catch (supabaseError) {
      console.warn('[requirementsSnapshot] Supabase not available, using localStorage:', supabaseError);
    }

    // Fallback to localStorage
    const snapshots = getStorageData();
    const newSnapshot: RequirementSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      contractorId,
      docs,
      createdAt: new Date().toISOString()
    };
    
    snapshots.push(newSnapshot);
    saveStorageData(snapshots);

    console.info('[requirementsSnapshot] Snapshot created successfully (localStorage):', newSnapshot.id);
    return newSnapshot.id;
    
  } catch (error) {
    console.error('[requirementsSnapshot] Creation failed:', error);
    throw error;
  }
}

// Fetch latest snapshot for contractor
export async function fetchLatestSnapshot(contractorId: string): Promise<DocRequirement[]> {
  console.info('[requirementsSnapshot] Fetching latest snapshot for contractor:', contractorId);
  
  try {
    // Try Supabase first
    try {
      const { data, error } = await (supabase as any)
        .from('contractor_requirements')
        .select('docs')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data?.docs) {
        console.info('[requirementsSnapshot] Snapshot fetched successfully (Supabase):', { 
          contractorId, 
          docCount: data.docs?.length || 0 
        });
        return data.docs || [];
      }
    } catch (supabaseError) {
      console.warn('[requirementsSnapshot] Supabase not available, using localStorage:', supabaseError);
    }

    // Fallback to localStorage
    const snapshots = getStorageData();
    const contractorSnapshots = snapshots
      .filter(s => s.contractorId === contractorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (contractorSnapshots.length === 0) {
      console.warn('[requirementsSnapshot] No snapshot found for contractor:', contractorId);
      return [];
    }

    const latestSnapshot = contractorSnapshots[0];
    console.info('[requirementsSnapshot] Snapshot fetched successfully (localStorage):', { 
      contractorId, 
      docCount: latestSnapshot.docs?.length || 0 
    });
    
    return latestSnapshot.docs || [];
    
  } catch (error) {
    console.error('[requirementsSnapshot] Fetch failed:', error);
    throw error;
  }
}

// Get all snapshots for contractor (for history/debugging)
export async function fetchSnapshotHistory(contractorId: string): Promise<RequirementSnapshot[]> {
  console.info('[requirementsSnapshot] Fetching snapshot history for contractor:', contractorId);
  
  try {
    // Try Supabase first
    try {
      const { data, error } = await (supabase as any)
        .from('contractor_requirements')
        .select('contractor_id, docs, created_at')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const snapshots: RequirementSnapshot[] = (data || []).map((item: any) => ({
          id: `${item.contractor_id}-${item.created_at}`,
          contractorId: item.contractor_id,
          docs: item.docs,
          createdAt: item.created_at
        }));

        console.info('[requirementsSnapshot] History fetched successfully (Supabase):', { 
          contractorId, 
          snapshotCount: snapshots.length 
        });
        
        return snapshots;
      }
    } catch (supabaseError) {
      console.warn('[requirementsSnapshot] Supabase not available, using localStorage:', supabaseError);
    }

    // Fallback to localStorage
    const snapshots = getStorageData();
    const contractorSnapshots = snapshots
      .filter(s => s.contractorId === contractorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.info('[requirementsSnapshot] History fetched successfully (localStorage):', { 
      contractorId, 
      snapshotCount: contractorSnapshots.length 
    });
    
    return contractorSnapshots;
    
  } catch (error) {
    console.error('[requirementsSnapshot] History fetch failed:', error);
    throw error;
  }
}