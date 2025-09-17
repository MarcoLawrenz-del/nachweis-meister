// ============= Contractors Store =============
// localStorage-based store for contractors with subscribe mechanism

export type Contractor = {
  id: string;
  company_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  country?: string;
  address?: string;
  notes?: string;
  created_at: string; // ISO
  active: boolean;
};

const contractorsMap = new Map<string, Contractor>();
const listeners = new Set<() => void>();

const LS_KEY = "subfix.contractors.v1";

function load(): Contractor[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function save(contractors: Contractor[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(contractors));
  } catch {}
}

function loadToMap() {
  const contractors = load();
  contractorsMap.clear();
  contractors.forEach(c => contractorsMap.set(c.id, c));
}

function saveFromMap() {
  const contractors = Array.from(contractorsMap.values());
  save(contractors);
  listeners.forEach(fn => fn());
}

// Initialize on first import
loadToMap();

export function listContractors(): Contractor[] {
  return Array.from(contractorsMap.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getContractor(id: string): Contractor | undefined {
  return contractorsMap.get(id);
}

export function createContractor(data: Omit<Contractor, "id"|"created_at"|"active"> & { active?: boolean }): Contractor {
  const id = crypto.randomUUID();
  const contractor: Contractor = {
    id,
    ...data,
    active: data.active ?? true,
    created_at: new Date().toISOString(),
  };
  
  contractorsMap.set(id, contractor);
  saveFromMap();
  return contractor;
}

export function updateContractor(id: string, patch: Partial<Contractor>): Contractor {
  const existing = contractorsMap.get(id);
  if (!existing) {
    throw new Error(`Contractor with id ${id} not found`);
  }
  
  const updated = { ...existing, ...patch };
  contractorsMap.set(id, updated);
  saveFromMap();
  return updated;
}

export function deleteContractor(id: string): void {
  if (!contractorsMap.has(id)) {
    throw new Error(`Contractor with id ${id} not found`);
  }
  
  contractorsMap.delete(id);
  saveFromMap();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}