import type { ContractorDocument } from "./contractors";

const db = new Map<string, ContractorDocument[]>();
const listeners = new Map<string, Set<() => void>>();

export function getDocs(id: string) { 
  return db.get(id) ?? []; 
}

export function setDocs(id: string, docs: ContractorDocument[]) { 
  db.set(id, docs); 
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