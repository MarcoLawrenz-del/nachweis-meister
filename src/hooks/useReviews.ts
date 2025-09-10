import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewAction {
  requirementId: string;
  action: 'approve' | 'reject' | 'escalate';
  reason?: string;
  escalationReason?: string;
}

export const useReviews = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendNotification = async (notificationData: any) => {
    try {
      const { error } = await supabase.functions.invoke('send-review-notification', {
        body: notificationData
      });
      
      if (error) {
        console.error('Notification error:', error);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const submitReview = async ({ requirementId, action, reason, escalationReason }: ReviewAction): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Get requirement details for notification
      const { data: requirement, error: reqError } = await supabase
        .from('requirements')
        .select(`
          *,
          project_sub:project_subs!inner(
            project:projects!inner(name, tenant_id),
            subcontractor:subcontractors!inner(company_name, contact_email, contact_name)
          ),
          document_type:document_types!inner(name_de)
        `)
        .eq('id', requirementId)
        .single();

      if (reqError) throw reqError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: reviewer } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();

      let updateData: any = {
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      };

      let notificationType: string = '';
      let notificationRecipient = {
        email: requirement.project_sub.subcontractor.contact_email,
        name: requirement.project_sub.subcontractor.contact_name,
      };

      switch (action) {
        case 'approve':
          updateData.status = 'valid';
          notificationType = 'approval';
          break;
        case 'reject':
          updateData.status = 'missing';
          updateData.rejection_reason = reason;
          notificationType = 'rejection';
          break;
        case 'escalate':
          updateData.escalated = true;
          updateData.escalated_at = new Date().toISOString();
          updateData.escalation_reason = escalationReason;
          updateData.review_priority = 'high';
          notificationType = 'escalation';
          
          // Find admin/owner for escalation notification
          const { data: admin } = await supabase
            .from('users')
            .select('email, name')
            .eq('tenant_id', requirement.project_sub.project.tenant_id)
            .eq('role', 'owner')
            .limit(1)
            .single();
          
          if (admin) {
            notificationRecipient = { email: admin.email, name: admin.name };
          }
          break;
      }

      // Update requirement
      const { error: updateError } = await supabase
        .from('requirements')
        .update(updateData)
        .eq('id', requirementId);

      if (updateError) throw updateError;

      // Send notification
      await sendNotification({
        type: notificationType,
        requirementId,
        recipientEmail: notificationRecipient.email,
        recipientName: notificationRecipient.name,
        projectName: requirement.project_sub.project.name,
        subcontractorName: requirement.project_sub.subcontractor.company_name,
        documentType: requirement.document_type.name_de,
        reviewerName: reviewer?.name,
        reason,
        escalationReason,
      });

      toast({
        title: "Prüfung abgeschlossen",
        description: `Dokument wurde ${action === 'approve' ? 'genehmigt' : action === 'reject' ? 'abgelehnt' : 'eskaliert'}.`,
      });

      return true;

    } catch (error: any) {
      console.error('Review submission error:', error);
      toast({
        title: "Fehler",
        description: "Die Prüfung konnte nicht abgeschlossen werden.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const assignReviewer = async (requirementId: string, reviewerId: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('requirements')
        .update({ 
          assigned_reviewer_id: reviewerId,
          status: 'in_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', requirementId);

      if (error) throw error;

      toast({
        title: "Prüfer zugewiesen",
        description: "Der Prüfer wurde erfolgreich zugewiesen.",
      });

    } catch (error: any) {
      console.error('Reviewer assignment error:', error);
      toast({
        title: "Fehler",
        description: "Der Prüfer konnte nicht zugewiesen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitReview,
    assignReviewer,
    isLoading,
  };
};