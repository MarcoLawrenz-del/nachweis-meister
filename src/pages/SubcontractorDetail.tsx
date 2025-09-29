import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { getContractor } from '@/services/contractors.store';
import { getDocs } from '@/services/contractorDocs.store';
import { useSubcontractorProfile } from '@/hooks/useSubcontractorProfile';
import { DocumentReviewDrawer } from '@/components/DocumentReviewDrawer';
import { OverviewTab } from '@/components/SubcontractorProfile/OverviewTab';
import { DocumentsTab } from '@/components/SubcontractorProfile/DocumentsTab';
import { ActivityTab } from '@/components/SubcontractorProfile/ActivityTab';
import { ReviewsTab } from '@/components/SubcontractorProfile/ReviewsTab';
import { SettingsTab } from '@/components/SubcontractorProfile/SettingsTab';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/ROUTES';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';


export default function SubcontractorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Use Supabase-based profile hook
  const { profile, requirements, kpis, emailLogs, reviewHistory, isLoading, updateProfile, sendReminder, refetchData } = useSubcontractorProfile(id || '');

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">
          <p>Lade Nachunternehmer-Daten...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
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
            <h1 className="text-2xl font-bold">{profile.company_name}</h1>
            <p className="text-muted-foreground">
              Erstellt am {format(parseISO(profile.created_at), 'dd.MM.yyyy', { locale: de })}
            </p>
          </div>
        </div>
        <StatusBadge status={profile.active ? 'active' : 'inactive'} />
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
            profile={profile}
            projectId="demo-project"
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab 
            requirements={requirements}
            emailLogs={emailLogs}
            projectId="demo-project"
            profile={profile}
            contractorId={id}
            onAction={() => {}}
            onReview={async () => true}
            onSendReminder={sendReminder}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab emailLogs={emailLogs} />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsTab reviewHistory={reviewHistory} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab profile={profile} onUpdateProfile={updateProfile} />
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