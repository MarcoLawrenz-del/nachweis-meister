import { useState, useEffect } from "react";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import RequirementSelector from "@/components/RequirementSelector";
import { getDocs, setDocs } from "@/services/contractorDocs.store";
import type { ContractorDocument, Requirement } from "@/services/contractors";

export default function RequestDocumentsDialog({ contractorId, onClose }: { contractorId: string; onClose: () => void; }) {
  const initial = Object.fromEntries(DOCUMENT_TYPES.map(d => [d.id, (getDocs(contractorId).find(x => x.documentTypeId === d.id)?.requirement ?? d.defaultRequirement) as Requirement]));
  const [reqs, setReqs] = useState<Record<string, Requirement>>(initial);
  
  function apply() {
    const cur = getDocs(contractorId);
    const next: ContractorDocument[] = [];
    
    for (const dt of DOCUMENT_TYPES) {
      const r = reqs[dt.id];
      const existing = cur.find(c => c.documentTypeId === dt.id);
      
      if (r === "hidden") { 
        /* weglassen */ 
        continue; 
      }
      
      if (existing) {
        next.push({ ...existing, requirement: r, status: existing.status });
      } else {
        next.push({ 
          contractorId, 
          documentTypeId: dt.id, 
          requirement: r, 
          status: "missing", 
          validUntil: null, 
          rejectionReason: null 
        });
      }
    }
    
    setDocs(contractorId, next);
    onClose();
  }
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Dokumente anfordern</h2>
      <div className="border rounded-xl">
        <div className="grid grid-cols-2 px-3 py-2 text-xs uppercase text-muted-foreground">
          <div>Dokument</div><div>Anforderung</div>
        </div>
        {DOCUMENT_TYPES.map(dt => (
          <div key={dt.id} className="grid grid-cols-2 items-center px-3 py-2 border-t">
            <div className="text-sm">{dt.label}</div>
            <div className="justify-self-end">
              <RequirementSelector compact value={reqs[dt.id]} onChange={v => setReqs(s => ({ ...s, [dt.id]: v }))} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button className="px-3 py-1.5 rounded border" onClick={onClose}>Zurück</button>
        <button className="px-3 py-1.5 rounded bg-black text-white" onClick={apply}>Übernehmen</button>
      </div>
    </div>
  );
}