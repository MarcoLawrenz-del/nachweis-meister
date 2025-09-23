import { useState, useEffect } from 'react';
import { ConditionalAnswers, DEFAULT_CONDITIONAL_ANSWERS } from '@/config/conditionalQuestions';
import { deriveRequirements, RequirementMap, OrgFlags } from '@/services/requirements/deriveRequirements';
import { getContractor, updateConditionalAnswers, updateOrgFlags } from '@/services/contractors.store';
import { updateDocumentRequirement } from '@/services/contractorDocs.store';
import { DOCUMENT_TYPES } from '@/config/documentTypes';

interface UseConditionalRequirementsOptions {
  contractorId: string;
  autoSave?: boolean; // Automatically save changes
  autoApply?: boolean; // Automatically apply requirements to document store
}

export function useConditionalRequirements({
  contractorId,
  autoSave = false,
  autoApply = false
}: UseConditionalRequirementsOptions) {
  const contractor = getContractor(contractorId);
  
  const [conditionalAnswers, setConditionalAnswers] = useState<ConditionalAnswers>(
    contractor?.conditionalAnswers || DEFAULT_CONDITIONAL_ANSWERS
  );
  
  const [orgFlags, setOrgFlags] = useState<OrgFlags>(
    contractor?.orgFlags || { hrRegistered: false }
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive requirements from current answers
  const derivedRequirements = deriveRequirements(conditionalAnswers, orgFlags);

  // Update from contractor store when it changes
  useEffect(() => {
    if (contractor) {
      setConditionalAnswers(contractor.conditionalAnswers || DEFAULT_CONDITIONAL_ANSWERS);
      setOrgFlags(contractor.orgFlags || { hrRegistered: false });
    }
  }, [contractor]);

  const updateAnswers = async (newAnswers: ConditionalAnswers) => {
    setConditionalAnswers(newAnswers);
    setError(null);

    if (autoSave) {
      try {
        setIsLoading(true);
        await updateConditionalAnswers(contractorId, newAnswers);
        
        if (autoApply) {
          await applyRequirementsToStore(deriveRequirements(newAnswers, orgFlags));
        }
      } catch (err) {
        setError('Fehler beim Speichern der Antworten');
        console.error('Error updating conditional answers:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateFlags = async (newFlags: OrgFlags) => {
    setOrgFlags(newFlags);
    setError(null);

    if (autoSave) {
      try {
        setIsLoading(true);
        await updateOrgFlags(contractorId, newFlags);
        
        if (autoApply) {
          await applyRequirementsToStore(deriveRequirements(conditionalAnswers, newFlags));
        }
      } catch (err) {
        setError('Fehler beim Speichern der Organisationsdaten');
        console.error('Error updating org flags:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const applyRequirementsToStore = async (requirements: RequirementMap) => {
    try {
      setIsLoading(true);
      
      // Apply requirements to all document types
      for (const documentType of DOCUMENT_TYPES) {
        const requirement = requirements[documentType.id.toLowerCase()];
        if (requirement && requirement !== 'hidden') {
          await updateDocumentRequirement(contractorId, documentType.id, requirement);
        }
      }
    } catch (err) {
      setError('Fehler beim Anwenden der Anforderungen');
      console.error('Error applying requirements:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const saveAll = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await updateConditionalAnswers(contractorId, conditionalAnswers);
      await updateOrgFlags(contractorId, orgFlags);
      await applyRequirementsToStore(derivedRequirements);

      return true;
    } catch (err) {
      setError('Fehler beim Speichern');
      console.error('Error saving all data:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setConditionalAnswers(DEFAULT_CONDITIONAL_ANSWERS);
    setOrgFlags({ hrRegistered: false });
  };

  return {
    // State
    conditionalAnswers,
    orgFlags,
    derivedRequirements,
    isLoading,
    error,
    
    // Actions
    updateAnswers,
    updateFlags,
    applyRequirementsToStore,
    saveAll,
    resetToDefaults,
    
    // Utils
    contractor,
  };
}