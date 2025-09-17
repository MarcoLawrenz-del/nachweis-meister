import { useState, useEffect } from 'react';
import { RequirementStatus, ComplianceStatus, SubcontractorFlags } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';
import { sendReminderMissing } from '@/services/email';
import { getContractor, updateContractor, type ContractorDocument } from '@/services/contractors';
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
  
  // Use the hook at the component level
  const documents = useContractorDocuments(subcontractorId) || [];

  // Simplified profile loading - no Supabase calls
  useEffect(() => {
    const contractor = getContractor(subcontractorId);
    if (contractor) {
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
        created_at: contractor.created_at,
        updated_at: new Date().toISOString()
      };
      setProfile(profileData);
    }
    setIsLoading(false);
  }, [subcontractorId]);

  return {
    profile,
    requirements: [],
    kpis,
    emailLogs: [],
    reviewHistory: [],
    isLoading,
    updateProfile: async () => true,
    reviewRequirement: async () => true,
    sendReminder: async () => true,
    refetchData: async () => {}
  };
};

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
  
  // Use the hook at the component level
  const documents = useContractorDocuments(subcontractorId) || [];

  // Fetch subcontractor profile
  const fetchProfile = async () => {
    try {
      const contractor = getContractor(subcontractorId);
      if (!contractor) {
        throw new Error('Nachunternehmer nicht gefunden');
      }
      
      // Convert contractor data to profile format
      const profileData: SubcontractorProfileData = {
        id: contractor.id,
        company_name: contractor.company_name,
        contact_name: contractor.contact_name || null,
        contact_email: contractor.email,
        phone: contractor.phone || null,
        address: contractor.address || null,
        country_code: 'DE', // Default value since it's not in local contractor type
        company_type: 'baubetrieb', // Default value since it's not in local contractor type
        status: contractor.active ? 'active' : 'inactive',
        compliance_status: 'non_compliant' as ComplianceStatus,
        notes: contractor.notes || null,
        requires_employees: null, // Default value since it's not in local contractor type
        has_non_eu_workers: null, // Default value since it's not in local contractor type
        employees_not_employed_in_germany: null, // Default value since it's not in local contractor type
        created_at: contractor.created_at,
        updated_at: new Date().toISOString()
      };
      
      setProfile(profileData);
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
      // Convert documents to requirements format for compatibility
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
    } catch (error: any) {
      console.error('Error fetching requirements:', error);
      toast({
        title: "Fehler beim Laden der Anforderungen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch email logs - simplified for local storage
  const fetchEmailLogs = async () => {
    try {
      // For local storage, we don't have detailed email logs
      // Set empty array for now
      setEmailLogs([]);
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
    }
  };

  // Fetch review history - simplified for local storage  
  const fetchReviewHistory = async () => {
    try {
      // For local storage, we don't have detailed review history
      // Set empty array for now
      setReviewHistory([]);
    } catch (error: any) {
      console.error('Error fetching review history:', error);
    }
  };

  // Update subcontractor profile
  const updateProfile = async (updates: Partial<SubcontractorProfileData>) => {
    try {
      // Update the contractor in local storage
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

  // Approve/reject requirement - simplified for local storage
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
      // For local storage implementation, we would need to update the document status
      // This is a simplified version
      console.log(`${action} requirement ${requirementId}`, data);

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
      await sendReminderMissing({
        contractorId: subcontractorId,
        email: "", // Email will be fetched in the stub  
        missingDocs: requirementIds || []
      });

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
  }, [subcontractorId, documents]); // Add documents as dependency

  // Load review history after requirements are loaded
  useEffect(() => {
    if (requirements.length > 0) {
      fetchReviewHistory();
    }
  }, [requirements.length]);

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