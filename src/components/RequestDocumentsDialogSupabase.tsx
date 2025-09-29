import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import RequirementSelector from "@/components/RequirementSelector";

interface RequestDocumentsDialogSupabaseProps {
  contractorId: string;
  contractorEmail?: string;
  onClose: () => void;
}

type RequirementStatus = "required" | "optional" | "hidden";

export default function RequestDocumentsDialogSupabase({
  contractorId,
  contractorEmail,
  onClose
}: RequestDocumentsDialogSupabaseProps) {
  const [requirements, setRequirements] = useState<Record<string, RequirementStatus>>({});
  const [sendInvitation, setSendInvitation] = useState(false);
  const [message, setMessage] = useState("Hallo, bitte laden Sie die angeforderten Dokumente hoch. Vielen Dank.");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize requirements state
  useEffect(() => {
    const loadExistingRequirements = async () => {
      try {
        // Get existing requirements for this subcontractor via project_subs join
        const { data: existingReqs, error } = await supabase
          .from('requirements')
          .select(`
            document_type_id, 
            status,
            project_subs!inner(subcontractor_id)
          `)
          .eq('project_subs.subcontractor_id', contractorId);

        if (error) {
          console.error('Error loading requirements:', error);
          // Initialize with default values if error
          const initialReqs: Record<string, RequirementStatus> = {};
          DOCUMENT_TYPES.forEach(docType => {
            initialReqs[docType.id] = docType.defaultRequirement;
          });
          setRequirements(initialReqs);
          return;
        }

        // Initialize all document types with default status
        const initialReqs: Record<string, RequirementStatus> = {};
        DOCUMENT_TYPES.forEach(docType => {
          const existing = existingReqs?.find(req => req.document_type_id === docType.id);
          // Map requirement status to our UI status
          if (existing) {
            if (existing.status === 'missing' || existing.status === 'expired' || existing.status === 'rejected') {
              initialReqs[docType.id] = "required";
            } else if (existing.status === 'valid' || existing.status === 'submitted' || existing.status === 'in_review') {
              initialReqs[docType.id] = "required"; // Still required, just fulfilled
            } else {
              initialReqs[docType.id] = "optional";
            }
          } else {
            initialReqs[docType.id] = docType.defaultRequirement;
          }
        });

        setRequirements(initialReqs);
      } catch (error) {
        console.error('Error initializing requirements:', error);
      }
    };

    loadExistingRequirements();
  }, [contractorId]);

  const handleRequirementChange = (docTypeId: string, requirement: RequirementStatus) => {
    setRequirements(prev => ({
      ...prev,
      [docTypeId]: requirement
    }));
  };

  const handleApply = async () => {
    try {
      setLoading(true);

      // Count requirements to be created
      const requiredDocs = Object.entries(requirements)
        .filter(([_, status]) => status === "required");

      // For demo mode, we'll work directly with the compute-requirements edge function
      // instead of manually creating project_subs and requirements
      try {
        const { data, error } = await supabase.functions.invoke('compute-requirements', {
          body: {
            subcontractor_id: contractorId
          }
        });

        if (error) {
          throw error;
        }

        console.log('Requirements computed:', data);
        
        // Send invitation if requested
        if (sendInvitation && contractorEmail) {
          try {
            const { error: inviteError } = await supabase.functions.invoke('create-magic-link', {
              body: {
                contractor_id: contractorId,
                email: contractorEmail
              }
            });

            if (inviteError) {
              console.error('Error sending invitation:', inviteError);
              toast({
                title: "Dokumente aktualisiert",
                description: "Anforderungen gespeichert, aber Einladung konnte nicht gesendet werden.",
                variant: "default"
              });
            } else {
              toast({
                title: "Erfolgreich",
                description: `Anforderungen aktualisiert und Einladung gesendet.`
              });
            }
          } catch (inviteError) {
            console.error('Error sending invitation:', inviteError);
            toast({
              title: "Dokumente aktualisiert",
              description: "Anforderungen gespeichert, aber Einladung konnte nicht gesendet werden.",
              variant: "default"
            });
          }
        } else {
          toast({
            title: "Dokumente aktualisiert",
            description: `Anforderungen wurden erfolgreich aktualisiert.`
          });
        }

        onClose();
      } catch (error) {
        console.error('Error computing requirements:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error applying document requirements:', error);
      toast({
        title: "Fehler",
        description: "Die Anforderungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Dokumente anfordern</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Legen Sie fest, welche Dokumente erforderlich sind
        </p>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {/* Documents List */}
          <div className="space-y-3">
            {DOCUMENT_TYPES.map(docType => (
              <div key={docType.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">{docType.label}</Label>
              </div>
              <RequirementSelector
                compact
                value={requirements[docType.id] || "hidden"}
                onChange={(value) => handleRequirementChange(docType.id, value)}
              />
              </div>
            ))}
          </div>

          {/* Send Invitation Option */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="sendInvitation"
                checked={sendInvitation}
                onCheckedChange={(checked) => setSendInvitation(checked === true)}
              />
              <Label htmlFor="sendInvitation">Einladung direkt senden</Label>
            </div>

            {sendInvitation && (
              <div className="space-y-2">
                <Label htmlFor="message">Nachricht</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nachricht für die Einladung..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-6 border-t flex justify-between">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button onClick={handleApply} disabled={loading}>
          {loading ? "Wird gespeichert..." : "Übernehmen"}
        </Button>
      </div>
    </div>
  );
}