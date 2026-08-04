// UI translations. To add a language: add it to `locales.ts`, add a dictionary under
// `dictionaries/`, and register it in `dictionaries` below. Keys are grouped by area inside each
// dictionary; missing keys fall back to English, then to the key itself (see I18nProvider).
//
// `npm run i18n:check` asserts every locale has exactly the same keys as English.

import type { Dictionary } from './dictionary';
import { LOCALES } from './locales';
import en from './dictionaries/en';
import es from './dictionaries/es';
import fr from './dictionaries/fr';
import de from './dictionaries/de';
import it from './dictionaries/it';
import pt from './dictionaries/pt';
import pl from './dictionaries/pl';

const dictionaries = { en, es, fr, de, it, pt, pl };

export type LanguageId = keyof typeof dictionaries;

export const translations: Record<LanguageId, Dictionary> = dictionaries;

/** The picker options, in `LOCALES` order. Label is each language's own name. */
export const LANGUAGES: readonly { id: LanguageId; label: string }[] = LOCALES.map((l) => ({
  id: l.id as LanguageId,
  label: l.label,
}));

export const DEFAULT_LANGUAGE: LanguageId = 'en';
export const LANGUAGE_STORAGE_KEY = 'linguaswap.lang';
