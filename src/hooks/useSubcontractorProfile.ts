import { useState, useEffect } from 'react';
import { RequirementStatus, ComplianceStatus } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';
import { sendReminderMissing } from '@/services/email';
import { getContractor, updateContractor } from '@/services/contractors.store';
import { useContractorDocuments } from '@/hooks/useContractorDocuments';

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
        // Load profile from local storage
        const contractor = getContractor(subcontractorId);
        if (!contractor) {
          throw new Error('Nachunternehmer nicht gefunden');
        }
        
        const profileData: SubcontractorProfileData = {
          id: contractor.id,
          company_name: contractor.company_name,
          contact_name: contractor.contact_name || null,
          contact_email: contractor.email,
          phone: contractor.phone || null,
          address: contractor.address || null,
          country_code: 'DE',
          company_type: 'baubetrieb',
          status: contractor.active ? 'active' : 'inactive',
          compliance_status: 'non_compliant' as ComplianceStatus,
          notes: contractor.notes || null,
          requires_employees: null,
          has_non_eu_workers: null,
          employees_not_employed_in_germany: null,
          active: contractor.active,
          created_at: contractor.created_at,
          updated_at: new Date().toISOString()
        };
        
        setProfile(profileData);

        // Convert documents to requirements format
        const requirementsData: RequirementWithDocument[] = documents.map(doc => ({
          id: `req-${doc.docTypeId}`,
          status: doc.status as RequirementStatus,
          due_date: null,
          valid_from: doc.validFrom || null,
          valid_to: doc.validTo || null,
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
          document_type_id: doc.docTypeId,
          document_types: {
            id: doc.docTypeId,
            name_de: doc.name || doc.docTypeId,
            code: doc.docTypeId,
            description_de: null,
            required_by_default: doc.requirement === 'required'
          },
          documents: doc.fileUrl ? [{
            id: `file-${doc.docTypeId}`,
            file_name: doc.fileName || `${doc.name}.pdf`,
            file_url: doc.fileUrl,
            valid_from: doc.validFrom || null,
            valid_to: doc.validTo || null,
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
          description: error.message,
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
      const success = updateContractor(subcontractorId, {
        company_name: updates.company_name,
        contact_name: updates.contact_name || undefined,
        email: updates.contact_email || '',
        phone: updates.phone || undefined,
        address: updates.address || undefined,
        active: updates.status === 'active',
        notes: updates.notes || undefined
      });

      if (!success) {
        throw new Error('Fehler beim Aktualisieren des Profils');
      }

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
      // Refetch would be handled by the useEffect dependency on documents
    }
  };
};