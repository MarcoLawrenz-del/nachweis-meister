import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, User, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { debug } from '@/lib/debug';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import { displayName } from '@/utils/customDocs';
import { Link } from 'react-router-dom';

interface ActivityFeedProps {
  limit?: number;
  daysBack?: number;
  onReviewClick?: (contractorId: string, docType: string) => void;
  className?: string;
}

export function ActivityFeed({ limit = 10, daysBack = 7, onReviewClick, className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadActivities = async () => {
      try {
        // Legacy component - use ActivityFeedSupabase instead
        setActivities([]);
        debug.warn('ActivityFeed: Use ActivityFeedSupabase component instead');
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadActivities();
  }, [limit, daysBack]);

  const formatDateTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const getActionConfig = (action: string) => {
    const configs = {
      hochgeladen: {
        label: 'Hochgeladen',
        className: 'bg-info-50 text-info-600 border-info-600/20'
      },
      angenommen: {
        label: 'Angenommen',
        className: 'bg-success-50 text-success-600 border-success-600/20'
      },
      abgelehnt: {
        label: 'Abgelehnt',
        className: 'bg-danger-50 text-danger-600 border-danger-600/20'
      }
    };
    return configs[action as keyof typeof configs] || configs.hochgeladen;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Aktivität
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine aktuellen Aktivitäten</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const actionConfig = getActionConfig(activity.action);
              
              return (
                <div 
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.docName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.contractorName}
                        </span>
                        <Badge variant="outline" className={actionConfig.className}>
                          {actionConfig.label}
                        </Badge>
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
                    <Link to={`/app/subcontractors/${activity.contractorId}?doc=${activity.docType}&open=review`}>
                      <Eye className="h-3 w-3" />
                      Prüfen
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}