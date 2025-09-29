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
        // Get existing requirements for this subcontractor
        const { data: existingReqs, error } = await supabase
          .from('requirements')
          .select('document_type_id, status')
          .eq('project_sub_id', contractorId);

        if (error) {
          console.error('Error loading requirements:', error);
          return;
        }

        // Initialize all document types with default status
        const initialReqs: Record<string, RequirementStatus> = {};
        DOCUMENT_TYPES.forEach(docType => {
          const existing = existingReqs?.find(req => req.document_type_id === docType.id);
          initialReqs[docType.id] = existing ? "required" : "hidden";
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

      // First, get the project_sub record for this subcontractor
      let { data: projectSubs, error: projectSubError } = await supabase
        .from('project_subs')
        .select('id')
        .eq('subcontractor_id', contractorId)
        .maybeSingle();

      if (projectSubError) {
        throw projectSubError;
      }

      let projectSubId = projectSubs?.id;

      // If no project_sub exists, create one (for demo mode)
      if (!projectSubId) {
        // Get or create a default project for this tenant
        let { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('tenant_id', '00000000-0000-0000-0000-000000000001')
          .maybeSingle();

        if (projectError) {
          throw projectError;
        }

        let projectId = projects?.id;

        // Create default project if none exists
        if (!projectId) {
          const { data: newProject, error: newProjectError } = await supabase
            .from('projects')
            .insert({
              tenant_id: '00000000-0000-0000-0000-000000000001',
              name: 'Demo Projekt',
              code: 'DEMO'
            })
            .select('id')
            .single();

          if (newProjectError) {
            throw newProjectError;
          }

          projectId = newProject.id;
        }

        // Create project_sub
        const { data: newProjectSub, error: newProjectSubError } = await supabase
          .from('project_subs')
          .insert({
            project_id: projectId,
            subcontractor_id: contractorId,
            status: 'active'
          })
          .select('id')
          .single();

        if (newProjectSubError) {
          throw newProjectSubError;
        }

        projectSubId = newProjectSub.id;
      }

      // Now create/update requirements
      const requiredDocs = Object.entries(requirements)
        .filter(([_, status]) => status === "required");

      for (const [docTypeId, status] of Object.entries(requirements)) {
        if (status === "hidden") continue;

        // Check if requirement already exists
        const { data: existingReq } = await supabase
          .from('requirements')
          .select('id')
          .eq('project_sub_id', projectSubId)
          .eq('document_type_id', docTypeId)
          .maybeSingle();

        if (existingReq) {
          // Update existing requirement
          await supabase
            .from('requirements')
            .update({
              status: status === "required" ? "missing" : "optional",
              updated_at: new Date().toISOString()
            })
            .eq('id', existingReq.id);
        } else {
          // Create new requirement
          await supabase
            .from('requirements')
            .insert({
              project_sub_id: projectSubId,
              document_type_id: docTypeId,
              status: status === "required" ? "missing" : "optional",
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
            });
        }
      }

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
              description: `${requiredDocs.length} Dokumente angefordert und Einladung gesendet.`
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
          description: `${requiredDocs.length} Dokumente als erforderlich markiert.`
        });
      }

      onClose();
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