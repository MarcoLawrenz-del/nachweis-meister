import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RequirementStatus, ComplianceStatus, SubcontractorFlags } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';

export interface SubcontractorProfileData {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string;
  phone: string | null;
  address: string | null;
  country_code: string;
  company_type: string;
  status: string;
  compliance_status: ComplianceStatus;
  notes: string | null;
  requires_employees: boolean | null;
  has_non_eu_workers: boolean | null;
  employees_not_employed_in_germany: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface RequirementWithDocument {
  id: string;
  status: RequirementStatus;
  due_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  submitted_at: string | null;
  assigned_reviewer_id: string | null;
  rejection_reason: string | null;
  escalated: boolean;
  escalated_at: string | null;
  escalation_reason: string | null;
  last_reminded_at: string | null;
  review_priority: string | null;
  project_sub_id: string;
  created_at: string;
  updated_at: string;
  document_type_id: string;
  document_types: {
    id: string;
    name_de: string;
    code: string;
    description_de: string | null;
    required_by_default: boolean;
  };
  documents: Array<{
    id: string;
    file_name: string;
    file_url: string;
    valid_from: string | null;
    valid_to: string | null;
    uploaded_at: string;
  }>;
}

export interface KPIData {
  missing: number;
  submitted: number;
  in_review: number;
  valid: number;
  expiring: number;
  expired: number;
  rejected: number;
}

export const useSubcontractorProfile = (subcontractorId: string) => {
  const [profile, setProfile] = useState<SubcontractorProfileData | null>(null);
  const [requirements, setRequirements] = useState<RequirementWithDocument[]>([]);
  const [kpis, setKPIs] = useState<KPIData>({
    missing: 0, submitted: 0, in_review: 0, valid: 0, expiring: 0, expired: 0, rejected: 0
  });
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch subcontractor profile
  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', subcontractorId)
        .single();

      if (error) throw error;
      setProfile(data as SubcontractorProfileData);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fehler beim Laden des Profils",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch requirements with documents
  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          *,
          document_types!inner(*),
          documents(*)
        `)
        .in('project_sub_id', await getProjectSubIds());

      if (error) throw error;
      
      const requirementsData = data as any[];
      setRequirements(requirementsData);

      // Calculate KPIs
      const kpiData: KPIData = {
        missing: 0, submitted: 0, in_review: 0, valid: 0, expiring: 0, expired: 0, rejected: 0
      };

      requirementsData.forEach(req => {
        if (req.status in kpiData) {
          kpiData[req.status as keyof KPIData]++;
        }
      });

      setKPIs(kpiData);
    } catch (error: any) {
      console.error('Error fetching requirements:', error);
      toast({
        title: "Fehler beim Laden der Anforderungen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Helper to get project_sub_ids for this subcontractor
  const getProjectSubIds = async (): Promise<string[]> => {
    const { data } = await supabase
      .from('project_subs')
      .select('id')
      .eq('subcontractor_id', subcontractorId);
    
    return data?.map(ps => ps.id) || [];
  };

  // Fetch email logs
  const fetchEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
    }
  };

  // Fetch review history
  const fetchReviewHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('review_history')
        .select(`
          *,
          requirements!inner(
            document_types!inner(name_de, code)
          )
        `)
        .in('requirement_id', requirements.map(r => r.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviewHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching review history:', error);
    }
  };

  // Update subcontractor profile
  const updateProfile = async (updates: Partial<SubcontractorProfileData>) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update(updates)
        .eq('id', subcontractorId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profil aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fehler beim Speichern",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Approve/reject requirement
  const reviewRequirement = async (
    requirementId: string, 
    action: 'approve' | 'reject', 
    data: { 
      valid_from?: string;
      valid_to?: string;
      rejection_reason?: string;
    }
  ) => {
    try {
      const updateData: any = {
        status: action === 'approve' ? 'valid' : 'rejected',
        ...(action === 'approve' && { 
          valid_from: data.valid_from,
          valid_to: data.valid_to 
        }),
        ...(action === 'reject' && { 
          rejection_reason: data.rejection_reason 
        })
      };

      const { error } = await supabase
        .from('requirements')
        .update(updateData)
        .eq('id', requirementId);

      if (error) throw error;

      await fetchRequirements(); // Refresh data

      toast({
        title: action === 'approve' ? "Dokument genehmigt" : "Dokument abgelehnt",
        description: "Die Prüfung wurde erfolgreich abgeschlossen.",
      });

      return true;
    } catch (error: any) {
      console.error('Error reviewing requirement:', error);
      toast({
        title: "Fehler bei der Prüfung",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Send immediate reminder
  const sendReminder = async (requirementIds?: string[]) => {
    try {
      const { error } = await supabase.functions.invoke('send-immediate-reminder', {
        body: {
          subcontractor_id: subcontractorId,
          requirement_ids: requirementIds
        }
      });

      if (error) throw error;

      await fetchEmailLogs(); // Refresh logs

      toast({
        title: "Erinnerung gesendet",
        description: "Die E-Mail-Erinnerung wurde erfolgreich versendet.",
      });

      return true;
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Fehler beim Versenden",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchRequirements(),
        fetchEmailLogs()
      ]);
      setIsLoading(false);
    };

    if (subcontractorId) {
      loadData();
    }
  }, [subcontractorId]);

  // Load review history after requirements are loaded
  useEffect(() => {
    if (requirements.length > 0) {
      fetchReviewHistory();
    }
  }, [requirements]);

  return {
    profile,
    requirements,
    kpis,
    emailLogs,
    reviewHistory,
    isLoading,
    updateProfile,
    reviewRequirement,
    sendReminder,
    refetchData: async () => {
      await Promise.all([
        fetchProfile(),
        fetchRequirements(),
        fetchEmailLogs()
      ]);
    }
  };
};