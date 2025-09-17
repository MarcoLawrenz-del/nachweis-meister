import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Send, CheckCircle2, Package, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/ROUTES';
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import RequirementSelector from "@/components/RequirementSelector";
import { PACKAGE_PROFILES, seedDocumentsForContractor } from "@/services/contractors";
import { sendInvitation } from "@/services/email";

const FormSchema = z.object({
  name: z.string().min(2, "Bitte Name angeben"),
  email: z.string().email("E-Mail ist ungültig").optional(),
  packageId: z.string().min(1, "Bitte ein Dokumentenpaket wählen"),
});

interface NewSubcontractorData {
  company_name: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  address: string;
  country_code: string;
  
  notes: string;
}

interface NewSubcontractorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingSubcontractor?: any;
}

export function NewSubcontractorWizard({ 
  isOpen, 
  onClose, 
  onSuccess,
  editingSubcontractor 
}: NewSubcontractorWizardProps) {
  const navigate = useNavigate();
  const { profile } = useAppAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [sendInvitationFlag, setSendInvitationFlag] = useState(true);
  
  // Step 1: Basic data
  const [subcontractorData, setSubcontractorData] = useState<NewSubcontractorData>({
    company_name: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    address: '',
    country_code: 'DE',
    notes: ''
  });

  // Step 2: Package selection and requirements
  const [selectedPackageId, setSelectedPackageId] = useState<string>('Standard');
  const [requirements, setRequirements] = useState<Record<string,"required"|"optional"|"hidden">>({});
  const [message, setMessage] = useState(
    "Hallo {{name}}, bitte laden Sie die angeforderten Dokumente unter {{magic_link}} hoch. Vielen Dank."
  );

  // Static package options
  const staticPackages = [
    { id: 'Standard', name: 'Standard', description: 'Grundlegende Dokumente für die meisten Projekte' },
    { id: 'Minimal', name: 'Minimal', description: 'Nur die wichtigsten Dokumente' },
    { id: 'Erweitert', name: 'Erweitert', description: 'Umfassende Dokumentensammlung' }
  ];

  // Initialize form data for editing
  useEffect(() => {
    if (editingSubcontractor) {
      setSubcontractorData({
        company_name: editingSubcontractor.company_name,
        contact_name: editingSubcontractor.contact_name || '',
        contact_email: editingSubcontractor.contact_email,
        phone: editingSubcontractor.phone || '',
        address: editingSubcontractor.address || '',
        country_code: editingSubcontractor.country_code,
        
        notes: editingSubcontractor.notes || ''
      });
      // For editing, skip package selection step
      setCurrentStep(1);
    } else {
      // Reset for new subcontractor
      setSubcontractorData({
        company_name: '',
        contact_name: '',
        contact_email: '',
        phone: '',
        address: '',
        country_code: 'DE',
        
        notes: ''
      });
      setCurrentStep(1);
    }
  }, [editingSubcontractor, isOpen]);

  // Sync requirements with selected package
  useEffect(() => {
    const base = PACKAGE_PROFILES[selectedPackageId] ?? {};
    const filled = Object.fromEntries(DOCUMENT_TYPES.map(d => [d.id, base[d.id] ?? d.defaultRequirement]));
    setRequirements(filled);
  }, [selectedPackageId]);


  const handleNextStep = () => {
    if (currentStep === 1 && !editingSubcontractor) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!profile) return;

    try {
      setSubmitting(true);

      // Step 1: Create or update subcontractor
      const subData = {
        tenant_id: profile.tenant_id || null,
        company_name: subcontractorData.company_name,
        contact_name: subcontractorData.contact_name || null,
        contact_email: subcontractorData.contact_email,
        phone: subcontractorData.phone || null,
        address: subcontractorData.address || null,
        country_code: subcontractorData.country_code,
        company_type: 'unternehmen',
        notes: subcontractorData.notes || null
      };

      let subcontractorId: string;

      if (editingSubcontractor) {
        // Update existing subcontractor
        const { error } = await supabase
          .from('subcontractors')
          .update(subData)
          .eq('id', editingSubcontractor.id);

        if (error) throw error;
        subcontractorId = editingSubcontractor.id;

        toast({
          title: "Nachunternehmer aktualisiert",
          description: `${subcontractorData.company_name} wurde erfolgreich aktualisiert.`
        });

        onClose();
        if (onSuccess) onSuccess();
        return;
        } else {
          // Create new subcontractor
          const { data: newSub, error } = await supabase
            .from('subcontractors')
            .insert(subData)
            .select()
            .single();

          if (error) throw error;
          subcontractorId = newSub.id;

          // Seed documents for contractor
          await seedDocumentsForContractor(subcontractorId, selectedPackageId, requirements);

          // Send invitation if email is provided
          if (subcontractorData.contact_email && sendInvitationFlag) {
            await sendInvitation({ contractorId: subcontractorId, email: subcontractorData.contact_email, message });
            toast({ 
              title: "Einladung gesendet", 
              description: subcontractorData.contact_email 
            });
          }

          toast({
            title: "Nachunternehmer erstellt",
            description: `${subcontractorData.company_name} wurde erfolgreich erstellt${sendInvitationFlag ? ' und eingeladen' : ''}.`
          });

          onClose();
          if (onSuccess) onSuccess();
        }

    } catch (error: any) {
      console.error('Error creating subcontractor:', error);
      toast({
        title: "Fehler",
        description: error.message.includes('duplicate') 
          ? "Ein Nachunternehmer mit dieser E-Mail existiert bereits."
          : "Nachunternehmer konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };


  const isStep1Valid = subcontractorData.company_name && subcontractorData.contact_email;
  const isStep2Valid = selectedPackageId && selectedPackageId.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep === 1 ? (
              <>
                <Package className="h-5 w-5" />
                {editingSubcontractor ? 'Nachunternehmer bearbeiten' : 'Neuer Nachunternehmer'}
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                Dokumentenpaket wählen
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? (editingSubcontractor ? 'Bearbeiten Sie die Kontaktdaten des Nachunternehmers.' : 'Schritt 1 von 2: Erfassen Sie die Kontaktdaten des Nachunternehmers.')
              : 'Schritt 2 von 2: Wählen Sie ein Dokumentenpaket und passen Sie die Anforderungen an.'
            }
          </DialogDescription>
        </DialogHeader>

        {currentStep === 1 && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Firmenname *</Label>
              <Input
                id="company_name"
                placeholder="z.B. Elektro Müller GmbH"
                value={subcontractorData.company_name}
                onChange={(e) => setSubcontractorData(prev => ({ ...prev, company_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Ansprechpartner</Label>
              <Input
                id="contact_name"
                placeholder="z.B. Max Müller"
                value={subcontractorData.contact_name}
                onChange={(e) => setSubcontractorData(prev => ({ ...prev, contact_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-Mail *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="max@firma.de"
                  value={subcontractorData.contact_email}
                  onChange={(e) => setSubcontractorData(prev => ({ ...prev, contact_email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  placeholder="+49 30 12345678"
                  value={subcontractorData.phone}
                  onChange={(e) => setSubcontractorData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country_code">Land</Label>
              <Select
                value={subcontractorData.country_code}
                onValueChange={(value) => setSubcontractorData(prev => ({ ...prev, country_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DE">Deutschland</SelectItem>
                  <SelectItem value="AT">Österreich</SelectItem>
                  <SelectItem value="CH">Schweiz</SelectItem>
                  <SelectItem value="PL">Polen</SelectItem>
                  <SelectItem value="CZ">Tschechien</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                placeholder="Straße, PLZ Ort"
                value={subcontractorData.address}
                onChange={(e) => setSubcontractorData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                placeholder="Zusätzliche Informationen..."
                value={subcontractorData.notes}
                onChange={(e) => setSubcontractorData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Package Selection */}
            <div>
              <Label className="text-base font-medium">Paket auswählen</Label>
              <div className="grid gap-2 mt-3">
                {staticPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`text-sm p-2 gap-2 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPackageId === pkg.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPackageId(pkg.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">{pkg.name}</h4>
                        <p className="text-xs text-muted-foreground">{pkg.description}</p>
                      </div>
                      {selectedPackageId === pkg.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Requirements Matrix */}
            <div className="mt-4 border rounded-xl">
              <div className="grid grid-cols-2 px-3 py-2 text-xs uppercase text-muted-foreground">
                <div>Dokument</div><div>Anforderung</div>
              </div>
              {DOCUMENT_TYPES.map(dt => (
                <div key={dt.id} className="grid grid-cols-2 items-center px-3 py-2 border-t">
                  <div className="text-sm">{dt.label}</div>
                  <div className="justify-self-end">
                    <RequirementSelector
                      compact
                      value={requirements[dt.id]}
                      onChange={(v) => setRequirements(s => ({ ...s, [dt.id]: v }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Send Invitation Option */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send_invitation"
                  checked={sendInvitationFlag}
                  onCheckedChange={(checked) => setSendInvitationFlag(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="send_invitation" className="font-medium cursor-pointer">
                    Direkt Einladung senden
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Sendet automatisch eine E-Mail mit Upload-Link
                  </p>
                </div>
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              {sendInvitationFlag && (
                <div className="space-y-2">
                  <Label htmlFor="invitation_message" className="text-sm font-medium">
                    Einladungstext
                  </Label>
                  <Textarea
                    id="invitation_message"
                    className="w-full text-sm border rounded-lg p-2"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Einladungstext eingeben..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {currentStep === 2 && (
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
            </div>
            <div>
              {currentStep === 1 && !editingSubcontractor ? (
                <Button 
                  onClick={handleNextStep}
                  disabled={!isStep1Valid}
                >
                  Weiter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting || (currentStep === 2 && !isStep2Valid)}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      {editingSubcontractor ? 'Aktualisiert...' : 'Erstellt...'}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {editingSubcontractor ? 'Aktualisieren' : 'Erstellen & Einladen'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}