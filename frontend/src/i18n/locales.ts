// The registry of UI locales. This is the ONE place a new language starts: add an entry here, add a
// matching dictionary under `dictionaries/`, and register it in `translations.ts`.
//
// Deliberately pure data (no DOM, no JSX) so the build-time SEO page generator can import it under
// `tsconfig.node.json` alongside the app. Keep it that way.
//
// The first six are the languages the curated decks
// (`backend/LinguaSwap.Api/Data/DefaultLibraries/*.json`) carry translations for. Polish is a full
// UI locale (app + homepage + guides) whose deck column is being backfilled; until it lands it is
// NOT in `content/learn.ts` `VOCAB_LOCALES`, so it gets no `/learn` vocabulary pages yet.

import { flagFor, speechLangFor } from '../lib/languages';

export interface Locale {
  /** Two-letter code — also the URL prefix and the `localStorage` value. */
  id: string;
  /** The language's name in its own language, for the picker. */
  label: string;
  /** The language's name in English, for slugs and internal copy. */
  englishName: string;
  /** BCP-47 tag for `<html lang>` and `hreflang`. */
  bcp47: string;
  /** Representative flag emoji. */
  flag: string;
}

function locale(id: string, label: string, englishName: string): Locale {
  return { id, label, englishName, bcp47: speechLangFor(id), flag: flagFor(id) };
}

export const LOCALES: readonly Locale[] = [
  locale('en', 'English', 'English'),
  locale('es', 'Español', 'Spanish'),
  locale('fr', 'Français', 'French'),
  locale('de', 'Deutsch', 'German'),
  locale('it', 'Italiano', 'Italian'),
  locale('pt', 'Português', 'Portuguese'),
  locale('pl', 'Polski', 'Polish'),
];

export const LOCALE_IDS: readonly string[] = LOCALES.map((l) => l.id);

export const DEFAULT_LOCALE = 'en';

export function localeById(id: string): Locale | undefined {
  return LOCALES.find((l) => l.id === id);
}

/** True when `value` is one of the supported locale ids. */
export function isLocaleId(value: string | null | undefined): boolean {
  return !!value && LOCALE_IDS.includes(value);
}
