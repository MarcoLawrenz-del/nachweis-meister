// Utility functions for custom documents
import { slugifyPreserveGerman } from './slug';

export function makeCustomDocId(name: string): string {
  // Create a German-aware slug from the name
  const slug = slugifyPreserveGerman(name);
  return `custom:${slug}`;
}

export function isCustomDoc(id: string): boolean {
  return id.startsWith('custom:');
}

export function displayName(id: string, fallbackFromConfig: string, customName?: string, label?: string): string {
  if (isCustomDoc(id)) {
    // Use label first (preserves umlauts), then customName, then slug as fallback
    return label || customName || id.replace('custom:', '');
  }
  return fallbackFromConfig;
}

export function validateCustomDocName(name: string, existingDocs: Array<{ documentTypeId: string; customName?: string }>): string | null {
  if (name.length < 3) {
    return "Name muss mindestens 3 Zeichen lang sein";
  }
  
  // Check for duplicates based on slug (type) within a contractor
  const slug = slugifyPreserveGerman(name);
  const existingCustomSlugs = existingDocs
    .filter(doc => isCustomDoc(doc.documentTypeId))
    .map(doc => doc.documentTypeId.replace('custom:', ''));
    
  if (existingCustomSlugs.includes(slug)) {
    return "Ein Dokument mit diesem Namen existiert bereits";
  }
  
  return null; // Valid
}