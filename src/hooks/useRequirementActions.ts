import { RequirementStatus } from '@/types/compliance';
import { isActionAllowed, isValidTransition } from '@/lib/stateTransitions';

// Hook to manage requirement actions and state transitions
export function useRequirementActions() {
  
  // Check if an action is allowed for a specific requirement status
  const canPerformAction = (status: RequirementStatus, action: string): boolean => {
    return isActionAllowed(status, action);
  };

  // Check if a state transition is valid
  const canTransition = (from: RequirementStatus, to: RequirementStatus): boolean => {
    return isValidTransition(from, to);
  };

  // Get allowed actions for a status
  const getAllowedActions = (status: RequirementStatus): string[] => {
    const actionMap: Record<RequirementStatus, string[]> = {
      missing: ['request_upload'],
      submitted: ['review', 'view_document'],
      in_review: ['approve', 'reject', 'view_document'],
      valid: ['view_document', 'renew'],
      expiring: ['request_renewal', 'view_document'],
      expired: ['request_upload'],
      rejected: ['request_correction']
    };

    return actionMap[status] || [];
  };

  // Execute state transition with validation
  const executeTransition = (
    currentStatus: RequirementStatus, 
    targetStatus: RequirementStatus,
    context?: any
  ): { success: boolean; error?: string } => {
    if (!canTransition(currentStatus, targetStatus)) {
      return {
        success: false,
        error: `Invalid transition from ${currentStatus} to ${targetStatus}`
      };
    }

    // Additional validation based on context
    if (targetStatus === 'valid' && !context?.valid_to) {
      return {
        success: false,
        error: 'Valid-to date is required for approval'
      };
    }

    if (targetStatus === 'rejected' && !context?.rejection_reason) {
      return {
        success: false,
        error: 'Rejection reason is required'
      };
    }

    return { success: true };
  };

  return {
    canPerformAction,
    canTransition,
    getAllowedActions,
    executeTransition
  };
}