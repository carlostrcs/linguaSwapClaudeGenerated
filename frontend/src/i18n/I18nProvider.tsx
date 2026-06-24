import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, translations } from './translations';
import type { LanguageId } from './translations';

type Vars = Record<string, string | number>;

interface I18nContextValue {
  lang: LanguageId;
  setLang: (lang: LanguageId) => void;
  /** Translate a key, with optional {placeholder} substitution. Falls back to English, then the key. */
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLang(): LanguageId {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored && stored in translations ? (stored as LanguageId) : DEFAULT_LANGUAGE;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageId>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: LanguageId) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const template = translations[lang][key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
      return interpolate(template, vars);
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
