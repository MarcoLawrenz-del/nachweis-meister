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

// Meta
type ContractorMeta = { lastRequestedAt?: string };
const metaDb = new Map<string, ContractorMeta>();
const META_KEY = (id:string)=>`contractorDocsMeta:${id}`;
export function getContractorMeta(id:string): ContractorMeta {
  if (!metaDb.get(id)) {
    const raw = localStorage.getItem(META_KEY(id));
    metaDb.set(id, raw ? JSON.parse(raw) : {});
  }
  return metaDb.get(id)!;
}
export function setContractorMeta(id:string, m:ContractorMeta){
  const cur = { ...getContractorMeta(id), ...m };
  metaDb.set(id, cur);
  localStorage.setItem(META_KEY(id), JSON.stringify(cur));
  listeners.get(id)?.forEach(fn=>fn());
}