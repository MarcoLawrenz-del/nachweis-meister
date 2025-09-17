import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  User, 
  Building, 
  Flag,
  Save,
  AlertTriangle,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import { SubcontractorProfileData } from '@/hooks/useSubcontractorProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SettingsTabProps {
  profile: SubcontractorProfileData;
  onUpdateProfile: (updates: Partial<SubcontractorProfileData>) => Promise<boolean>;
  projectId?: string;
}

export function SettingsTab({ profile, onUpdateProfile, projectId }: SettingsTabProps) {
  const [formData, setFormData] = useState({
    company_name: profile.company_name,
    contact_name: profile.contact_name || '',
    contact_email: profile.contact_email,
    phone: profile.phone || '',
    address: profile.address || '',
    country_code: profile.country_code,
    notes: profile.notes || '',
    status: profile.status
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateProfile(formData);
    setIsSaving(false);
  };

  const handleToggleStatus = async () => {
    const newStatus = profile.status === 'active' ? 'inactive' : 'active';
    const success = await onUpdateProfile({ status: newStatus });
    if (success) {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    company_name: profile.company_name,
    contact_name: profile.contact_name || '',
    contact_email: profile.contact_email,
    phone: profile.phone || '',
    address: profile.address || '',
    country_code: profile.country_code,
    
    notes: profile.notes || '',
    status: profile.status
  });

  return (
    <div className="space-y-6">
      {/* Status Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Nachunternehmer-Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  profile.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="font-medium">
                  {profile.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.status === 'active' 
                  ? 'Der Nachunternehmer ist aktiv. Warnungen und Erinnerungen werden versendet.'
                  : 'Warnungen und Erinnerungen sind pausiert.'
                }
              </p>
            </div>
            
            <Switch
              checked={profile.status === 'active'}
              onCheckedChange={handleToggleStatus}
              data-testid="toggle-aktiv"
            />
          </div>
          
          {profile.status !== 'active' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warnungen pausiert:</strong> Inaktive Nachunternehmer erhalten keine 
                automatischen Erinnerungen oder Compliance-Warnungen. Bei Reaktivierung 
                werden alle Pflichten und Warnungen wieder aktiviert.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Unternehmensdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Firmenname *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                required
              />
            </div>
            
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="country_code">Land</Label>
            <Select 
              value={formData.country_code} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
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
                <SelectItem value="HU">Ungarn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Kontaktdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">Ansprechpartner</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contact_email">E-Mail *</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="notes">Interne Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Interne Notizen zu diesem Nachunternehmer..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Alert className="flex-1">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Sie haben ungespeicherte Änderungen.
                </AlertDescription>
              </Alert>
              
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Speichere...' : 'Änderungen speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}