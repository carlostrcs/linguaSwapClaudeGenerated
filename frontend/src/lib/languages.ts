// Per-language practice metadata. Two things live here:
//   - specialChars: the keyboard the practice screen shows for a target language, so a user on a
//     non-native keyboard can insert diacritics (each is bound to a number key 1-9).
//   - caseSensitive: whether answers are graded with capitalization significant. This MIRRORS the
//     backend's authoritative `Services/LanguageRules` — keep the two in sync. The frontend copy
//     drives the Easy-mode live border and the no-account demo's local checking.

export interface LanguageProfile {
  /** Diacritics offered on the practice keypad, in number-key order (only the first 9 are used). */
  specialChars: string[];
  /** True where capitalization is grammatical (e.g. German nouns). */
  caseSensitive: boolean;
}

const PROFILES: Record<string, LanguageProfile> = {
  de: { specialChars: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'], caseSensitive: true },
  es: { specialChars: ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'], caseSensitive: false },
  fr: { specialChars: ['à', 'â', 'ç', 'é', 'è', 'ê', 'î', 'ï', 'ô'], caseSensitive: false },
  it: { specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ó', 'ù'], caseSensitive: false },
  pt: { specialChars: ['á', 'â', 'ã', 'à', 'ç', 'é', 'ê', 'í', 'ó'], caseSensitive: false },
};

// Representative country-flag emoji per language code, for quick visual identification in the UI.
const FLAGS: Record<string, string> = {
  en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹',
};

function profile(lang: string | undefined): LanguageProfile | undefined {
  return lang ? PROFILES[lang.toLowerCase()] : undefined;
}

/** Country-flag emoji for a language code, or '' when unknown (codes are open-ended). */
export function flagFor(lang: string): string {
  return FLAGS[lang?.toLowerCase()] ?? '';
}

/** "🇪🇸 es" — a code prefixed with its flag (just the bare code when no flag is known). */
export function langLabel(lang: string): string {
  const flag = flagFor(lang);
  return flag ? `${flag} ${lang}` : lang;
}

/** The keypad characters for a target language (capped at 9 — one per number key). */
export function specialCharsFor(lang: string): string[] {
  return profile(lang)?.specialChars.slice(0, 9) ?? [];
}

/** Whether answers in this language are graded case-sensitively. Mirrors backend LanguageRules. */
export function isCaseSensitiveLang(lang: string): boolean {
  return profile(lang)?.caseSensitive ?? false;
}
