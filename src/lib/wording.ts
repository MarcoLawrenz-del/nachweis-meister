import { WORDING } from '@/content/wording';

// Utility function to access WORDING with locale fallback
export function getWording(locale: 'de' | 'en' = 'de') {
  return (WORDING as any)[locale] || WORDING.de;
}

// Typed access for better IDE support
export function getLocalizedText(path: string, locale: 'de' | 'en' = 'de') {
  const words = getWording(locale);
  const keys = path.split('.');
  let result = words;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key as keyof typeof result];
    } else {
      // Fallback to German if path doesn't exist in current locale
      const germanWords = getWording('de');
      let fallback = germanWords;
      for (const fallbackKey of keys) {
        if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
          fallback = fallback[fallbackKey as keyof typeof fallback];
        } else {
          return path; // Return path as fallback if nothing found
        }
      }
      return fallback;
    }
  }
  
  return result;
}