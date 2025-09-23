import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Upload, 
  FileText, 
  Clock,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { getDocs, subscribe as subscribeContractorDocs } from '@/services/contractorDocs.store';
import { getContractors } from '@/services/contractors.store';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import { displayName } from '@/utils/customDocs';

interface ActivityItem {
  id: string;
  contractorId: string;
  contractorName: string;
  documentTypeId: string;
  documentName: string;
  action: 'uploaded' | 'accepted' | 'rejected';
  timestamp: string;
  isRequired: boolean;
}

interface ActivityFeedProps {
  className?: string;
}

export function ActivityFeed({ className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [timeFilter, setTimeFilter] = useState<'7' | '30'>('7');
  const [requiredOnly, setRequiredOnly] = useState(false);

  const loadActivities = () => {
    const contractors = getContractors();
    const cutoffDate = subDays(new Date(), parseInt(timeFilter));
    const allActivities: ActivityItem[] = [];

    contractors.forEach(contractor => {
      const docs = getDocs(contractor.id);
      
      docs.forEach(doc => {
        // Check for uploaded events from history
        if (doc.history && Array.isArray(doc.history)) {
          doc.history.forEach(historyEntry => {
            const entryDate = new Date(historyEntry.tsISO);
            
            if (isAfter(entryDate, cutoffDate) && historyEntry.action === 'uploaded') {
              const docType = DOCUMENT_TYPES.find(dt => dt.id === doc.documentTypeId);
              const docName = displayName(doc.documentTypeId, docType?.label || '', doc.customName, doc.label);
              
              // Skip if filtering for required only and doc is not required
              if (requiredOnly && doc.requirement !== 'required') return;
              
              allActivities.push({
                id: `${contractor.id}-${doc.documentTypeId}-${historyEntry.tsISO}`,
                contractorId: contractor.id,
                contractorName: contractor.company_name || contractor.companyName,
                documentTypeId: doc.documentTypeId,
                documentName: docName,
                action: 'uploaded',
                timestamp: historyEntry.tsISO,
                isRequired: doc.requirement === 'required'
              });
            }
          });
        }
        
        // Also check for recently uploaded documents without history (backwards compatibility)
        if (doc.uploadedAt && doc.status === 'submitted') {
          const uploadDate = new Date(doc.uploadedAt);
          
          if (isAfter(uploadDate, cutoffDate)) {
            const docType = DOCUMENT_TYPES.find(dt => dt.id === doc.documentTypeId);
            const docName = displayName(doc.documentTypeId, docType?.label || '', doc.customName, doc.label);
            
            // Skip if filtering for required only and doc is not required
            if (requiredOnly && doc.requirement !== 'required') return;
            
            // Only add if not already in activities from history
            const existsInHistory = allActivities.some(activity => 
              activity.contractorId === contractor.id && 
              activity.documentTypeId === doc.documentTypeId
            );
            
            if (!existsInHistory) {
              allActivities.push({
                id: `${contractor.id}-${doc.documentTypeId}-${doc.uploadedAt}`,
                contractorId: contractor.id,
                contractorName: contractor.company_name || contractor.companyName,
                documentTypeId: doc.documentTypeId,
                documentName: docName,
                action: 'uploaded',
                timestamp: doc.uploadedAt,
                isRequired: doc.requirement === 'required'
              });
            }
          }
        }
      });
    });

    // Sort by timestamp (newest first) and take top 10
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(allActivities.slice(0, 10));
  };

  useEffect(() => {
    loadActivities();
    
    // Subscribe to changes in contractor docs
    const contractors = getContractors();
    const unsubscribers = contractors.map(contractor => 
      subscribeContractorDocs(contractor.id, loadActivities)
    );
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [timeFilter, requiredOnly]);

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const getActionConfig = (action: string) => {
    const configs = {
      uploaded: {
        label: 'Hochgeladen',
        icon: Upload,
        className: 'bg-info-50 text-info-600 border-info-600/20'
      },
      accepted: {
        label: 'Angenommen',
        icon: FileText,
        className: 'bg-success-50 text-success-600 border-success-600/20'
      },
      rejected: {
        label: 'Abgelehnt',
        icon: FileText,
        className: 'bg-danger-50 text-danger-600 border-danger-600/20'
      }
    };
    return configs[action as keyof typeof configs] || configs.uploaded;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aktivität
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="required-only"
                checked={requiredOnly}
                onCheckedChange={setRequiredOnly}
              />
              <Label htmlFor="required-only" className="text-sm">
                Nur Pflicht
              </Label>
            </div>
            <Select value={timeFilter} onValueChange={(value: '7' | '30') => setTimeFilter(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Tage</SelectItem>
                <SelectItem value="30">30 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => {
              const actionConfig = getActionConfig(activity.action);
              const ActionIcon = actionConfig.icon;
              
              return (
                <div 
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <ActionIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.documentName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.contractorName}
                        </span>
                        <Badge variant="outline" className={actionConfig.className}>
                          {actionConfig.label}
                        </Badge>
                        {activity.isRequired && (
                          <Badge variant="outline" className="bg-warn-50 text-warn-600 border-warn-600/20">
                            Pflicht
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDateTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="gap-1"
                  >
                    <Link to={`/app/subcontractors/${activity.contractorId}?doc=${activity.documentTypeId}&open=review`}>
                      <Eye className="h-3 w-3" />
                      Prüfen
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Aktivitäten in den letzten {timeFilter} Tagen</p>
            <p className="text-xs mt-1">
              {requiredOnly ? 'Filter: Nur Pflichtdokumente' : 'Alle Dokumente'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}