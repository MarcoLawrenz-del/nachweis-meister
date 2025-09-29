import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseUnified } from '@/hooks/useSupabaseUnified';
import type { Contractor } from '@/types/contractor';
import { debug } from '@/lib/debug';

interface NewSubcontractorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewSubcontractorWizard({ isOpen, onClose, onSuccess }: NewSubcontractorWizardProps) {
  const { createContractor, isDemo, logActivity } = useSupabaseUnified();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    address: '',
    country: 'DE',
    notes: '',
    active: true
  });
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      debug.log('Creating subcontractor with data:', formData);
      
      if (isDemo) {
        debug.warn('Demo mode: Subcontractor creation simulated');
        await logActivity({
          type: 'demo_contractor_created',
          message: `Demo: Would create subcontractor ${formData.companyName}`
        });
        onSuccess();
        onClose();
        return;
      }

      await createContractor(formData);
      onSuccess();
      onClose();
    } catch (error) {
      debug.error('Error creating subcontractor:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Neuer Nachunternehmer</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Erfassen Sie die Stammdaten des Nachunternehmers
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Firmeninformationen
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname *</Label>
                  <Input
                    id="companyName"
                    placeholder="z.B. Muster Bau GmbH"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input
                    id="country"
                    placeholder="z.B. DE"
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  placeholder="z.B. Musterstraße 123, 12345 Musterstadt"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Kontaktdaten
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Ansprechpartner</Label>
                  <Input
                    id="contactName"
                    placeholder="z.B. Max Mustermann"
                    value={formData.contactName}
                    onChange={(e) => updateFormData('contactName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    placeholder="z.B. +49 123 456789"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">E-Mail-Adresse *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="z.B. kontakt@muster-bau.de"
                  value={formData.contactEmail}
                  onChange={(e) => updateFormData('contactEmail', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Zusätzliche Informationen
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  placeholder="Zusätzliche Informationen zum Nachunternehmer..."
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => updateFormData('active', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="active" className="text-sm">
                  Nachunternehmer ist aktiv
                </Label>
                {formData.active && (
                  <Badge variant="outline" className="text-xs">
                    Kann sofort verwendet werden
                  </Badge>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={creating || !formData.companyName || !formData.contactEmail}
              >
                {creating ? 'Erstelle...' : 'Nachunternehmer erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}