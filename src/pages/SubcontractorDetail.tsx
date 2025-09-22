import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, FileText, Eye, Send, Activity, Settings } from 'lucide-react';
import { useSubcontractorProfile } from '@/hooks/useSubcontractorProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateContractor } from '@/services/contractors.store';
import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Tab components
import { OverviewTab } from '@/components/SubcontractorProfile/OverviewTab';
import { DocumentsTab } from '@/components/SubcontractorProfile/DocumentsTab';

export default function SubcontractorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  
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

  const handleActiveToggle = async (newActiveStatus: boolean) => {
    if (!profile) return;
    
    setIsToggling(true);
    try {
      await updateContractor(profile.id, {
        active: newActiveStatus
      });
      
      // Update local profile state
      updateProfile({ active: newActiveStatus });
      
      toast({
        title: newActiveStatus ? "Subunternehmer aktiviert" : "Subunternehmer deaktiviert",
        description: newActiveStatus 
          ? "Der Subunternehmer kann wieder Erinnerungen erhalten." 
          : "Der Subunternehmer erhält keine Erinnerungen mehr.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Status konnte nicht geändert werden.",
        variant: "destructive"
      });
    } finally {
      setIsToggling(false);
    }
  };

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
          </div>
        </div>
        
        {/* Active/Inactive Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={profile.active ? "default" : "secondary"}>
                {profile.active ? "Aktiv" : "Inaktiv"}
              </Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Switch
                    checked={profile.active}
                    disabled={isToggling}
                    aria-label="Subunternehmer Status ändern"
                  />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Subunternehmer {profile.active ? "deaktivieren" : "aktivieren"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {profile.active 
                        ? "Wenn Sie den Subunternehmer deaktivieren, werden keine automatischen Erinnerungen mehr versendet."
                        : "Wenn Sie den Subunternehmer aktivieren, können wieder automatische Erinnerungen versendet werden."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleActiveToggle(!profile.active)}>
                      {profile.active ? "Deaktivieren" : "Aktivieren"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="text-xs text-muted-foreground">
              Erinnerungen {profile.active ? "aktiviert" : "deaktiviert"}
            </p>
          </div>
        </div>
        
        {/* Inactive Banner */}
        {!profile.active && (
          <div className="col-span-full p-4 bg-muted/50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Activity className="h-4 w-4" />
              <p className="text-sm font-medium">
                Dieser Nachunternehmer ist inaktiv. Es werden keine Erinnerungen versendet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-uebersicht">
            <Building2 className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2" data-testid="tab-nachweise">
            <FileText className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
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
            contractorId={id!}
            onAction={(action, requirementId) => {
              if (action === 'view_document') {
                const requirement = requirements.find(r => r.id === requirementId);
                if (requirement?.documents?.[0]) {
                  navigate(`/documents/${requirement.documents[0].id}`);
                }
              } else if (action === 'review') {
                navigate(`/requirements/${requirementId}`);
              } else if (action === 'request_upload') {
                console.log('Request upload for requirement:', requirementId);
              } else if (action === 'request_correction') {
                console.log('Request correction for requirement:', requirementId);
              } else if (action === 'request_renewal') {
                console.log('Request renewal for requirement:', requirementId);
              }
            }}
            onReview={reviewRequirement}
            onSendReminder={sendReminder}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}