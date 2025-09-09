import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ComputeRequirementsResponse } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';

interface UseComplianceEngineProps {
  onSuccess?: () => void;
}

export const useComplianceEngine = ({ onSuccess }: UseComplianceEngineProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const computeRequirements = async (
    subcontractorId: string,
    projectSubId?: string
  ): Promise<ComputeRequirementsResponse | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('compute-requirements', {
        body: {
          subcontractor_id: subcontractorId,
          project_sub_id: projectSubId
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Anforderungen aktualisiert",
          description: `${data.created_requirements} neue Anforderungen erstellt, ${data.updated_requirements} aktualisiert.`,
          variant: "default",
        });

        if (data.warning_count > 0) {
          toast({
            title: `${data.warning_count} Warnungen`,
            description: "Fehlende oder ablaufende Dokumente gefunden.",
            variant: "destructive",
          });
        }

        onSuccess?.();
        return data;
      }

      throw new Error(data?.error || 'Unbekannter Fehler');

    } catch (error: any) {
      console.error('Error computing requirements:', error);
      toast({
        title: "Fehler bei Anforderungsberechnung",
        description: error.message || 'Die Anforderungen konnten nicht berechnet werden.',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubcontractorFlags = async (
    subcontractorId: string,
    flags: {
      requires_employees?: boolean | null;
      has_non_eu_workers?: boolean | null;
      employees_not_employed_in_germany?: boolean | null;
    }
  ) => {
    setIsLoading(true);

    try {
      // Update flags in database
      const { error: updateError } = await supabase
        .from('subcontractors')
        .update(flags)
        .eq('id', subcontractorId);

      if (updateError) {
        throw updateError;
      }

      // Trigger requirement computation automatically via database trigger
      // The trigger will call compute-requirements function
      
      toast({
        title: "Eigenschaften aktualisiert",
        description: "Die Nachunternehmer-Eigenschaften wurden erfolgreich geändert. Anforderungen werden neu berechnet.",
        variant: "default",
      });

      onSuccess?.();
      return true;

    } catch (error: any) {
      console.error('Error updating subcontractor flags:', error);
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message || 'Die Eigenschaften konnten nicht aktualisiert werden.',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    computeRequirements,
    updateSubcontractorFlags,
    isLoading
  };
};