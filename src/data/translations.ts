import wordTranslations from './word-translations.json';

const TRANSLATIONS: Record<string, string> = wordTranslations;

export function getTranslation(word: string): string | undefined {
  return TRANSLATIONS[word.toLowerCase()];
}
