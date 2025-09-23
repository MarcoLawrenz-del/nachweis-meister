import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building, Mail, Phone, MapPin, Calendar, User, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getContractor } from '@/services/contractors.store';
import { getDocs } from '@/services/contractorDocs.store';
import { DocumentReviewDrawer } from '@/components/DocumentReviewDrawer';
import { OverviewTab } from '@/components/SubcontractorProfile/OverviewTab';
import { DocumentsTab } from '@/components/SubcontractorProfile/DocumentsTab';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/ROUTES';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

// Simple tab components for now
function SimpleActivityTab() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">
          <p>Aktivitätsverlauf wird geladen...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleReviewsTab() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">
          <p>Prüfungsbereich wird geladen...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleSettingsTab({ contractor }: { contractor: any }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Einstellungen</h3>
            <p className="text-muted-foreground">Erweiterte Einstellungen werden geladen...</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Status:</strong> {contractor.active ? 'Aktiv' : 'Inaktiv'}
            </div>
            <div>
              <strong>Erstellt:</strong> {format(parseISO(contractor.created_at), 'dd.MM.yyyy', { locale: de })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubcontractorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const docParam = searchParams.get('doc');
    const openParam = searchParams.get('open');
    
    if (docParam && openParam === 'review') {
      const docs = getDocs(id || '');
      const targetDoc = docs.find(d => d.documentTypeId === docParam);
      if (targetDoc) {
        setSelectedDoc(docParam);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, id]);

  if (!id) {
    return <Navigate to="/app/subcontractors" replace />;
  }

  const contractor = getContractor(id);
  if (!contractor) {
    return <Navigate to="/app/subcontractors" replace />;
  }

  const docs = getDocs(id);
  const selectedDocument = selectedDoc ? docs.find(d => d.documentTypeId === selectedDoc) : null;

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDoc(null);
    // Remove URL params
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('doc');
    newSearchParams.delete('open');
    navigate(`/app/subcontractors/${id}?${newSearchParams.toString()}`, { replace: true });
  };

  const handleStatusChange = () => {
    // Refresh data after status changes
    // In a real app, this would trigger a data refetch
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/subcontractors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contractor.company_name}</h1>
            <p className="text-muted-foreground">
              Erstellt am {format(parseISO(contractor.created_at), 'dd.MM.yyyy', { locale: de })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={contractor.active ? 'active' : 'inactive'} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                E-Mail senden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Unternehmen</span>
            </div>
            <p className="mt-1 font-medium">{contractor.company_name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Kontakt</span>
            </div>
            <p className="mt-1 font-medium">{contractor.contact_name || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">E-Mail</span>
            </div>
            <p className="mt-1 font-medium text-foreground">{contractor.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Telefon</span>
            </div>
            <p className="mt-1 font-medium text-foreground">{contractor.phone || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="activity">Aktivität</TabsTrigger>
          <TabsTrigger value="reviews">Prüfungen</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab 
            profile={contractor}
            projectId="demo-project"
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab 
            requirements={[]}
            emailLogs={[]}
            projectId="demo-project"
            profile={contractor}
            contractorId={id}
            onAction={() => {}}
            onReview={async () => true}
            onSendReminder={async () => true}
          />
        </TabsContent>

        <TabsContent value="activity">
          <SimpleActivityTab />
        </TabsContent>

        <TabsContent value="reviews">
          <SimpleReviewsTab />
        </TabsContent>

        <TabsContent value="settings">
          <SimpleSettingsTab contractor={contractor} />
        </TabsContent>
      </Tabs>

      {/* Document Review Drawer */}
      <DocumentReviewDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        document={selectedDocument}
        contractorId={id}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}