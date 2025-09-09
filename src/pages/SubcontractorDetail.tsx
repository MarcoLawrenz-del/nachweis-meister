import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubcontractorProfile } from '@/hooks/useSubcontractorProfile';
import { 
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  Eye,
  Send,
  Settings,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Tab components
import { OverviewTab } from '@/components/SubcontractorProfile/OverviewTab';
import { DocumentsTab } from '@/components/SubcontractorProfile/DocumentsTab';
import { ReviewsTab } from '@/components/SubcontractorProfile/ReviewsTab';
import { RemindersTab } from '@/components/SubcontractorProfile/RemindersTab';
import { ActivityTab } from '@/components/SubcontractorProfile/ActivityTab';
import { SettingsTab } from '@/components/SubcontractorProfile/SettingsTab';

export default function SubcontractorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!id) {
    navigate('/app/subcontractors');
    return null;
  }

  const {
    profile,
    requirements,
    kpis,
    emailLogs,
    reviewHistory,
    isLoading,
    updateProfile,
    reviewRequirement,
    sendReminder,
    refetchData
  } = useSubcontractorProfile(id);

  // Handle loading state
  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          <div className="space-y-1 flex-1">
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/app/subcontractors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-professional">{profile.company_name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">
                Seit {format(new Date(profile.created_at), 'dd.MM.yyyy', { locale: de })}
              </span>
            </div>
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              <span className="text-sm capitalize">{profile.company_type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Prüfungen
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Erinnerungen
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Aktivität
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Einstellungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab 
            kpis={kpis}
            requirements={requirements}
            onActionClick={(action, requirementId) => {
              if (action === 'request_upload' && requirementId) {
                sendReminder([requirementId]);
              } else if (action === 'review' && requirementId) {
                // Switch to reviews tab
                const tabTrigger = document.querySelector('[value="reviews"]') as HTMLButtonElement;
                tabTrigger?.click();
              } else if (action === 'renew' && requirementId) {
                sendReminder([requirementId]);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab 
            requirements={requirements}
            onAction={(action, requirementId) => {
              if (action === 'request_upload' || action === 'request_correction' || action === 'request_renewal') {
                sendReminder([requirementId]);
              } else if (action === 'review') {
                // Switch to reviews tab and select requirement
                const tabTrigger = document.querySelector('[value="reviews"]') as HTMLButtonElement;
                tabTrigger?.click();
              } else if (action === 'view_document') {
                // Find and open document
                const requirement = requirements.find(r => r.id === requirementId);
                if (requirement?.documents?.[0]?.file_url) {
                  window.open(requirement.documents[0].file_url, '_blank');
                }
              }
            }}
          />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsTab 
            requirements={requirements}
            onReview={reviewRequirement}
          />
        </TabsContent>

        <TabsContent value="reminders">
          <RemindersTab 
            emailLogs={emailLogs}
            onSendReminder={sendReminder}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab 
            reviewHistory={reviewHistory}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab 
            profile={profile}
            onUpdateProfile={updateProfile}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}