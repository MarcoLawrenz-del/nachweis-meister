import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail } from 'lucide-react';
import { sendInvitation } from '@/services/email';

interface InviteSubcontractorProps {
  projectSubId: string;
  subcontractorEmail: string;
  subcontractorName: string;
  projectName: string;
}

export function InviteSubcontractor({ 
  projectSubId, 
  subcontractorEmail, 
  subcontractorName, 
  projectName 
}: InviteSubcontractorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    subject: `Dokumentenanforderung für Projekt: ${projectName}`,
    message: `Hallo ${subcontractorName},

wir benötigen von Ihnen verschiedene Dokumente für das Projekt "${projectName}".

Bitte laden Sie die erforderlichen Dokumente über den untenstehenden Link hoch:
{UPLOAD_LINK}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`
  });
  
  const { profile } = useAuthContext();
  const { toast } = useToast();

  const sendInvite = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Generate unique token for this project-sub combination
      const token = crypto.randomUUID();
      
      // Store invitation via Edge Function (bypasses TypeScript type issues)
      const { error: inviteError } = await supabase.functions.invoke('create-invitation', {
        body: {
          project_sub_id: projectSubId,
          email: subcontractorEmail,
          token: token,
          subject: inviteData.subject,
          message: inviteData.message,
          invited_by: profile.id
        }
      });

      if (inviteError) throw inviteError;

      // Send invitation via stub
      await sendInvitation({
        contractorId: projectSubId,
        email: subcontractorEmail,
        subject: inviteData.subject,
        message: inviteData.message.replace('{UPLOAD_LINK}', 
          `${window.location.origin}/upload/${token}`
        ),
        subcontractorName,
        projectName
      });

      toast({
        title: "Einladung gesendet",
        description: `Einladung wurde an ${subcontractorEmail} gesendet.`
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Fehler beim Senden",
        description: error.message || "Einladung konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-2" />
          Einladung senden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Einladung senden
          </DialogTitle>
          <DialogDescription>
            Senden Sie eine Einladung an {subcontractorName} ({subcontractorEmail}) 
            zum Hochladen der erforderlichen Dokumente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">E-Mail Betreff</Label>
            <Input
              id="subject"
              value={inviteData.subject}
              onChange={(e) => setInviteData(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              rows={8}
              value={inviteData.message}
              onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Ihre Nachricht an den Subunternehmer..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              {'{UPLOAD_LINK}'} wird automatisch durch den Upload-Link ersetzt.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={sendInvite} disabled={loading || !inviteData.subject || !inviteData.message}>
            {loading ? "Sende..." : "Einladung senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}