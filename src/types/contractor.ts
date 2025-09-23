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
  validitySource?: "user" | "auto" | "none" | "admin";
  userUnknownExpiry?: boolean;
  rejectionReason?: string;
  customName?: string;
  label?: string;
  file?: {
    url: string;            // DataURL (Demo) or Blob-URL
    name: string;
    size?: number;
    mime?: string;          // 'application/pdf', 'image/jpeg', ...
    pages?: number;         // falls PDF ermittelt
    uploadedAtISO: string;
    uploadedBy: "subcontractor" | "admin";
    source: "public" | "admin";
  };
  review?: {
    status: "submitted" | "accepted" | "rejected";
    reviewedAtISO?: string;
    reviewedBy?: string;    // Session-E-Mail
    reason?: string;        // Pflicht bei 'rejected'
  };
  history: Array<{
    tsISO: string;
    action: "uploaded"|"accepted"|"rejected"|"replaced"|"validity_changed";
    by: "subcontractor" | string; // E-Mail für Admin
    meta?: Record<string, any>;
  }>;
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