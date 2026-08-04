// URL map for the hand-written guides.
//
// Only the paths live here, not the prose — the app needs to LINK to a guide (the landing footer)
// while the article text is build-time only and must never reach the client bundle. Sharing this
// map is what stops the app and the generator disagreeing about where a guide lives.
//
// Slugs are localized because the slug is a real ranking surface, and they are FROZEN: changing
// one orphans a URL that may already be indexed. Add a redirect rather than editing in place.
//
// Pure data — imported by `build/` under `tsconfig.node.json`, so no DOM and no JSX.

export const GUIDE_KEYS = ['spaced-repetition', 'leitner-boxes', 'how-many-words'] as const;

export type GuideKey = (typeof GUIDE_KEYS)[number];

/** The path segment standing in for "guides" in each language. */
const SECTION: Record<string, string> = {
  en: 'guides',
  es: 'guias',
  fr: 'guides',
  de: 'ratgeber',
  it: 'guide',
  pt: 'guias',
  pl: 'poradniki',
};

/** ASCII-only, accent-free: slugs stay readable and unambiguous in a URL bar and a log line. */
const SLUGS: Record<string, Record<GuideKey, string>> = {
  en: {
    'spaced-repetition': 'spaced-repetition',
    'leitner-boxes': 'leitner-boxes',
    'how-many-words': 'how-many-words',
  },
  es: {
    'spaced-repetition': 'repeticion-espaciada',
    'leitner-boxes': 'cajas-de-leitner',
    'how-many-words': 'cuantas-palabras',
  },
  fr: {
    'spaced-repetition': 'repetition-espacee',
    'leitner-boxes': 'boites-de-leitner',
    'how-many-words': 'combien-de-mots',
  },
  de: {
    'spaced-repetition': 'verteilte-wiederholung',
    'leitner-boxes': 'leitner-kartei',
    'how-many-words': 'wie-viele-woerter',
  },
  it: {
    'spaced-repetition': 'ripetizione-dilazionata',
    'leitner-boxes': 'scatole-di-leitner',
    'how-many-words': 'quante-parole',
  },
  pt: {
    'spaced-repetition': 'repeticao-espacada',
    'leitner-boxes': 'caixas-de-leitner',
    'how-many-words': 'quantas-palavras',
  },
  pl: {
    'spaced-repetition': 'powtorki-rozlozone-w-czasie',
    'leitner-boxes': 'system-leitnera',
    'how-many-words': 'ile-slow',
  },
};

/** `/guides/spaced-repetition` for English, `/es/guias/repeticion-espaciada` for Spanish, … */
export function guidePath(locale: string, key: GuideKey): string {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${prefix}/${SECTION[locale] ?? SECTION.en}/${(SLUGS[locale] ?? SLUGS.en)[key]}`;
}

/** Every guide path for a locale, in a stable order. */
export function guidePaths(locale: string): { key: GuideKey; path: string }[] {
  return GUIDE_KEYS.map((key) => ({ key, path: guidePath(locale, key) }));
}
