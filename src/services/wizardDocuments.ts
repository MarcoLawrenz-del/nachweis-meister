import { setDocs, setContractorMeta } from '@/services/contractorDocs.store';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import { isCustomDoc } from '@/utils/customDocs';
import type { ContractorDocument } from '@/services/contractors';

/**
 * Creates documents for a contractor directly in the store with lastRequestedAt timestamp
 * This ensures that the documents immediately flow into statistics and "last requested" tracking
 */
export async function createDocumentsForContractor(
  contractorId: string,
  requirements: Record<string, "required" | "optional" | "hidden">,
  customDocLabels: Record<string, string> = {}
): Promise<void> {
  const documents: ContractorDocument[] = [];
  const now = new Date().toISOString();

  // Process all requirements (config + custom)
  for (const [docId, requirement] of Object.entries(requirements)) {
    if (requirement === "hidden") {
      // Skip hidden documents - they won't be created in the store
      continue;
    }

    const isCustomDocument = isCustomDoc(docId);
    
    // Get document label
    let docLabel: string;
    if (isCustomDocument) {
      docLabel = customDocLabels[docId] || docId.replace('custom:', '');
    } else {
      docLabel = DOCUMENT_TYPES.find(d => d.id === docId)?.label || docId;
    }

    // Create document
    const document: ContractorDocument = {
      contractorId,
      documentTypeId: docId,
      requirement,
      status: "missing",
      validUntil: null,
      rejectionReason: null,
      customName: isCustomDocument ? docLabel : undefined,
      label: isCustomDocument ? docLabel : undefined
    };

    documents.push(document);
  }

  // Save documents to store
  setDocs(contractorId, documents);

  // Set metadata with "last requested" timestamp so it flows into statistics immediately
  setContractorMeta(contractorId, {
    lastRequestedAt: now
  });

  console.log(`Created ${documents.length} documents for contractor ${contractorId} with lastRequestedAt: ${now}`);
}