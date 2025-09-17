import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, ArrowRight, Send, CheckCircle2, AlertCircle, Package, Mail } from 'lucide-react';
import { usePackages, type DocumentSelection } from '@/hooks/usePackages';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useToast } from '@/hooks/use-toast';
import { routes } from '@/lib/routes';

interface NewSubcontractorData {
  company_name: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  address: string;
  country_code: string;
  company_type: 'gbr' | 'baubetrieb' | 'einzelunternehmen';
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
  const { packages, loading: packagesLoading, error, loadPackageItems, getDefaultPackage, createDocumentSelection } = usePackages();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [sendInvitation, setSendInvitation] = useState(true);
  
  // Step 1: Basic data
  const [subcontractorData, setSubcontractorData] = useState<NewSubcontractorData>({
    company_name: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    address: '',
    country_code: 'DE',
    company_type: 'baubetrieb',
    notes: ''
  });

  // Step 2: Package selection
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [documentSelections, setDocumentSelections] = useState<DocumentSelection[]>([]);

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
        company_type: editingSubcontractor.company_type,
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
        company_type: 'baubetrieb',
        notes: ''
      });
      setCurrentStep(1);
    }
  }, [editingSubcontractor, isOpen]);

  // Initialize default package
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageId && !editingSubcontractor) {
      const defaultPackage = getDefaultPackage();
      if (defaultPackage) {
        setSelectedPackageId(defaultPackage.id);
        handlePackageSelection(defaultPackage.id);
      }
    }
  }, [packages, selectedPackageId, editingSubcontractor]);

  const handlePackageSelection = async (packageId: string) => {
    setSelectedPackageId(packageId);
    const items = await loadPackageItems(packageId);
    const selections = createDocumentSelection(items);
    setDocumentSelections(selections);
  };

  const toggleDocumentSelection = (documentTypeId: string) => {
    setDocumentSelections(prev =>
      prev.map(selection =>
        selection.document_type_id === documentTypeId
          ? { ...selection, is_selected: !selection.is_selected }
          : selection
      )
    );
  };

  const toggleDocumentRequired = (documentTypeId: string) => {
    setDocumentSelections(prev =>
      prev.map(selection =>
        selection.document_type_id === documentTypeId
          ? { ...selection, is_required: !selection.is_required }
          : selection
      )
    );
  };

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
        company_type: subcontractorData.company_type,
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

        // Get or create a demo project for requirements
        const { data: demoProject } = await supabase
          .from('projects')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .limit(1)
          .single();

        if (demoProject) {
          // Create project_sub entry
          const { data: projectSub, error: projectSubError } = await supabase
            .from('project_subs')
            .insert({
              project_id: demoProject.id,
              subcontractor_id: subcontractorId,
              status: 'active'
            })
            .select()
            .single();

          if (projectSubError) throw projectSubError;

          // Step 2: Create requirements based on document selection
          if (documentSelections.length > 0) {
            const selectedDocuments = documentSelections.filter(sel => sel.is_selected);
            
            if (selectedDocuments.length > 0) {
              const requirementInserts = selectedDocuments.map(doc => ({
                project_sub_id: projectSub.id,
                document_type_id: doc.document_type_id,
                status: 'missing' as const,
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              }));

              const { error: requirementsError } = await supabase
                .from('requirements')
                .upsert(requirementInserts, {
                  onConflict: 'project_sub_id,document_type_id',
                  ignoreDuplicates: false
                });

              if (requirementsError) throw requirementsError;

              // Step 3: Send invitation if requested
              if (sendInvitation) {
                const invitationToken = crypto.randomUUID();

                const { error: invitationError } = await supabase
                  .from('invitations')
                  .insert({
                    email: subcontractorData.contact_email,
                    token: invitationToken,
                    subject: `Dokumentenanforderung - ${demoProject.name}`,
                    message: `Bitte laden Sie die folgenden Dokumente für das Projekt "${demoProject.name}" hoch:\n\n${
                      selectedDocuments.map(doc => `• Dokument ${doc.document_type_id.slice(-4)} ${doc.is_required ? '(Pflicht)' : '(Optional)'}`).join('\n')
                    }\n\nLink zum Upload: ${window.location.origin}/upload/${invitationToken}`,
                    invited_by: profile.id,
                    project_sub_id: projectSub.id,
                    invitation_type: 'project'
                  });

                // Send invitation email
                const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
                  body: {
                    to: subcontractorData.contact_email,
                    subject: `Dokumentenanforderung - ${demoProject.name}`,
                    message: `Bitte laden Sie die folgenden Dokumente für das Projekt "${demoProject.name}" hoch:\n\n${
                      selectedDocuments.map(doc => `• Dokument ${doc.document_type_id.slice(-4)} ${doc.is_required ? '(Pflicht)' : '(Optional)'}`).join('\n')
                    }\n\nLink zum Upload: ${window.location.origin}/upload/${invitationToken}`,
                    subcontractorName: subcontractorData.company_name,
                    projectName: demoProject.name
                  }
                });

                if (emailError) {
                  console.error('Email sending failed:', emailError);
                }
              }
            }
          }

          toast({
            title: "Nachunternehmer erstellt",
            description: `${subcontractorData.company_name} wurde erfolgreich erstellt${sendInvitation ? ' und eingeladen' : ''}.`
          });

          onClose();
          if (onSuccess) onSuccess();

          // Navigate to subcontractor detail → documents tab
          navigate(routes.subDocuments(demoProject.id, subcontractorId));
        } else {
          // No demo project found, just complete the creation
          toast({
            title: "Nachunternehmer erstellt",
            description: `${subcontractorData.company_name} wurde erfolgreich erstellt.`
          });

          onClose();
          if (onSuccess) onSuccess();
        }
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

  const selectedDocuments = documentSelections.filter(sel => sel.is_selected);
  const requiredDocuments = selectedDocuments.filter(sel => sel.is_required);
  const optionalDocuments = selectedDocuments.filter(sel => !sel.is_required);

  const isStep1Valid = subcontractorData.company_name && subcontractorData.contact_email;

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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="company_type">Unternehmensform</Label>
                <Select
                  value={subcontractorData.company_type}
                  onValueChange={(value: 'gbr' | 'baubetrieb' | 'einzelunternehmen') => 
                    setSubcontractorData(prev => ({ ...prev, company_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unternehmensform wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gbr">GbR</SelectItem>
                    <SelectItem value="baubetrieb">Baubetrieb</SelectItem>
                    <SelectItem value="einzelunternehmen">Einzelunternehmen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            {packagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Package Selection */}
                <div>
                  <Label className="text-base font-medium">Paket auswählen</Label>
                  <div className="grid gap-3 mt-3">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedPackageId === pkg.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handlePackageSelection(pkg.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{pkg.name_de}</h3>
                            {pkg.description_de && (
                              <p className="text-sm text-muted-foreground">{pkg.description_de}</p>
                            )}
                          </div>
                          {selectedPackageId === pkg.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Customization */}
                {documentSelections.length > 0 && (
                  <div>
                    <Label className="text-base font-medium">Dokumente anpassen</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Sie können die Auswahl später jederzeit ändern.
                    </p>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {documentSelections.map((selection) => (
                        <div key={selection.document_type_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selection.is_selected}
                              onCheckedChange={() => toggleDocumentSelection(selection.document_type_id)}
                            />
                            <div>
                              <span className="font-medium">Dokument {selection.document_type_id.slice(-4)}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={selection.is_required ? "default" : "secondary"} className="text-xs">
                                  {selection.is_required ? 'Pflicht' : 'Optional'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {selection.is_selected && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleDocumentRequired(selection.document_type_id)}
                            >
                              {selection.is_required ? 'Optional' : 'Pflicht'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedDocuments.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Zusammenfassung</h4>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      {requiredDocuments.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Pflichtdokumente ({requiredDocuments.length})
                          </span>
                        </div>
                      )}
                      {optionalDocuments.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Optional ({optionalDocuments.length})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Send Invitation Option */}
                <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                  <Checkbox
                    id="send_invitation"
                    checked={sendInvitation}
                    onCheckedChange={(checked) => setSendInvitation(checked === true)}
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
              </>
            )}
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
                  disabled={submitting || (currentStep === 2 && selectedDocuments.length === 0)}
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