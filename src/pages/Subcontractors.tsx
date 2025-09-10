import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ComplianceStatusBadge, ComplianceIndicator } from '@/components/ComplianceStatusBadge';
import { SimpleStatusBadge } from '@/components/StatusBadge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useDemoData } from '@/hooks/useDemoData';
import { useToast } from '@/hooks/use-toast';
import { debug } from '@/lib/debug';
import { 
  Plus, 
  Search, 
  Building2, 
  Mail,
  Phone,
  MapPin,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Subcontractor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string;
  phone: string | null;
  address: string | null;
  country_code: string;
  company_type: 'gbr' | 'baubetrieb' | 'einzelunternehmen';
  notes: string | null;
  created_at: string;
  status: 'active' | 'inactive';
  compliance_status: 'compliant' | 'non_compliant' | 'expiring_soon';
  project_count: number;
  critical_issues: number;
}

export default function Subcontractors() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [filteredSubcontractors, setFilteredSubcontractors] = useState<Subcontractor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);
  const [newSubcontractor, setNewSubcontractor] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    address: '',
    country_code: 'DE',
    company_type: 'baubetrieb' as 'gbr' | 'baubetrieb' | 'einzelunternehmen',
    notes: ''
  });
  const { profile } = useAppAuth();
  const { toast } = useToast();
  const { isDemo, demoSubcontractors } = useDemoData();

  useEffect(() => {
    if (isDemo) {
      debug.log('🎯 Subcontractors: Using demo data');
      setSubcontractors(demoSubcontractors);
      setLoading(false);
      return;
    }
    
    if (profile) {
      fetchSubcontractors();
    }
  }, [profile, isDemo]);

  useEffect(() => {
    const filtered = subcontractors.filter(sub =>
      sub.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.contact_name && sub.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sub.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubcontractors(filtered);
  }, [subcontractors, searchTerm]);

  const fetchSubcontractors = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      if (!profile.tenant_id) {
        setSubcontractors([]);
        setLoading(false);
        return;
      }
      
      const { data: subcontractorsData, error } = await supabase
        .from('subcontractors')
        .select(`
          id,
          company_name,
          contact_name,
          contact_email,
          phone,
          address,
          country_code,
          company_type,
          notes,
          created_at,
          status,
          compliance_status,
          project_subs (
            id,
            requirements (
              status
            )
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedSubcontractors = subcontractorsData?.map(sub => {
        const allRequirements = sub.project_subs.flatMap(ps => ps.requirements);
        const criticalIssues = allRequirements.filter(req => req.status === 'expired' || req.status === 'missing').length;

        return {
          id: sub.id,
          company_name: sub.company_name,
          contact_name: sub.contact_name,
          contact_email: sub.contact_email,
          phone: sub.phone,
          address: sub.address,  
          country_code: sub.country_code,
          company_type: sub.company_type as 'gbr' | 'baubetrieb' | 'einzelunternehmen',
          notes: sub.notes,
          created_at: sub.created_at,
          status: sub.status as 'active' | 'inactive',
          compliance_status: sub.compliance_status as 'compliant' | 'non_compliant' | 'expiring_soon',
          project_count: sub.project_subs.length,
          critical_issues: criticalIssues
        };
      }) || [];

      setSubcontractors(processedSubcontractors);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
      toast({
        title: "Fehler",
        description: "Nachunternehmer konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const subData = {
        tenant_id: profile.tenant_id || null,
        company_name: newSubcontractor.company_name,
        contact_name: newSubcontractor.contact_name || null,
        contact_email: newSubcontractor.contact_email,
        phone: newSubcontractor.phone || null,
        address: newSubcontractor.address || null,
        country_code: newSubcontractor.country_code,
        company_type: newSubcontractor.company_type,
        notes: newSubcontractor.notes || null
      };

      if (editingSubcontractor) {
        const { error } = await supabase
          .from('subcontractors')
          .update(subData)
          .eq('id', editingSubcontractor.id);

        if (error) throw error;

        toast({
          title: "Nachunternehmer aktualisiert",
          description: `${newSubcontractor.company_name} wurde erfolgreich aktualisiert.`
        });
      } else {
        const { error } = await supabase
          .from('subcontractors')
          .insert(subData);

        if (error) throw error;

        toast({
          title: "Nachunternehmer erstellt",
          description: `${newSubcontractor.company_name} wurde erfolgreich erstellt.`
        });
      }

      resetForm();
      fetchSubcontractors();
    } catch (error: any) {
      console.error('Error saving subcontractor:', error);
      toast({
        title: "Fehler",
        description: error.message.includes('duplicate') 
          ? "Ein Nachunternehmer mit dieser E-Mail existiert bereits."
          : "Nachunternehmer konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor);
    setNewSubcontractor({
      company_name: subcontractor.company_name,
      contact_name: subcontractor.contact_name || '',
      contact_email: subcontractor.contact_email,
      phone: subcontractor.phone || '',
      address: subcontractor.address || '',
      country_code: subcontractor.country_code,
      company_type: subcontractor.company_type,
      notes: subcontractor.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (subcontractor: Subcontractor) => {
    if (!confirm(`Möchten Sie ${subcontractor.company_name} wirklich löschen?`)) return;

    try {
      const { error } = await supabase
        .from('subcontractors')
        .delete()
        .eq('id', subcontractor.id);

      if (error) throw error;

      toast({
        title: "Nachunternehmer gelöscht",
        description: `${subcontractor.company_name} wurde erfolgreich gelöscht.`
      });

      fetchSubcontractors();
    } catch (error: any) {
      console.error('Error deleting subcontractor:', error);
      toast({
        title: "Fehler",
        description: "Nachunternehmer konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewSubcontractor({
      company_name: '',
      contact_name: '',
      contact_email: '',
      phone: '',
      address: '',
      country_code: 'DE',
      company_type: 'baubetrieb',
      notes: ''
    });
    setEditingSubcontractor(null);
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beauftragte Firmen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Nachunternehmer und deren Compliance-Status
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} data-testid="btn-einladen">
              <Plus className="mr-2 h-4 w-4" />
              Neuer Nachunternehmer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingSubcontractor ? 'Nachunternehmer bearbeiten' : 'Neuer Nachunternehmer'}
                </DialogTitle>
                <DialogDescription>
                  Erfassen Sie die Kontaktdaten des Nachunternehmers.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Firmenname *</Label>
                  <Input
                    id="company_name"
                    placeholder="z.B. Elektro Müller GmbH"
                    value={newSubcontractor.company_name}
                    onChange={(e) => setNewSubcontractor(prev => ({ ...prev, company_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Ansprechpartner</Label>
                  <Input
                    id="contact_name"
                    placeholder="z.B. Max Müller"
                    value={newSubcontractor.contact_name}
                    onChange={(e) => setNewSubcontractor(prev => ({ ...prev, contact_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">E-Mail *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="max@firma.de"
                      value={newSubcontractor.contact_email}
                      onChange={(e) => setNewSubcontractor(prev => ({ ...prev, contact_email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      placeholder="+49 30 12345678"
                      value={newSubcontractor.phone}
                      onChange={(e) => setNewSubcontractor(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country_code">Land</Label>
                  <Select
                    value={newSubcontractor.country_code}
                    onValueChange={(value) => setNewSubcontractor(prev => ({ ...prev, country_code: value }))}
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
                     value={newSubcontractor.company_type}
                     onValueChange={(value: 'gbr' | 'baubetrieb' | 'einzelunternehmen') => 
                       setNewSubcontractor(prev => ({ ...prev, company_type: value }))}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Unternehmensform wählen" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="gbr">Gesellschaft bürgerlichen Rechts (GbR)</SelectItem>
                       <SelectItem value="baubetrieb">Baubetrieb / Dienstleister</SelectItem>
                       <SelectItem value="einzelunternehmen">Einzelunternehmen (Solo)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    placeholder="Straße, PLZ Ort"
                    value={newSubcontractor.address}
                    onChange={(e) => setNewSubcontractor(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    placeholder="Zusätzliche Informationen..."
                    value={newSubcontractor.notes}
                    onChange={(e) => setNewSubcontractor(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  {editingSubcontractor ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subcontractors Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Nachunternehmer-Übersicht ({subcontractors.length})
              </CardTitle>
              <CardDescription>
                Alle Nachunternehmer mit Compliance-Status
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Nachunternehmer durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubcontractors.length === 0 ? (
            <div className="text-center py-16">
              {subcontractors.length === 0 ? (
                <div className="space-y-4">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Noch keine Nachunternehmer</h3>
                    <p className="text-muted-foreground">
                      Fügen Sie Ihren ersten Nachunternehmer hinzu, um mit der Compliance-Überwachung zu starten.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Keine Ergebnisse</h3>
                    <p className="text-muted-foreground">
                      Keine Nachunternehmer gefunden für "{searchTerm}".
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Projekte</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubcontractors.map((subcontractor) => (
                    <TableRow key={subcontractor.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{subcontractor.company_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subcontractor.company_type === 'gbr' && 'GbR'}
                            {subcontractor.company_type === 'baubetrieb' && 'Baubetrieb'}
                            {subcontractor.company_type === 'einzelunternehmen' && 'Einzelunternehmen'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {subcontractor.contact_name && (
                            <div className="flex items-center text-sm">
                              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                              {subcontractor.contact_name}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-2 h-4 w-4" />
                            {subcontractor.contact_email}
                          </div>
                          {subcontractor.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-2 h-4 w-4" />
                              {subcontractor.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <SimpleStatusBadge status={subcontractor.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {subcontractor.project_count} Projekt{subcontractor.project_count !== 1 ? 'e' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ComplianceIndicator complianceStatus={subcontractor.compliance_status} />
                          {subcontractor.critical_issues > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {subcontractor.critical_issues}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/app/subcontractors/${subcontractor.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(subcontractor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!isDemo && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(subcontractor)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}