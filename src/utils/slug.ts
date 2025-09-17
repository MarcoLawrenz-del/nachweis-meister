// German-aware slug generation utility

export function slugifyPreserveGerman(label: string): string {
  return label
    .trim()
    // Replace German umlauts with their equivalents
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    // Convert to lowercase
    .toLowerCase()
    // Replace spaces and non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-|-$/g, '');
}