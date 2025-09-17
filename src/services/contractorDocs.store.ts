import type { ContractorDocument } from "./contractors";

const db = new Map<string, ContractorDocument[]>();
const listeners = new Map<string, Set<() => void>>();

const LS_KEY = (id: string) => `contractorDocs:${id}`;
function load(id: string) { 
  if (typeof window === "undefined") return null; 
  try { 
    const s = localStorage.getItem(LS_KEY(id)); 
    return s ? JSON.parse(s) : null; 
  } catch { 
    return null; 
  } 
}
function save(id: string, docs: ContractorDocument[]) { 
  if (typeof window === "undefined") return; 
  try { 
    localStorage.setItem(LS_KEY(id), JSON.stringify(docs)); 
  } catch {} 
}

export function getDocs(id: string) { 
  const m = db.get(id); 
  if (m) return m; 
  const fromLS = load(id) ?? []; 
  db.set(id, fromLS); 
  return fromLS; 
}

export function setDocs(id: string, docs: ContractorDocument[]) { 
  db.set(id, docs); 
  save(id, docs); 
  listeners.get(id)?.forEach(fn => fn()); 
}

export function upsertDoc(id: string, doc: ContractorDocument) {
  const cur = getDocs(id); 
  const i = cur.findIndex(d => d.documentTypeId === doc.documentTypeId);
  if (i >= 0) cur[i] = doc; 
  else cur.push(doc); 
  setDocs(id, [...cur]);
}

export function subscribe(id: string, fn: () => void) { 
  const s = listeners.get(id) ?? new Set(); 
  s.add(fn); 
  listeners.set(id, s); 
  return () => { s.delete(fn); }; 
}