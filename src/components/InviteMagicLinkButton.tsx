import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMagicInvitation } from "@/services/email";
import { getDocs } from "@/services/contractorDocs.store";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import type { Contractor } from "@/services/contractors.store";

interface InviteMagicLinkButtonProps {
  contractor: Contractor;
  className?: string;
}

export function InviteMagicLinkButton({ contractor, className }: InviteMagicLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [magicLink, setMagicLink] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const { toast } = useToast();

  const handleSendInvitation = async () => {
    setIsSending(true);
    
    try {
      // Get required documents for this contractor
      const docs = getDocs(contractor.id);
      const requiredDocs = docs
        .filter(d => d.requirement === "required")
        .map(d => {
          const docType = DOCUMENT_TYPES.find(dt => dt.id === d.documentTypeId);
          return docType?.label || d.documentTypeId;
        });

      const result = await sendMagicInvitation({
        contractorId: contractor.id,
        email: contractor.contact_email,
        contractorName: contractor.company_name,
        companyName: "Ihr Auftraggeber", // TODO: Get from tenant/user context
        requiredDocs
      });

      if (result.magicLink) {
        setMagicLink(result.magicLink);
      }

      toast({
        title: result.isStub ? "Demo: Einladung simuliert" : "Einladung versendet",
        description: result.isStub 
          ? `Demo-Modus: Magic-Link wurde erstellt aber keine E-Mail versendet.`
          : `Eine E-Mail mit dem Upload-Link wurde an ${contractor.contact_email} gesendet.`,
      });

    } catch (error: any) {
      console.error("Error sending magic invitation:", error);
      toast({
        title: "Fehler beim Versenden",
        description: error.message || "Die Einladung konnte nicht versendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyMagicLink = () => {
    if (magicLink) {
      navigator.clipboard.writeText(magicLink);
      toast({
        title: "Link kopiert",
        description: "Der Magic-Link wurde in die Zwischenablage kopiert."
      });
    }
  };

  const openMagicLink = () => {
    if (magicLink) {
      window.open(magicLink, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Mail className="h-4 w-4 mr-2" />
          Magic-Link Einladung
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Magic-Link Einladung senden</DialogTitle>
          <DialogDescription>
            Sende eine Einladung mit sicherem Upload-Link an {contractor.company_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {contractor.contact_email}
            </div>
          </div>

          <div>
            <Label htmlFor="message">Persönliche Nachricht (optional)</Label>
            <Textarea
              id="message"
              placeholder="Hallo, bitte laden Sie die angeforderten Unterlagen über den Link hoch..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              disabled={isSending}
            />
          </div>

          {magicLink && (
            <Alert className="border-success bg-success/5">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Magic-Link erstellt:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background p-1 rounded flex-1 truncate">
                      {magicLink}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyMagicLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={openMagicLink}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSending}
              className="flex-1"
            >
              Schließen
            </Button>
            <Button 
              onClick={handleSendInvitation}
              disabled={isSending}
              className="flex-1"
            >
              {isSending ? "Wird versendet..." : "Einladung senden"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}