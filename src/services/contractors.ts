export async function seedDocumentsForContractor(contractorId: string, packageId: string) {
  const items = await getPackageItems(packageId);
  return Promise.all(items.map(it => createContractorDocument({
    contractorId,
    documentTypeId: it.documentTypeId,
    status: "missing" as const,
  })));
}

export async function getPackageItems(packageId: string){
  // TODO: ersetzen durch echte DB-Abfrage; bis dahin Mock je Paket
  if (packageId === "Minimal") return [{ documentTypeId: "haftpflicht" }, { documentTypeId: "freistellungsbescheid" }];
  if (packageId === "Erweitert") return [
    { documentTypeId: "haftpflicht" }, { documentTypeId: "freistellungsbescheid" }, { documentTypeId: "gewerbeanmeldung" }, { documentTypeId: "unbedenklichkeitsbescheinigung" }
  ];
  // Standard
  return [{ documentTypeId: "haftpflicht" }, { documentTypeId: "freistellungsbescheinigunq" /*sic fix later*/ }, { documentTypeId: "gewerbeanmeldung" }];
}

export async function createContractorDocument(input: { contractorId:string; documentTypeId:string; status:"missing"|"submitted"|"expiring"|"expired"; }){
  console.info("[mock] createContractorDocument", input);
  return input;
}