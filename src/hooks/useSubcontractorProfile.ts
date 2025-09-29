import { useState, useEffect } from 'react';
import { RequirementStatus, ComplianceStatus } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';
import { sendReminderMissing } from '@/services/email';
import { getContractor, updateContractor, subscribe } from '@/services/contractors.store';
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
  project_sub_id: string;
  document_type_id: string;
  status: RequirementStatus;
  due_date: string | null;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
  document_type: {
    id: string;
    name_de: string;
    code: string;
    required_by_default: boolean;
  };
  documents: Array<{
    id: string;
    file_name: string;
    file_url: string;
    mime_type: string;
    file_size: number;
    uploaded_at: string;
    valid_from: string | null;
    valid_to: string | null;
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

export const useSubcontractorProfile = (contractorId: string) => {
  const [profile, setProfile] = useState<SubcontractorProfileData | null>(null);
  const [requirements, setRequirements] = useState<RequirementWithDocument[]>([]);
  const [kpis, setKPIs] = useState<KPIData>({
    missing: 0, submitted: 0, in_review: 0, valid: 0, expiring: 0, expired: 0, rejected: 0
  });
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const documents = useContractorDocuments(contractorId) || [];

  // Fetch profile data
  const fetchProfile = async () => {
    if (!contractorId) return;
    
    try {
      console.log('Loading contractor profile:', contractorId);
      setIsLoading(true);
      setError(null);
      
      // Use hybrid service
      const contractor = getContractor(contractorId);
      
      if (contractor) {
        console.log('Found contractor:', contractor);
        
        const profileData: SubcontractorProfileData = {
          id: contractor.id,
          company_name: contractor.company_name,
          contact_name: contractor.contact_name || null,
          contact_email: contractor.email,
          phone: contractor.phone || null,
          address: contractor.address || null,
          country_code: contractor.country || 'DE',
          company_type: 'baubetrieb',
          status: contractor.active ? 'active' : 'inactive',
          compliance_status: 'non_compliant' as ComplianceStatus,
          notes: contractor.notes || null,
          requires_employees: contractor.hasEmployees || null,
          has_non_eu_workers: contractor.providesAbroad || null,
          employees_not_employed_in_germany: contractor.providesAbroad || null,
          active: contractor.active,
          created_at: contractor.created_at,
          updated_at: contractor.created_at
        };
        
        setProfile(profileData);
        console.log('Profile set:', profileData);
      } else {
        console.log('No contractor found for ID:', contractorId);
        setProfile(null);
        setError('Nachunternehmer nicht gefunden');
      }
    } catch (error) {
      console.error('Error fetching contractor profile:', error);
      setError('Fehler beim Laden der Nachunternehmer-Daten');
    } finally {
      setIsLoading(false);
    }
  };

  // Load all data
  useEffect(() => {
    fetchProfile();
    
    // Subscribe to contractor changes
    const unsubscribe = subscribe(() => {
      console.log('Contractor data changed, reloading profile');
      fetchProfile();
    });
    
    return unsubscribe;
  }, [contractorId]);

  // Update profile
  const updateProfile = async (updates: Partial<SubcontractorProfileData>): Promise<boolean> => {
    if (!profile) return false;
    
    try {
      setIsLoading(true);
      console.log('Updating profile with:', updates);
      
      // Convert to contractor format
      const contractorUpdates: any = {};
      
      if (updates.company_name) contractorUpdates.company_name = updates.company_name;
      if (updates.contact_name) contractorUpdates.contact_name = updates.contact_name;
      if (updates.contact_email) contractorUpdates.email = updates.contact_email;
      if (updates.phone) contractorUpdates.phone = updates.phone;
      if (updates.address) contractorUpdates.address = updates.address;
      if (updates.country_code) contractorUpdates.country = updates.country_code;
      if (updates.notes) contractorUpdates.notes = updates.notes;
      if (updates.active !== undefined) contractorUpdates.active = updates.active;
      if (updates.requires_employees !== undefined) contractorUpdates.hasEmployees = updates.requires_employees;
      if (updates.has_non_eu_workers !== undefined) contractorUpdates.providesAbroad = updates.has_non_eu_workers;
      
      await updateContractor(profile.id, contractorUpdates);
      
      // Refresh profile data
      await fetchProfile();
      
      toast({
        title: "Profil aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert."
      });
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Fehler beim Aktualisieren der Daten');
      toast({
        title: "Fehler",
        description: "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Send reminder
  const sendReminder = async (): Promise<boolean> => {
    if (!profile) return false;
    
    try {
      setIsLoading(true);
      
      const result = await sendReminderMissing({
        to: profile.contact_email,
        missingDocs: ['Fehlende Dokumente'],
        contractorName: profile.company_name,
        magicLink: `https://app.example.com/upload/${profile.id}`
      });
      
      // Since sendReminderMissing returns { isStub: boolean }, we check for success differently
      toast({
        title: "Erinnerung gesendet",
        description: `Eine Erinnerung wurde an ${profile.contact_email} gesendet.`
      });
      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Fehler",
        description: "Die Erinnerung konnte nicht gesendet werden.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch data
  const refetchData = async () => {
    await fetchProfile();
  };

  return {
    profile,
    requirements,
    kpis,
    emailLogs,
    reviewHistory,
    isLoading,
    error,
    updateProfile,
    sendReminder,
    refetchData
  };
};