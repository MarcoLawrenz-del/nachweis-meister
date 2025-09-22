import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { NewSubcontractorWizard } from '@/components/NewSubcontractorWizard';
import { InviteMagicLinkButton } from '@/components/InviteMagicLinkButton';
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
  PenLine,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  Circle
} from 'lucide-react';
import { aggregateContractorStatusById, listContractors, deleteContractor } from "@/services/contractors";
import type { Contractor } from "@/services/contractors.store";

interface Subcontractor extends Contractor {
  contact_email: string; // alias for email
  country_code: string; // alias for country
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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);
  const { profile } = useAppAuth();
  const { toast } = useToast();
  const { isDemo, demoSubcontractors } = useDemoData();

  useEffect(() => {
    if (isDemo) {
      debug.log('🎯 Subcontractors: Using demo data');
      // Convert demo data to match new interface
      const convertedDemo = demoSubcontractors.map(sub => ({
        ...sub,
        email: sub.contact_email,
        active: sub.status === 'active',
        contact_email: sub.contact_email,
        country_code: sub.country_code
      })) as Subcontractor[];
      setSubcontractors(convertedDemo);
      setLoading(false);
      return;
    }
    
    fetchSubcontractors();
  }, [isDemo]);

  useEffect(() => {
    const filtered = subcontractors.filter(sub =>
      sub.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.contact_name && sub.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubcontractors(filtered);
  }, [subcontractors, searchTerm]);

  const fetchSubcontractors = async () => {
    try {
      setLoading(true);
      
      const contractors = listContractors();
      const processedSubcontractors = contractors.map(contractor => {
        const aggregation = aggregateContractorStatusById(contractor.id);
        
        return {
          ...contractor,
          contact_email: contractor.email,
          country_code: contractor.country || '',
          status: contractor.active ? 'active' as const : 'inactive' as const,
          compliance_status: aggregation.status === 'complete' ? 'compliant' as const : 
                           aggregation.status === 'attention' ? 'expiring_soon' as const : 'non_compliant' as const,
          project_count: 0,
          critical_issues: aggregation.status === 'missing' ? 1 : 0
        } as Subcontractor;
      });

      setSubcontractors(processedSubcontractors);
    } catch (error: any) {
      console.error('Error loading contractors:', error);
      toast({
        title: "Fehler beim Laden",
        description: "Nachunternehmer konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor);
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setEditingSubcontractor(null);
  };

  const handleWizardSuccess = () => {
    fetchSubcontractors();
  };

  const handleDelete = async (subcontractor: Subcontractor) => {
    if (!confirm(`Möchten Sie ${subcontractor.company_name} wirklich löschen?`)) return;

    try {
      deleteContractor(subcontractor.id);

      toast({
        title: "Nachunternehmer gelöscht",
        description: `${subcontractor.company_name} wurde erfolgreich gelöscht.`
      });

      fetchSubcontractors();
    } catch (error: any) {
      console.error('Error deleting contractor:', error);
      toast({
        title: "Fehler",
        description: "Nachunternehmer konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingSubcontractor(null);
    setIsWizardOpen(false);
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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nachunternehmer</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Nachunternehmer und deren Compliance-Status
            </p>
          </div>
          <Button onClick={() => setIsWizardOpen(true)} data-testid="btn-einladen">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Nachunternehmer
          </Button>
          
          <NewSubcontractorWizard
            isOpen={isWizardOpen}
            onClose={handleCloseWizard}
            onSuccess={handleWizardSuccess}
            editingSubcontractor={editingSubcontractor}
          />
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
                      <TableHead>Konto</TableHead>
                      <TableHead>Status</TableHead>
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
                              Seit {new Date(subcontractor.created_at).toLocaleDateString('de-DE')}
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
                          <div className="flex items-center gap-2">
                            <Circle 
                              className={`h-2 w-2 fill-current ${
                                subcontractor.status === 'active' 
                                  ? 'text-green-500' 
                                  : 'text-gray-400'
                              }`} 
                            />
                            <span className="text-sm">
                              {subcontractor.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const agg = aggregateContractorStatusById(subcontractor.id);
                            const chip = agg.status === "complete" ? {label: "Vollständig", class: "bg-green-100 text-green-800 border-green-200"} :
                                        agg.status === "attention" ? {label: "Aufmerksamkeit", class: "bg-amber-100 text-amber-800 border-amber-200"} :
                                                             {label: "Fehlt", class: "bg-red-100 text-red-800 border-red-200"};
                            return <Badge variant="outline" className={chip.class}>{chip.label}</Badge>;
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/app/subcontractors/${subcontractor.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ansehen</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <InviteMagicLinkButton 
                              contractor={{
                                id: subcontractor.id,
                                company_name: subcontractor.company_name,
                                email: subcontractor.contact_email,
                                created_at: subcontractor.created_at,
                                active: subcontractor.status === 'active'
                              }}
                              className="h-8 w-8 p-0"
                            />
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(subcontractor)}
                                >
                                  <PenLine className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bearbeiten</p>
                              </TooltipContent>
                            </Tooltip>
                            {!isDemo && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(subcontractor)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Löschen</p>
                                </TooltipContent>
                              </Tooltip>
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
    </TooltipProvider>
  );
}