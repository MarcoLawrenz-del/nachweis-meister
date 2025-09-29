import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload,
  Mail,
  Phone,
  MapPin,
  User
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { aggregateContractorStatusById, type ContractorDocument } from "@/services/contractors";
import { DOCUMENT_TYPES } from "@/config/documentTypes";
import RequestDocumentsDialogSupabase from "@/components/RequestDocumentsDialogSupabase";
import { useSupabaseRequirements } from "@/hooks/useSupabaseRequirements";
import { displayName } from "@/utils/customDocs";

interface OverviewTabProps {
  profile: any;
  projectId?: string;
}

export function OverviewTab({ profile, projectId }: OverviewTabProps) {
  const { id: urlSubId } = useParams();
  const subId = urlSubId!;
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  // Get requirements from Supabase
  const { requirements, loading, error } = useSupabaseRequirements(subId);

  // Convert requirements to docs format for compatibility
  const docs = requirements.map(req => ({
    contractorId: subId,
    documentTypeId: req.document_type_id,
    status: req.status as any,
    requirement: 'required' as const, // All requirements from Supabase are required by default
    fileName: req.documents?.[0]?.file_name,
    fileUrl: req.documents?.[0]?.file_url,
    uploadedAt: req.documents?.[0]?.uploaded_at,
    validUntil: req.documents?.[0]?.valid_to,
    customName: undefined,
    label: undefined,
  }));

  // Calculate counts manually
  const missing = docs.filter(doc => doc.status === 'missing').length;
  const reviewing = docs.filter(doc => doc.status === 'in_review' || doc.status === 'submitted').length;
  const expiring = docs.filter(doc => doc.status === 'expiring').length;
  const valid = docs.filter(doc => doc.status === 'valid').length;
  const hasRequired = docs.some(doc => doc.requirement === 'required');

  // Status based on counts
  const status = missing > 0 ? 'attention' : 'complete';

  // Get next steps: first 3 required documents that need action (missing|rejected|expired)
  const nextSteps = docs
    .filter(doc => doc.requirement === "required" && 
      ["missing", "rejected", "expired"].includes(doc.status))
    .slice(0, 3)
    .map(doc => {
      const docType = DOCUMENT_TYPES.find(dt => dt.id === doc.documentTypeId);
      const docName = displayName(doc.documentTypeId, docType?.label || doc.documentTypeId, doc.customName || '', doc.label || '');
      
      return {
        id: doc.documentTypeId,
        name: docName,
        status: doc.status,
        doc
      };
    });

  // Get status info for display
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'missing':
        return { label: 'Fehlend', variant: 'destructive' as const, className: 'bg-warn-50 text-warn-600 border-warn-600/20' };
      case 'rejected':
        return { label: 'Abgelehnt', variant: 'destructive' as const, className: 'bg-danger-50 text-danger-600 border-danger-600/20' };
      case 'expired':
        return { label: 'Abgelaufen', variant: 'destructive' as const, className: 'bg-danger-50 text-danger-600 border-danger-600/20' };
      default:
        return { label: 'Unbekannt', variant: 'outline' as const, className: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Übersicht</h2>
          <p className="text-muted-foreground">
            Compliance-Status und nächste Schritte
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRequestDialog(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Dokumente anfordern
        </Button>
      </div>

      {/* Aggregated Status */}
      {status === "complete" && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              Vollständig
            </Badge>
          </div>
        </div>
      )}
      {status === "attention" && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              Aufmerksamkeit
            </Badge>
          </div>
        </div>
      )}

      {/* Contact Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Kontaktdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.contact_name && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ansprechpartner</p>
                  <p className="text-sm">{profile.contact_name}</p>
                </div>
              </div>
            )}
            
            {profile?.contact_email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                  <a 
                    href={`mailto:${profile.contact_email}`}
                    className="text-sm text-foreground hover:underline"
                  >
                    {profile.contact_email}
                  </a>
                </div>
              </div>
            )}
            
            {profile?.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                  <a 
                    href={`tel:${profile.phone}`}
                    className="text-sm text-foreground hover:underline"
                  >
                    {profile.phone}
                  </a>
                </div>
              </div>
            )}
            
            {profile?.address && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                  <p className="text-sm">{profile.address}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No Required Documents Message */}
      {!hasRequired && (
        <Alert className="border-info-50 bg-info-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-info-600">
            Noch keine Pflichtdokumente angefordert.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Fehlend</p>
                <p className="text-2xl font-bold text-red-600">{missing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-info-50 rounded-full">
                <Clock className="h-5 w-5 text-info-600" />
              </div>
              <div>
                <p className="text-sm font-medium">In Prüfung</p>
                <p className="text-2xl font-bold text-info-600">{reviewing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warn-50 rounded-full">
                <AlertTriangle className="h-5 w-5 text-warn-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Läuft ab</p>
                <p className="text-2xl font-bold text-warn-600">{expiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success-50 rounded-full">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Gültig</p>
                <p className="text-2xl font-bold text-success-600">{valid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nächste Schritte - Clean neutral design */}
      {nextSteps.length > 0 && (
        <section className="bg-surface border border-border rounded-lg shadow-sm">
          <header className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text">Nächste Schritte</h3>
            <p className="text-sm text-text-muted mt-1">Fehlende Pflichtdokumente anfordern</p>
          </header>
          <ul className="divide-y divide-border">
            {nextSteps.map((step) => {
              const statusInfo = getStatusInfo(step.status);
              return (
                <li key={step.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-text">{step.name}</div>
                      <div className="mt-2">
                        <Badge variant="outline" className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowRequestDialog(true)}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Anfordern
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Request Documents Dialog */}
      {showRequestDialog && (
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl">
            <RequestDocumentsDialogSupabase
              contractorId={subId}
              contractorEmail={profile?.contact_email}
              onClose={() => setShowRequestDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}