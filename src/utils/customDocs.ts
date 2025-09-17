// Utility functions for custom documents

export function makeCustomDocId(name: string): string {
  // Create a slug from the name: lowercase, replace spaces with hyphens, remove special chars
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `custom:${slug}`;
}

export function isCustomDoc(id: string): boolean {
  return id.startsWith('custom:');
}

export function displayName(id: string, fallbackFromConfig: string, customName?: string): string {
  if (isCustomDoc(id)) {
    return customName || id.replace('custom:', '');
  }
  return fallbackFromConfig;
}

export function validateCustomDocName(name: string, existingDocs: Array<{ documentTypeId: string; customName?: string }>): string | null {
  if (name.length < 3) {
    return "Name muss mindestens 3 Zeichen lang sein";
  }
  
  // Check for duplicates against existing custom docs
  const existingCustomNames = existingDocs
    .filter(doc => isCustomDoc(doc.documentTypeId))
    .map(doc => doc.customName?.toLowerCase());
    
  if (existingCustomNames.includes(name.toLowerCase())) {
    return "Ein Dokument mit diesem Namen existiert bereits";
  }
  
  return null; // Valid
}