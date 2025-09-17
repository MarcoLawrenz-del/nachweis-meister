export async function seedDocumentsForContractor(contractorId: string, packageId: string){
  const items = await getPackageItems(packageId);
  // Idempotenz: keine Duplikate erzeugen (Stub: Memory-Markierung pro (contractorId, documentTypeId))
  const created = [];
  for (const it of items) {
    const key = `${contractorId}:${it.documentTypeId}`;
    if (!(globalThis as any).__DOC_SEED__) (globalThis as any).__DOC_SEED__ = new Set<string>();
    const seen = (globalThis as any).__DOC_SEED__ as Set<string>;
    if (!seen.has(key)) {
      console.info("[mock] createContractorDocument", { contractorId, documentTypeId: it.documentTypeId, status: "missing" });
      seen.add(key);
      created.push(it);
    }
  }
  console.info("[mock] seeded docs", { contractorId, packageId, count: created.length });
  return created;
}

export async function getPackageItems(packageId: string){
  if (packageId === "Minimal") return [{ documentTypeId: "haftpflicht" }, { documentTypeId: "freistellungsbescheid" }];
  if (packageId === "Erweitert") return [
    { documentTypeId: "haftpflicht" }, { documentTypeId: "freistellungsbescheid" }, { documentTypeId: "gewerbeanmeldung" }, { documentTypeId: "unbedenklichkeitsbescheinigung" }
  ];
  return [{ documentTypeId: "haftpflicht" }, { documentTypeId: "freistellungsbescheinigung" }, { documentTypeId: "gewerbeanmeldung" }];
}
