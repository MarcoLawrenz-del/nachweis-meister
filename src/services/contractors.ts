// P2: Extended types for tri-state requirements and document status
export type Requirement = "required" | "optional" | "hidden";
export type DocStatus = "missing" | "submitted" | "in_review" | "accepted" | "rejected" | "expired";

export type ContractorDocument = {
  contractorId: string;
  documentTypeId: string;
  requirement: Requirement;
  status: DocStatus;
  validUntil?: string | null;
  rejectionReason?: string | null;
};

// Map der (vorläufig) konfigurierten Anforderungen je Paket:
export type PackageProfile = Record<string, Requirement>;
export const PACKAGE_PROFILES: Record<string, PackageProfile> = {
  Standard: { 
    haftpflicht: "required", 
    freistellungsbescheinigung: "required", 
    gewerbeanmeldung: "optional" 
  },
  Minimal: { 
    haftpflicht: "required", 
    freistellungsbescheinigung: "required", 
    gewerbeanmeldung: "hidden" 
  },
  Erweitert: { 
    haftpflicht: "required", 
    freistellungsbescheinigung: "required", 
    gewerbeanmeldung: "optional", 
    unbedenklichkeitsbescheinigung: "optional" 
  },
};

export async function seedDocumentsForContractor(contractorId: string, packageId: string) {
  const profile = PACKAGE_PROFILES[packageId] ?? {};
  const created: ContractorDocument[] = [];
  const seen = ((globalThis as any).__DOC_SEED__ ??= new Set<string>()) as Set<string>;
  
  for (const [documentTypeId, requirement] of Object.entries(profile)) {
    const key = `${contractorId}:${documentTypeId}`;
    if (seen.has(key)) continue;
    
    created.push({ 
      contractorId, 
      documentTypeId, 
      requirement, 
      status: "missing", 
      validUntil: null, 
      rejectionReason: null 
    });
    seen.add(key);
    
    console.info("[mock] createContractorDocument", { 
      contractorId, 
      documentTypeId, 
      status: "missing", 
      requirement 
    });
  }
  
  console.info("[mock] seeded docs", { 
    contractorId, 
    packageId, 
    count: created.length 
  });
  
  return created;
}

export async function setDocumentStatus(input: { 
  contractorId: string; 
  documentTypeId: string; 
  status: DocStatus; 
  validUntil?: string | null; 
  reason?: string | null; 
}) {
  console.info("[mock] setDocumentStatus", input);
  return input;
}
