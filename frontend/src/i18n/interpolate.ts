import type { Dictionary } from './dictionary';
import { DEFAULT_LANGUAGE, translations } from './translations';
import type { LanguageId } from './translations';

export type Vars = Record<string, string | number>;

/** Substitute `{placeholder}` tokens. An unknown name is left as-is so the gap is visible. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

/**
 * A standalone `t()` for a locale — the same lookup and fallback chain as `useI18n().t`, but
 * without React, so the build-time page generator renders exactly the strings the app would.
 */
export function translator(lang: LanguageId): (key: string, vars?: Vars) => string {
  const dict: Dictionary = translations[lang] ?? translations[DEFAULT_LANGUAGE];
  return (key, vars) =>
    interpolate(dict[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key, vars);
}
