// Enhanced contractor types with validity and active status
export interface ContractorDocument {
  documentTypeId: string;
  status: 'missing' | 'submitted' | 'accepted' | 'rejected' | 'expired';
  requirement: 'required' | 'optional';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
  uploadedBy?: 'admin' | 'contractor';
  uploadedAt?: string;
  validUntil?: string | null;
  validitySource?: "user" | "auto" | "none";
  userUnknownExpiry?: boolean;
  rejectionReason?: string;
  customName?: string;
  label?: string;
}

export interface Contractor {
  id: string;
  companyName: string;
  contactName?: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  country?: string;
  notes?: string;
  active: boolean; // New field for active/inactive status
  createdAt: string;
  updatedAt?: string;
}