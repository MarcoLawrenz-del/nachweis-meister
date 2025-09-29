import React, { useState } from 'react';
import { Building2, UserPlus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { NewSubcontractorWizard } from '@/components/NewSubcontractorWizard';
import { StatusBadge } from '@/components/StatusBadge';
import { ComplianceStatusBadge } from '@/components/ComplianceStatusBadge';
import { InviteMagicLinkButton } from '@/components/InviteMagicLinkButton';
import { useSupabaseUnified } from '@/hooks/useSupabaseUnified';
import type { Contractor } from '@/types/contractor';
import { debug } from '@/lib/debug';

interface SubcontractorCardProps {
  contractor: Contractor;
}

function SubcontractorCard({ contractor }: SubcontractorCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => navigate(`/app/subcontractors/${contractor.id}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{contractor.companyName}</CardTitle>
              {contractor.contactName && (
                <p className="text-sm text-muted-foreground mt-1">{contractor.contactName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={contractor.active ? 'active' : 'inactive'} />
            <ComplianceStatusBadge complianceStatus="compliant" subcontractorStatus={contractor.active ? 'active' : 'inactive'} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{contractor.contactEmail}</span>
          </div>
          {contractor.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{contractor.phone}</span>
            </div>
          )}
          {contractor.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{contractor.address}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              Erstellt: {new Date(contractor.createdAt).toLocaleDateString('de-DE')}
            </Badge>
          </div>
          <InviteMagicLinkButton contractor={contractor} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Subcontractors() {
  const navigate = useNavigate();
  const { subcontractors, loading, error, isDemo } = useSupabaseUnified();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showNewWizard, setShowNewWizard] = useState(false);

  // Filter subcontractors based on search term and status
  const filteredSubcontractors = subcontractors.filter(contractor => {
    const matchesSearch = contractor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && contractor.active) ||
                         (statusFilter === 'inactive' && !contractor.active);
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubcontractor = async (contractorData: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>) => {
    // This will be handled by the NewSubcontractorWizard itself
    setShowNewWizard(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Laden...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-destructive">Fehler beim Laden: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nachunternehmer</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Nachunternehmer und deren Compliance-Status
            {isDemo && <span className="ml-2 text-orange-600">(Demo-Modus)</span>}
          </p>
        </div>
        <Button onClick={() => setShowNewWizard(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Neuer Nachunternehmer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Suchen nach Firma oder E-Mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button 
            variant={statusFilter === 'all' ? 'secondary' : 'outline'} 
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Alle ({subcontractors.length})
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'secondary' : 'outline'} 
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Aktiv ({subcontractors.filter(c => c.active).length})
          </Button>
          <Button 
            variant={statusFilter === 'inactive' ? 'secondary' : 'outline'} 
            size="sm"
            onClick={() => setStatusFilter('inactive')}
          >
            Inaktiv ({subcontractors.filter(c => !c.active).length})
          </Button>
        </div>
      </div>

      {/* Subcontractor Grid */}
      {filteredSubcontractors.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Nachunternehmer gefunden</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Keine Nachunternehmer entsprechen den aktuellen Filterkriterien.'
              : 'Erstellen Sie Ihren ersten Nachunternehmer, um zu beginnen.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setShowNewWizard(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Ersten Nachunternehmer erstellen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubcontractors.map((contractor) => (
            <SubcontractorCard key={contractor.id} contractor={contractor} />
          ))}
        </div>
      )}

      {/* New Subcontractor Wizard */}
      {showNewWizard && (
        <NewSubcontractorWizard 
          isOpen={showNewWizard}
          onClose={() => setShowNewWizard(false)}
          onSuccess={() => setShowNewWizard(false)}
        />
      )}
    </div>
  );
}