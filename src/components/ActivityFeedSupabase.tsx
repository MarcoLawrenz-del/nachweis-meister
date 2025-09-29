import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ActivityEntry {
  id: string;
  subcontractor_id: string;
  document_type_name: string;
  document_type_code: string;
  action: string;
  created_at: string;
  reviewer_name: string | null;
  company_name: string;
  old_status: string | null;
  new_status: string | null;
}

interface ActivityFeedProps {
  limit?: number;
  daysBack?: number;
  className?: string;
}

export function ActivityFeedSupabase({ limit = 10, daysBack = 7, className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, [limit, daysBack]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      
      const { data, error } = await supabase
        .from('review_history')
        .select(`
          id,
          action,
          old_status,
          new_status,
          created_at,
          reviewer:users!reviewer_id (
            name
          ),
          requirement:requirements!requirement_id (
            document_type:document_types!document_type_id (
              name_de,
              code
            ),
            project_sub:project_subs!project_sub_id (
              subcontractor:subcontractors!subcontractor_id (
                id,
                company_name
              )
            )
          )
        `)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedActivities: ActivityEntry[] = (data || []).map(item => ({
        id: item.id,
        subcontractor_id: item.requirement?.project_sub?.subcontractor?.id || '',
        document_type_name: item.requirement?.document_type?.name_de || 'Unbekannt',
        document_type_code: item.requirement?.document_type?.code || '',
        action: item.action,
        created_at: item.created_at,
        reviewer_name: item.reviewer?.name || null,
        company_name: item.requirement?.project_sub?.subcontractor?.company_name || 'Unbekannt',
        old_status: item.old_status,
        new_status: item.new_status
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Fehler",
        description: "Aktivitäten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const getActionConfig = (action: string) => {
    const configs = {
      approved: {
        label: 'Freigegeben',
        className: 'bg-success-50 text-success-600 border-success-600/20'
      },
      rejected: {
        label: 'Abgelehnt',
        className: 'bg-danger-50 text-danger-600 border-danger-600/20'
      },
      submitted: {
        label: 'Eingereicht',
        className: 'bg-info-50 text-info-600 border-info-600/20'
      },
      assigned: {
        label: 'Zugewiesen',
        className: 'bg-warning-50 text-warning-600 border-warning-600/20'
      },
      escalated: {
        label: 'Eskaliert',
        className: 'bg-warning-50 text-warning-600 border-warning-600/20'
      }
    };
    return configs[action as keyof typeof configs] || configs.submitted;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
                      <p className="font-medium text-sm">{activity.document_type_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.company_name}
                        </span>
                        <Badge variant="outline" className={actionConfig.className}>
                          {actionConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDateTime(activity.created_at)}
                        {activity.reviewer_name && (
                          <span className="ml-2">von {activity.reviewer_name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {activity.subcontractor_id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="gap-1"
                    >
                      <Link to={`/app/subcontractors/${activity.subcontractor_id}?doc=${activity.document_type_code}&open=review`}>
                        <Eye className="h-3 w-3" />
                        Prüfen
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}