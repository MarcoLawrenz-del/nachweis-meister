import { useState, useEffect } from "react";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import RequirementSelector from "@/components/RequirementSelector";
import { getDocs, setDocs, setContractorMeta } from "@/services/contractorDocs.store";
import { getContractor } from "@/services/contractors";
import type { ContractorDocument, Requirement } from "@/services/contractors";
import { sendInvitation } from "@/services/email";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RequestDocumentsDialog({ 
  contractorId, 
  contractorEmail, 
  onClose 
}: { 
  contractorId: string; 
  contractorEmail?: string; 
  onClose: () => void; 
}) {
  const initial = Object.fromEntries(DOCUMENT_TYPES.map(d => [d.id, (getDocs(contractorId).find(x => x.documentTypeId === d.id)?.requirement ?? d.defaultRequirement) as Requirement]));
  const [reqs, setReqs] = useState<Record<string, Requirement>>(initial);
  const [sendNow, setSendNow] = useState(false);
  const [message, setMessage] = useState("Hallo {{name}}, bitte laden Sie die angeforderten Dokumente unter {{magic_link}} hoch. Vielen Dank.");
  const { toast } = useToast();
  
  async function apply() {
    const cur = getDocs(contractorId);
    const next: ContractorDocument[] = [];
    
    // Determine which documents are becoming required/optional  
    const becameRequired: string[] = [];
    const becameOptional: string[] = [];
    
    for (const dt of DOCUMENT_TYPES) {
      const r = reqs[dt.id];
      const existing = cur.find(c => c.documentTypeId === dt.id);
      
      if (r === "hidden") { 
        /* weglassen */ 
        continue; 
      }
      
      // Check if requirement changed to required or optional
      if (existing) {
        if (existing.requirement === "hidden" && r === "required") {
          becameRequired.push(dt.label);
        } else if (existing.requirement === "hidden" && r === "optional") {
          becameOptional.push(dt.label);
        } else if (existing.requirement === "optional" && r === "required") {
          becameRequired.push(dt.label);
        }
        next.push({ ...existing, requirement: r, status: existing.status });
      } else {
        if (r === "required") becameRequired.push(dt.label);
        if (r === "optional") becameOptional.push(dt.label);
        
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
    
    // Track last request time
    const now = new Date().toISOString();
    setContractorMeta(contractorId, { lastRequestedAt: now });
    
    // Count requirements
    const reqCount = {
      required: next.filter(doc => doc.requirement === 'required').length,
      optional: next.filter(doc => doc.requirement === 'optional').length
    };
    
    toast({ 
      title: "Anforderungen versendet", 
      description: `${reqCount.required} Pflicht / ${reqCount.optional} Optional` 
    });
    
    // Send invitation if requested
    if (sendNow) {
      // Get contractor email from store
      const contractor = getContractor(contractorId);
      const email = contractor?.email || contractorEmail;
      
      if (email) {
        const link = `${window.location.origin}/upload?cid=${contractorId}`;
        const requestedDocs = [...becameRequired, ...becameOptional];
        const personalizedMessage = message
          .replace("{{magic_link}}", link)
          .replace("{{name}}", contractor?.company_name || "");
          
        await sendInvitation({ 
          contractorId, 
          email: email, 
          message: personalizedMessage,
          contractorName: contractor?.company_name
        });
        
        toast({ 
          title: "Einladung gesendet", 
          description: email 
        });
      } else {
        console.warn("Cannot send invitation: contractor email not available");
      }
    }
    
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
      
      {/* Invitation Toggle and Message */}
      <div className="mt-6 space-y-4 border-t pt-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="sendNow" 
            checked={sendNow} 
            onCheckedChange={(checked) => setSendNow(checked === true)}
          />
          <Label htmlFor="sendNow">Direkt Einladung senden</Label>
        </div>
        
        {sendNow && (
          <div className="space-y-2">
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nachricht für die Einladung..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Verwenden Sie {`{{name}}`} für den Namen und {`{{magic_link}}`} für den Upload-Link.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between">
        <button className="px-3 py-1.5 rounded border" onClick={onClose}>Zurück</button>
        <button className="px-3 py-1.5 rounded bg-black text-white" onClick={apply}>Übernehmen</button>
      </div>
    </div>
  );
}