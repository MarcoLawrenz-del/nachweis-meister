import { RequirementStatus } from '@/types/compliance';

// Define valid state transitions for requirements
export const VALID_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]> = {
  missing: ['submitted'], // Upload sets to submitted
  submitted: ['in_review', 'missing'], // Reviewer opens or reset
  in_review: ['valid', 'rejected'], // Review outcome
  valid: ['expiring', 'expired'], // Time-based transitions
  expiring: ['expired', 'valid'], // Time-based or renewed
  expired: ['missing'], // Reset for new upload
  rejected: ['missing'], // Reset for correction
};

// Check if a state transition is valid
export function isValidTransition(from: RequirementStatus, to: RequirementStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Get next possible states from current state
export function getNextStates(currentState: RequirementStatus): RequirementStatus[] {
  return VALID_TRANSITIONS[currentState] ?? [];
}

// Get state transition reason/trigger
export function getTransitionTrigger(from: RequirementStatus, to: RequirementStatus): string {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid transition from ${from} to ${to}`);
  }

  const transitions: Record<string, string> = {
    'missing->submitted': 'Public upload completed',
    'submitted->in_review': 'Reviewer opened document',
    'submitted->missing': 'Reset by admin',
    'in_review->valid': 'Document approved by reviewer',
    'in_review->rejected': 'Document rejected by reviewer',
    'valid->expiring': 'Document approaching expiry date',
    'valid->expired': 'Document has expired',
    'expiring->expired': 'Document has expired',
    'expiring->valid': 'Document renewed before expiry',
    'expired->missing': 'Reset for new upload',
    'rejected->missing': 'Reset for correction'
  };

  return transitions[`${from}->${to}`] ?? 'Unknown transition';
}

// Check if an action is allowed for current state
export function isActionAllowed(state: RequirementStatus, action: string): boolean {
  const allowedActions: Record<RequirementStatus, string[]> = {
    missing: ['request_upload', 'view_details'],
    submitted: ['review', 'view_document', 'reset'],
    in_review: ['review', 'view_document', 'approve', 'reject'],
    valid: ['view_document', 'renew'],
    expiring: ['view_document', 'request_renewal'],
    expired: ['request_upload', 'view_details'],
    rejected: ['request_correction', 'view_details']
  };

  return allowedActions[state]?.includes(action) ?? false;
}

// Get human-readable state descriptions
export function getStateDescription(state: RequirementStatus): string {
  const descriptions: Record<RequirementStatus, string> = {
    missing: 'Dokument fehlt und muss hochgeladen werden',
    submitted: 'Dokument wurde eingereicht und wartet auf Prüfung',
    in_review: 'Dokument wird derzeit geprüft',
    valid: 'Dokument ist gültig und genehmigt',
    expiring: 'Dokument läuft bald ab und muss erneuert werden',
    expired: 'Dokument ist abgelaufen',
    rejected: 'Dokument wurde abgelehnt und muss korrigiert werden'
  };

  return descriptions[state] ?? 'Unbekannter Status';
}