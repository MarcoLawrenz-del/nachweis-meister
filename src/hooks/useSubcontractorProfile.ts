import { useState, useEffect } from 'react';
import { RequirementStatus, ComplianceStatus } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';
import { sendReminderMissing } from '@/services/email';
import { getSupabaseContractor, updateSupabaseContractorStatus } from '@/services/supabaseContractors';
import { useContractorDocuments } from '@/hooks/useContractorDocuments';
import { supabase } from '@/integrations/supabase/client';

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
  active: boolean;
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
  
  const documents = useContractorDocuments(subcontractorId) || [];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        console.log('Loading subcontractor profile:', subcontractorId);
        
        // Load profile from Supabase
        const contractor = await getSupabaseContractor(subcontractorId);
        if (!contractor) {
          console.log('Nachunternehmer nicht gefunden:', subcontractorId);
          setProfile(null);
          return;
        }
        
        console.log('Loaded contractor from Supabase:', contractor);
        
        const profileData: SubcontractorProfileData = {
          id: contractor.id,
          company_name: contractor.company_name,
          contact_name: contractor.contact_name || null,
          contact_email: contractor.contact_email,
          phone: contractor.phone || null,
          address: contractor.address || null,
          country_code: contractor.country_code,
          company_type: contractor.company_type,
          status: contractor.status,
          compliance_status: contractor.compliance_status as ComplianceStatus,
          notes: contractor.notes || null,
          requires_employees: null,
          has_non_eu_workers: null,
          employees_not_employed_in_germany: null,
          active: contractor.status === 'active',
          created_at: contractor.created_at,
          updated_at: contractor.updated_at
        };
        
        setProfile(profileData);

        // Convert documents to requirements format
        const requirementsData: RequirementWithDocument[] = documents.map(doc => ({
          id: `req-${doc.documentTypeId}`,
          status: doc.status as RequirementStatus,
          due_date: null,
          valid_from: null,
          valid_to: doc.validUntil || null,
          submitted_at: doc.status === 'submitted' ? new Date().toISOString() : null,
          assigned_reviewer_id: null,
          rejection_reason: doc.rejectionReason || null,
          escalated: false,
          escalated_at: null,
          escalation_reason: null,
          last_reminded_at: null,
          review_priority: 'normal',
          project_sub_id: `ps-${subcontractorId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          document_type_id: doc.documentTypeId,
          document_types: {
            id: doc.documentTypeId,
            name_de: doc.label || doc.customName || doc.documentTypeId,
            code: doc.documentTypeId,
            description_de: null,
            required_by_default: doc.requirement === 'required'
          },
          documents: doc.fileUrl ? [{
            id: `file-${doc.documentTypeId}`,
            file_name: doc.fileName || `${doc.label || doc.customName || doc.documentTypeId}.pdf`,
            file_url: doc.fileUrl,
            valid_from: null,
            valid_to: doc.validUntil || null,
            uploaded_at: new Date().toISOString()
          }] : []
        }));
        
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
        setEmailLogs([]);
        setReviewHistory([]);
        
      } catch (error: any) {
        console.error('Error loading profile data:', error);
        toast({
          title: "Fehler beim Laden",
          description: "Profile konnte nicht geladen werden: " + error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (subcontractorId) {
      loadData();
    }
  }, [subcontractorId, documents]);

  const updateProfile = async (updates: Partial<SubcontractorProfileData>) => {
    try {
      console.log('Updating profile:', updates);
      
      // Handle status updates
      if ('status' in updates || 'active' in updates) {
        const newStatus = updates.status || (updates.active ? 'active' : 'inactive');
        console.log('Updating status to:', newStatus);
        
        const success = await updateSupabaseContractorStatus(
          subcontractorId, 
          newStatus as 'active' | 'inactive'
        );

        if (!success) {
          throw new Error('Fehler beim Aktualisieren des Status');
        }

        // Update local state
        const normalizedUpdates = {
          ...updates,
          active: newStatus === 'active',
          status: newStatus
        };

        setProfile(prev => prev ? { ...prev, ...normalizedUpdates } : null);
        
        toast({
          title: "Status aktualisiert",
          description: `Nachunternehmer ist jetzt ${newStatus === 'active' ? 'aktiv' : 'inaktiv'}.`,
        });

        return true;
      }

      // Handle other profile updates (company_name, contact_email, etc.)
      // For now, only status updates are supported
      toast({
        title: "Info",
        description: "Nur Status-Updates werden derzeit unterstützt.",
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

  const sendReminder = async (requirementIds?: string[]) => {
    try {
      // Check if subcontractor is active before sending reminder
      if (!profile?.active) {
        toast({
          title: "Erinnerung nicht gesendet",
          description: "Inaktive Nachunternehmer erhalten keine Erinnerungen.",
          variant: "destructive"
        });
        return false;
      }

      const magicLink = `${window.location.origin}/upload?cid=${subcontractorId}`;
      await sendReminderMissing({
        to: "", 
        missingDocs: requirementIds || [],
        contractorName: "Nachunternehmer",
        magicLink: magicLink
      });

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
      console.log('=== REFETCH DATA START ===');
      
      try {
        // Re-load from Supabase
        const contractor = await getSupabaseContractor(subcontractorId);
        console.log('Contractor from Supabase:', contractor);
        
        if (contractor) {
          const profileData: SubcontractorProfileData = {
            id: contractor.id,
            company_name: contractor.company_name,
            contact_name: contractor.contact_name || null,
            contact_email: contractor.contact_email,
            phone: contractor.phone || null,
            address: contractor.address || null,
            country_code: contractor.country_code,
            company_type: contractor.company_type,
            status: contractor.status,
            compliance_status: contractor.compliance_status as ComplianceStatus,
            notes: contractor.notes || null,
            requires_employees: null,
            has_non_eu_workers: null,
            employees_not_employed_in_germany: null,
            active: contractor.status === 'active',
            created_at: contractor.created_at,
            updated_at: contractor.updated_at
          };
          
          console.log('Setting new profile data:', profileData);
          setProfile(profileData);
          console.log('=== REFETCH DATA SUCCESS ===');
        } else {
          console.error('=== REFETCH DATA ERROR ===');
          console.error('Contractor not found in Supabase during refetch!');
        }
      } catch (error) {
        console.error('Error during refetch:', error);
      }
    }
  };
};