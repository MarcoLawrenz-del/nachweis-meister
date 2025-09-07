export interface Subcontractor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  documents: DocumentStatus;
  createdAt: string;
  lastUpdated: string;
}

export interface DocumentStatus {
  freistellungsbescheinigung: DocumentInfo;
  umsatzsteuer: DocumentInfo;
  sokaBau: DocumentInfo;
  bgBau: DocumentInfo;
  handwerksrolle: DocumentInfo;
  a1Bescheinigung: DocumentInfo;
  betriebshaftpflicht: DocumentInfo;
}

export interface DocumentInfo {
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  expiryDate?: string;
  uploadDate?: string;
  fileName?: string;
}

export const DOCUMENT_TYPES = {
  freistellungsbescheinigung: 'Freistellungsbescheinigung §48b EStG',
  umsatzsteuer: 'USt 1 TG §13b UStG',
  sokaBau: 'SOKA-BAU-Bescheinigung',
  bgBau: 'BG BAU-Unbedenklichkeit',
  handwerksrolle: 'Handwerksrolle/Gewerbe',
  a1Bescheinigung: 'A1 bei Entsendung',
  betriebshaftpflicht: 'Betriebshaftpflicht',
} as const;