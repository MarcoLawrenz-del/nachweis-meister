import { useEffect, useState } from "react";
import { getDocs, subscribe } from "@/services/contractorDocs.store";

export function useContractorDocuments(contractorId: string) {
  const [docs, setDocs] = useState(() => getDocs(contractorId));
  useEffect(() => subscribe(contractorId, () => setDocs(getDocs(contractorId))), [contractorId]);
  return docs;
}