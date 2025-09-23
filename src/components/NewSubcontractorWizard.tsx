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
import { ArrowLeft, ArrowRight, Send, CheckCircle2, Package, Mail, Plus, X } from 'lucide-react';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useToast } from '@/hooks/use-toast';
import { createContractor, updateContractor } from '@/services/contractors.store';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import { COMPLIANCE_PACKAGES, type ConditionalFlags } from '@/config/packages';
import { sendEmail } from '@/services/email';
import { isErr } from '@/utils/result';
import { displayName, isCustomDoc, makeCustomDocId, validateCustomDocName } from '@/utils/customDocs';
import { ROUTES } from '@/lib/ROUTES';
import RequirementSelector from "@/components/RequirementSelector";
import { ConditionalQuestionsForm } from './ConditionalQuestionsForm';
import { 
  ConditionalAnswers, 
  DEFAULT_CONDITIONAL_ANSWERS 
} from '@/config/conditionalQuestions';
import { 
  deriveRequirements, 
  OrgFlags 
} from '@/services/requirements/deriveRequirements';
import { createDocumentsForContractor } from '@/services/wizardDocuments';

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
  const [selectedPackageId, setSelectedPackageId] = useState<string>('handwerk_basis');
  const [requirements, setRequirements] = useState<Record<string,"required"|"optional"|"hidden">>({});
  const [message, setMessage] = useState(
    "Hallo {{name}}, bitte laden Sie die angeforderten Dokumente unter {{magic_link}} hoch. Vielen Dank."
  );
  
  // New Conditional Questions System
  const [conditionalAnswers, setConditionalAnswers] = useState<ConditionalAnswers>(DEFAULT_CONDITIONAL_ANSWERS);
  const [orgFlags, setOrgFlags] = useState<OrgFlags>({ hrRegistered: false });
  
  // Legacy conditional flags (für Kompatibilität behalten)
  const [conditionalFlags, setConditionalFlags] = useState<ConditionalFlags>({
    hasEmployees: false,
    providesConstructionServices: false,
    isSokaPflicht: false,
    providesAbroad: false,
    processesPersonalData: false
  });
  
  // Custom documents
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDocName, setCustomDocName] = useState("");
  const [customDocRequirement, setCustomDocRequirement] = useState<"required"|"optional"|"hidden">("required");
  const [customNameError, setCustomNameError] = useState<string | null>(null);
  const [customDocLabels, setCustomDocLabels] = useState<Record<string, string>>({});
  
  const validateCustomName = (name: string) => {
    const existingDocs = Object.keys(requirements)
      .filter(isCustomDoc)
      .map(docId => ({ 
        documentTypeId: docId, 
        customName: docId.replace('custom:', '') 
      }));
    
    const error = validateCustomDocName(name, existingDocs);
    setCustomNameError(error);
    return error === null;
  };
  
  const addCustomDocument = () => {
    if (!validateCustomName(customDocName)) return;
    
    const docId = makeCustomDocId(customDocName);
    setRequirements(prev => ({ ...prev, [docId]: customDocRequirement }));
    setCustomDocLabels(prev => ({ ...prev, [docId]: customDocName }));
    
    // Reset form
    setCustomDocName("");
    setCustomDocRequirement("required");
    setShowCustomForm(false);
    setCustomNameError(null);
  };
  
  const removeCustomDocument = (docId: string) => {
    const { [docId]: removed, ...rest } = requirements;
    setRequirements(rest);
    const { [docId]: removedLabel, ...restLabels } = customDocLabels;
    setCustomDocLabels(restLabels);
  };

  // Use compliance packages from config
  const staticPackages = COMPLIANCE_PACKAGES;

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
      setCurrentStep(1);
    } else {
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

  // Sync requirements with conditional answers (new system)
  useEffect(() => {
    const derivedRequirements = deriveRequirements(conditionalAnswers, orgFlags);
    const filled = Object.fromEntries(
      DOCUMENT_TYPES.map(d => [
        d.id, 
        derivedRequirements[d.id.toLowerCase()] || d.defaultRequirement
      ])
    );
    setRequirements(filled);
  }, [conditionalAnswers, orgFlags]);

  // Sync legacy flags with new conditional answers (for backward compatibility)
  useEffect(() => {
    setConditionalFlags({
      hasEmployees: conditionalAnswers.hasEmployees === 'yes',
      providesConstructionServices: conditionalAnswers.doesConstructionWork === 'yes',
      isSokaPflicht: conditionalAnswers.sokaBauSubject === 'yes',
      providesAbroad: conditionalAnswers.sendsAbroad === 'yes',
      processesPersonalData: conditionalAnswers.processesPersonalData === 'yes'
    });
  }, [conditionalAnswers]);

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
    if (!profile) {
      console.warn('No profile found, but allowing creation anyway');
    }

    try {
      setSubmitting(true);

      const subData = {
        company_name: subcontractorData.company_name,
        contact_name: subcontractorData.contact_name || undefined,
        email: subcontractorData.contact_email,
        phone: subcontractorData.phone || undefined,
        address: subcontractorData.address || undefined,
        country: subcontractorData.country_code || undefined,
        notes: subcontractorData.notes || undefined,
        // New conditional system
        conditionalAnswers: conditionalAnswers,
        orgFlags: orgFlags,
        // Legacy flags (for backward compatibility)
        hasEmployees: conditionalFlags.hasEmployees,
        providesConstructionServices: conditionalFlags.providesConstructionServices,
        isSokaPflicht: conditionalFlags.isSokaPflicht,
        providesAbroad: conditionalFlags.providesAbroad,
        processesPersonalData: conditionalFlags.processesPersonalData,
        selectedPackageId: selectedPackageId
      };

      if (editingSubcontractor) {
        try {
          const contractor = await updateContractor(editingSubcontractor.id, subData);
          
          toast({
            title: "Änderungen gespeichert",
            description: `${subcontractorData.company_name} wurde erfolgreich aktualisiert.`
          });

          navigate(ROUTES.contractor(contractor.id));
          onClose();
          if (onSuccess) onSuccess();
        } catch (error: any) {
          console.error('Error updating subcontractor:', error);
          toast({
            title: "Fehler",
            description: "Nachunternehmer konnte nicht aktualisiert werden.",
            variant: "destructive"
          });
        }
      } else {
        let contractorId: string;
        try {
          const contractor = createContractor(subData);
          contractorId = contractor.id;
          
          toast({
            title: "Nachunternehmer erstellt",
            description: `${subcontractorData.company_name} wurde erfolgreich erstellt.`
          });
        } catch (error: any) {
          console.error('Error creating subcontractor:', error);
          toast({
            title: "Fehler",
            description: error.message.includes('duplicate') 
              ? "Ein Nachunternehmer mit dieser E-Mail existiert bereits."
              : "Nachunternehmer konnte nicht gespeichert werden.",
            variant: "destructive"
          });
          return;
        }

        try {
          // Create documents directly in the store with "lastRequestedAt"
          createDocumentsForContractor(contractorId, requirements);
          
          if (subcontractorData.contact_email && sendInvitationFlag) {
            // Get required documents for email
            const requiredDocs = Object.entries(requirements)
              .filter(([_, req]) => req === 'required')
              .map(([docId, _]) => {
                const docType = DOCUMENT_TYPES.find(dt => dt.id === docId);
                const customLabel = customDocLabels[docId];
                return docType?.label || customLabel || docId;
              });

            const result = await sendEmail("invitation", {
              contractorId,
              to: subcontractorData.contact_email,
              contractorName: subcontractorData.company_name,
              customerName: "Ihr Auftraggeber",
              requiredDocs
            });
            
            if (isErr(result)) {
              toast({
                title: "Einladung fehlgeschlagen",
                description: result.error === "inactive" 
                  ? "Nachunternehmer ist inaktiv – Versand übersprungen"
                  : result.error === "rate_limited"
                  ? "Zu häufig – bitte später erneut versuchen"
                  : result.error,
                variant: "destructive"
              });
            } else {
              toast({ 
                title: result.mode === "stub" ? "Im Demo-Modus gesendet (Stub)" : "Einladung gesendet", 
                description: subcontractorData.contact_email 
              });
            }
          }
        } catch (error: any) {
          console.warn('Non-critical error in document seeding or email sending:', error);
          toast({
            title: "Warnung",
            description: "Dokumente/Einladung können später gesendet werden.",
            variant: "default"
          });
        }

        navigate(ROUTES.contractor(contractorId));
        onClose();
        if (onSuccess) onSuccess();
      }

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

            {/* Conditional Questions (New System) */}
            <div className="space-y-4">
              <ConditionalQuestionsForm
                answers={conditionalAnswers}
                onChange={setConditionalAnswers}
                title="Dokumentenanforderungen bestimmen"
                description="Beantworten Sie diese Fragen, um zu ermitteln, welche Dokumente benötigt werden."
              />
            </div>

            {/* Organization Flags */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-base font-medium">Organisationsdaten</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hrRegistered"
                  checked={orgFlags.hrRegistered || false}
                  onCheckedChange={(checked) => setOrgFlags({ ...orgFlags, hrRegistered: checked === true })}
                />
                <Label htmlFor="hrRegistered" className="text-sm">
                  Unternehmen ist im Handelsregister eingetragen
                </Label>
              </div>
            </div>

            {/* Legacy Conditional Questions (for backward compatibility, hidden by default) */}
            <details className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <summary className="text-base font-medium cursor-pointer">Legacy Konditionale Anforderungen</summary>
              <p className="text-sm text-muted-foreground">
                Diese Fragen sind für Rückwärtskompatibilität. Nutzen Sie die neuen Fragen oben.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasEmployees"
                    checked={conditionalFlags.hasEmployees}
                    onCheckedChange={(checked) => 
                      setConditionalFlags(prev => ({ ...prev, hasEmployees: !!checked }))
                    }
                  />
                  <Label htmlFor="hasEmployees" className="text-sm font-normal">
                    Hat der Nachunternehmer Mitarbeitende?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="providesConstructionServices"
                    checked={conditionalFlags.providesConstructionServices}
                    onCheckedChange={(checked) => 
                      setConditionalFlags(prev => ({ ...prev, providesConstructionServices: !!checked }))
                    }
                  />
                  <Label htmlFor="providesConstructionServices" className="text-sm font-normal">
                    Erbringt der Nachunternehmer Bauleistungen?
                  </Label>
                </div>

                {conditionalFlags.providesConstructionServices && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="isSokaPflicht"
                      checked={conditionalFlags.isSokaPflicht}
                      onCheckedChange={(checked) => 
                        setConditionalFlags(prev => ({ ...prev, isSokaPflicht: !!checked }))
                      }
                    />
                    <Label htmlFor="isSokaPflicht" className="text-sm font-normal">
                      Ist der Betrieb SOKA-BAU-pflichtig?
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="providesAbroad"
                    checked={conditionalFlags.providesAbroad}
                    onCheckedChange={(checked) => 
                      setConditionalFlags(prev => ({ ...prev, providesAbroad: !!checked }))
                    }
                  />
                  <Label htmlFor="providesAbroad" className="text-sm font-normal">
                    Entsendung ins EU/EWR/CH-Ausland vorgesehen?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="processesPersonalData"
                    checked={conditionalFlags.processesPersonalData}
                    onCheckedChange={(checked) => 
                      setConditionalFlags(prev => ({ ...prev, processesPersonalData: !!checked }))
                    }
                  />
                  <Label htmlFor="processesPersonalData" className="text-sm font-normal">
                    Verarbeitet der Nachunternehmer personenbezogene Daten im Auftrag?
                  </Label>
                </div>
              </div>
            </details>

            {/* Document Requirements Matrix */}
            <div className="mt-4 border rounded-xl">
              <div className="grid grid-cols-2 px-3 py-2 text-xs uppercase text-muted-foreground">
                <div>Dokument</div><div>Anforderung</div>
              </div>
              
              <Separator />
              {DOCUMENT_TYPES.map(docType => {
                const req = requirements[docType.id] || docType.defaultRequirement;
                if (req === "hidden") return null;
                
                return (
                  <div key={docType.id} className="grid grid-cols-2 px-3 py-2 items-center text-sm hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span>{docType.label}</span>
                    </div>
                    <div>
                      <RequirementSelector 
                        compact 
                        value={req} 
                        onChange={(v) => setRequirements(prev => ({ ...prev, [docType.id]: v }))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {currentStep === 2 && (
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              
              {currentStep === 1 && !editingSubcontractor ? (
                <Button onClick={handleNextStep} disabled={!isStep1Valid}>
                  Weiter <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting || !isStep1Valid}>
                  {submitting ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : editingSubcontractor ? (
                    'Speichern'
                  ) : (
                    'Erstellen'
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