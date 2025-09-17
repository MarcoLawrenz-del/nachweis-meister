// Unified compliance types for the new compliance engine
export type RequirementStatus = 
  | 'missing'
  | 'submitted' 
  | 'in_review'
  | 'valid'
  | 'rejected'
  | 'expiring'
  | 'expired';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'expiring_soon';

export type DocumentFrequency = 'once' | 'annual' | 'monthly';

export interface SubcontractorFlags {
  requires_employees: boolean | null;
  has_non_eu_workers: boolean | null;
  employees_not_employed_in_germany: boolean | null;
}

export interface ComputeRequirementsResponse {
  success: boolean;
  created_requirements: number;
  updated_requirements: number;
  warning_count: number;
  warnings: Array<{
    requirement_id: string;
    document_name: string;
    document_code: string;
    status: RequirementStatus;
    due_date?: string;
  }>;
  subcontractor_global_active: boolean;
  should_generate_warnings?: boolean;
  flags: SubcontractorFlags;
}