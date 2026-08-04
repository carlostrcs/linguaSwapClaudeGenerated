import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, translations } from './translations';
import type { LanguageId } from './translations';
// Shared with the build-time page generator, so prerendered copy interpolates identically.
import { interpolate } from './interpolate';
import type { Vars } from './interpolate';

interface I18nContextValue {
  lang: LanguageId;
  setLang: (lang: LanguageId) => void;
  /** Translate a key, with optional {placeholder} substitution. Falls back to English, then the key. */
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** First supported language among the browser's preferences (matched on the primary subtag, e.g. `es-ES` → `es`). */
function browserLang(): LanguageId | null {
  const prefs = navigator.languages ?? [navigator.language];
  for (const pref of prefs) {
    if (!pref) continue;
    const primary = pref.toLowerCase().split('-')[0];
    if (primary in translations) return primary as LanguageId;
  }
  return null;
}

/** The locale named by the URL, if any — either a `/es/…` path prefix or a `?lang=es` query. */
function urlLang(): LanguageId | null {
  const prefix = window.location.pathname.split('/')[1];
  if (prefix && prefix in translations) return prefix as LanguageId;
  const query = new URLSearchParams(window.location.search).get('lang');
  if (query && query in translations) return query as LanguageId;
  return null;
}

function initialLang(): LanguageId {
  // The URL wins: the generated marketing pages are locale-prefixed static HTML and link into the
  // app with `?lang=`, so a visitor who arrived in French must not be dropped into English.
  // Then an explicit stored choice (Account settings), then the browser, then English.
  const fromUrl = urlLang();
  if (fromUrl) return fromUrl;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && stored in translations) return stored as LanguageId;
  return browserLang() ?? DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageId>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    // Mirror the current language into localStorage on every change — including the browser-derived
    // initial one that setLang never sees — so api/client.ts can read it for the X-UI-Language
    // header on the very first request.
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, [lang]);

  // A locale handed over in the URL becomes the stored preference, so it survives the next
  // navigation (the `?lang=` is gone once the user clicks anywhere inside the app).
  useEffect(() => {
    const fromUrl = urlLang();
    if (fromUrl) localStorage.setItem(LANGUAGE_STORAGE_KEY, fromUrl);
  }, []);

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
