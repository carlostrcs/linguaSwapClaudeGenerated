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
// A language code is not always its country code (en→GB, ja→JP, sv→SE, uk→UA, …), so this is an
// explicit table rather than an algorithmic code→flag derivation, which would show wrong flags.
// Codes are open-ended (free-text on the entry form); anything absent here just renders no flag.
const FLAGS: Record<string, string> = {
  en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹',
  nl: '🇳🇱', pl: '🇵🇱', ru: '🇷🇺', uk: '🇺🇦', sv: '🇸🇪', no: '🇳🇴', da: '🇩🇰', fi: '🇫🇮',
  cs: '🇨🇿', sk: '🇸🇰', ro: '🇷🇴', hu: '🇭🇺', el: '🇬🇷', tr: '🇹🇷', bg: '🇧🇬', hr: '🇭🇷',
  ja: '🇯🇵', zh: '🇨🇳', ko: '🇰🇷', ar: '🇸🇦', he: '🇮🇱', hi: '🇮🇳', th: '🇹🇭', vi: '🇻🇳',
  id: '🇮🇩',
};

// BCP-47 locale used for Web Speech pronunciation (SpeechSynthesisUtterance.lang). The app's codes
// are bare 2-letter; a region tag helps the browser pick a voice for the right accent. Kept aligned
// with FLAGS so a language that shows a flag also pronounces with a sensible voice.
const SPEECH_LANGS: Record<string, string> = {
  en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-PT',
  nl: 'nl-NL', pl: 'pl-PL', ru: 'ru-RU', uk: 'uk-UA', sv: 'sv-SE', no: 'nb-NO', da: 'da-DK', fi: 'fi-FI',
  cs: 'cs-CZ', sk: 'sk-SK', ro: 'ro-RO', hu: 'hu-HU', el: 'el-GR', tr: 'tr-TR', bg: 'bg-BG', hr: 'hr-HR',
  ja: 'ja-JP', zh: 'zh-CN', ko: 'ko-KR', ar: 'ar-SA', he: 'he-IL', hi: 'hi-IN', th: 'th-TH', vi: 'vi-VN',
  id: 'id-ID',
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

/** BCP-47 locale for speech synthesis, or the bare code when unknown (codes are open-ended). */
export function speechLangFor(lang: string): string {
  return SPEECH_LANGS[lang?.toLowerCase()] ?? lang;
}
