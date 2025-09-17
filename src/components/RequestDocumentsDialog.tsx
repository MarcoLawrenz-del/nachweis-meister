import { useState, useEffect } from "react";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import RequirementSelector from "@/components/RequirementSelector";
import { getDocs, setDocs, setContractorMeta } from "@/services/contractorDocs.store";
import { getContractor } from "@/services/contractors";
import type { ContractorDocument, Requirement } from "@/services/contractors";
import { sendInvitationLegacy as sendInvitation, getEmailErrorMessage } from "@/services/email";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { makeCustomDocId, isCustomDoc, displayName, validateCustomDocName } from "@/utils/customDocs";
import { Plus, X } from "lucide-react";

export default function RequestDocumentsDialog({ 
  contractorId, 
  contractorEmail, 
  onClose 
}: { 
  contractorId: string; 
  contractorEmail?: string; 
  onClose: () => void; 
}) {
  const existingDocs = getDocs(contractorId);
  const initial = Object.fromEntries(DOCUMENT_TYPES.map(d => [d.id, (existingDocs.find(x => x.documentTypeId === d.id)?.requirement ?? d.defaultRequirement) as Requirement]));
  
  // Add existing custom documents to requirements
  const customDocs = existingDocs.filter(doc => isCustomDoc(doc.documentTypeId));
  customDocs.forEach(doc => {
    initial[doc.documentTypeId] = doc.requirement;
  });
  
  const [reqs, setReqs] = useState<Record<string, Requirement>>(initial);
  const [customDocLabels, setCustomDocLabels] = useState<Record<string, string>>({});
  const [sendNow, setSendNow] = useState(false);
  const [message, setMessage] = useState("Hallo {{name}}, bitte laden Sie die angeforderten Dokumente unter {{magic_link}} hoch. Vielen Dank.");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDocName, setCustomDocName] = useState("");
  const [customDocRequirement, setCustomDocRequirement] = useState<Requirement>("required");
  const [customNameError, setCustomNameError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get all document types (config + custom)
  const allDocuments = [
    ...DOCUMENT_TYPES,
    ...customDocs.map(doc => ({
      id: doc.documentTypeId,
      label: displayName(doc.documentTypeId, '', doc.customName, doc.label),
      defaultRequirement: doc.requirement
    }))
  ];
  
  const validateCustomName = (name: string) => {
    const error = validateCustomDocName(name, existingDocs);
    setCustomNameError(error);
    return error === null;
  };
  
  const addCustomDocument = () => {
    if (!validateCustomName(customDocName)) return;
    
    const docId = makeCustomDocId(customDocName);
    setReqs(prev => ({ ...prev, [docId]: customDocRequirement }));
    setCustomDocLabels(prev => ({ ...prev, [docId]: customDocName }));
    
    // Reset form
    setCustomDocName("");
    setCustomDocRequirement("required");
    setShowCustomForm(false);
    setCustomNameError(null);
  };
  
  const removeCustomDocument = (docId: string) => {
    const { [docId]: removed, ...rest } = reqs;
    setReqs(rest);
    const { [docId]: removedLabel, ...restLabels } = customDocLabels;
    setCustomDocLabels(restLabels);
  };
  
  async function apply() {
    const cur = getDocs(contractorId);
    const next: ContractorDocument[] = [];
    
    // Determine which documents are becoming required/optional  
    const becameRequired: string[] = [];
    const becameOptional: string[] = [];
    
    // Process all requirements (config + custom)
    for (const [docId, requirement] of Object.entries(reqs)) {
      const existing = cur.find(c => c.documentTypeId === docId);
      const isCustomDocument = isCustomDoc(docId);
      
      if (requirement === "hidden") {
        // Remove hidden custom documents from store
        if (isCustomDocument && existing) {
          // Skip adding to next array - effectively removes it
          continue;
        }
        // For config documents, keep them but mark as hidden
        if (!isCustomDocument && existing) {
          next.push({ ...existing, requirement });
        }
        continue; 
      }
      
      // Get document label - use stored label for new custom docs, existing label for existing docs
      let docLabel: string;
      if (isCustomDocument) {
        const storedLabel = customDocLabels[docId];
        const existingDoc = cur.find(c => c.documentTypeId === docId);
        docLabel = storedLabel || existingDoc?.label || existingDoc?.customName || docId.replace('custom:', '');
      } else {
        docLabel = DOCUMENT_TYPES.find(d => d.id === docId)?.label || docId;
      }
      
      // Check if requirement changed to required or optional
      if (existing) {
        if (existing.requirement === "hidden" && requirement === "required") {
          becameRequired.push(docLabel);
        } else if (existing.requirement === "hidden" && requirement === "optional") {
          becameOptional.push(docLabel);
        } else if (existing.requirement === "optional" && requirement === "required") {
          becameRequired.push(docLabel);
        }
        next.push({ 
          ...existing, 
          requirement,
          customName: isCustomDocument ? docLabel : existing.customName,
          label: isCustomDocument ? docLabel : existing.label
        });
      } else {
        if (requirement === "required") becameRequired.push(docLabel);
        if (requirement === "optional") becameOptional.push(docLabel);
        
        next.push({ 
          contractorId, 
          documentTypeId: docId, 
          requirement, 
          status: "missing", 
          validUntil: null, 
          rejectionReason: null,
          customName: isCustomDocument ? docLabel : undefined,
          label: isCustomDocument ? docLabel : undefined
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
      title: "Dokumente angefordert", 
      description: `${reqCount.required} Pflicht / ${reqCount.optional} Optional` 
    });
    
    // Send invitation if requested
    if (sendNow) {
      // Get contractor email from store
      const contractor = getContractor(contractorId);
      const email = contractor?.email || contractorEmail;
      
      if (email) {
        const link = `${window.location.origin}/upload?cid=${contractorId}`;
        const personalizedMessage = message
          .replace("{{magic_link}}", link)
          .replace("{{name}}", contractor?.company_name || "");
          
        try {
          const result = await sendInvitation({ 
            contractorId, 
            email: email, 
            message: personalizedMessage,
            contractorName: contractor?.company_name
          });
          
          // Update lastRequestedAt after successful send
          setContractorMeta(contractorId, { lastRequestedAt: now });
          
          toast({ 
            title: result.isStub ? "Im Demo-Modus gesendet (Stub)" : "Einladung gesendet", 
            description: email 
          });
        } catch (error: any) {
          toast({
            title: "Fehler beim Senden",
            description: getEmailErrorMessage(error),
            variant: "destructive"
          });
        }
      } else {
        console.warn("Cannot send invitation: contractor email not available");
      }
    }
    
    onClose();
  }
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Dokumente anfordern</h2>
      
      {/* Add Custom Document Button */}
      <div className="mb-4">
        <Button
          variant="outline" 
          size="sm"
          onClick={() => setShowCustomForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Eigenes Dokument hinzufügen
        </Button>
      </div>

      {/* Custom Document Form */}
      {showCustomForm && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-3">
            <div>
              <Label htmlFor="customName">Dokumentname</Label>
              <Input
                id="customName"
                value={customDocName}
                onChange={(e) => {
                  setCustomDocName(e.target.value);
                  if (customNameError) validateCustomName(e.target.value);
                }}
                placeholder="z.B. Bankbestätigung"
                className={customNameError ? "border-red-500" : ""}
              />
              {customNameError && (
                <p className="text-sm text-red-500 mt-1">{customNameError}</p>
              )}
            </div>
            <div>
              <Label>Anforderung</Label>
              <RequirementSelector 
                value={customDocRequirement} 
                onChange={setCustomDocRequirement} 
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={addCustomDocument}
                disabled={!customDocName.trim() || !!customNameError}
              >
                Hinzufügen
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomDocName("");
                  setCustomNameError(null);
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Documents Table */}
      <div className="border rounded-xl">
        <div className="grid grid-cols-2 px-3 py-2 text-xs uppercase text-muted-foreground">
          <div>Dokument</div><div>Anforderung</div>
        </div>
        
        {/* Standard Documents */}
        {DOCUMENT_TYPES.map(dt => (
          <div key={dt.id} className="grid grid-cols-2 items-center px-3 py-2 border-t">
            <div className="text-sm">{dt.label}</div>
            <div className="justify-self-end">
              <RequirementSelector compact value={reqs[dt.id]} onChange={v => setReqs(s => ({ ...s, [dt.id]: v }))} />
            </div>
          </div>
        ))}
        
        {/* Custom Documents */}
        {Object.entries(reqs).filter(([docId]) => isCustomDoc(docId)).map(([docId, requirement]) => {
          const customDoc = customDocs.find(d => d.documentTypeId === docId);
          const docName = displayName(docId, '', customDoc?.customName, customDoc?.label);
          
          return (
            <div key={docId} className="grid grid-cols-2 items-center px-3 py-2 border-t bg-blue-50/50">
              <div className="text-sm flex items-center gap-2">
                <span>{docName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomDocument(docId)}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </div>
              <div className="justify-self-end">
                <RequirementSelector compact value={requirement} onChange={v => setReqs(s => ({ ...s, [docId]: v }))} />
              </div>
            </div>
          );
        })}
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