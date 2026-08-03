// URL map for the generated vocabulary pages, in every locale.
//
// Same split as `guides.ts`: only the paths live here, because the app needs to LINK to the
// vocabulary index (the landing footer) while the page prose is build-time only and must never
// reach the client bundle.
//
// Slugs are localized because the slug is a real ranking surface — `/es/aprender/frances/viajes`
// outranks `/es/learn/french/travel` for Spanish queries — and they are FROZEN: changing one
// orphans a URL that may already be indexed.
//
// Pure data. Imported by `build/` under `tsconfig.node.json`, so no DOM and no JSX.

/** The path segment standing in for "learn" in each language. */
const SECTION: Record<string, string> = {
  en: 'learn',
  es: 'aprender',
  fr: 'apprendre',
  de: 'lernen',
  it: 'imparare',
  pt: 'aprender',
};

/** How each language is spelled in a URL, per page locale. ASCII only. */
const LANGUAGE_SLUGS: Record<string, Record<string, string>> = {
  en: { en: 'english', es: 'spanish', fr: 'french', de: 'german', it: 'italian', pt: 'portuguese' },
  es: { en: 'ingles', es: 'espanol', fr: 'frances', de: 'aleman', it: 'italiano', pt: 'portugues' },
  fr: { en: 'anglais', es: 'espagnol', fr: 'francais', de: 'allemand', it: 'italien', pt: 'portugais' },
  de: { en: 'englisch', es: 'spanisch', fr: 'franzoesisch', de: 'deutsch', it: 'italienisch', pt: 'portugiesisch' },
  it: { en: 'inglese', es: 'spagnolo', fr: 'francese', de: 'tedesco', it: 'italiano', pt: 'portoghese' },
  pt: { en: 'ingles', es: 'espanhol', fr: 'frances', de: 'alemao', it: 'italiano', pt: 'portugues' },
};

/** Deck slug -> URL slug, per page locale. Keys are the filenames in Data/DefaultLibraries. */
const TOPIC_SLUGS: Record<string, Record<string, string>> = {
  en: {
    travel: 'travel',
    food: 'restaurant-food',
    dating: 'dating',
    work: 'work-business',
    smalltalk: 'small-talk',
    shopping: 'shopping',
    health: 'health-emergencies',
    slang: 'slang-idioms',
    home: 'home-everyday-objects',
    nature: 'nature-animals',
    verbs: 'essential-verbs',
    adjectives: 'essential-adjectives',
    'common-300': '300-most-common-words',
    'common-1000': '1000-most-common-words',
  },
  es: {
    travel: 'viajes',
    food: 'restaurante-comida',
    dating: 'citas',
    work: 'trabajo-negocios',
    smalltalk: 'conversacion-cotidiana',
    shopping: 'compras',
    health: 'salud-emergencias',
    slang: 'jerga-modismos',
    home: 'casa-objetos-cotidianos',
    nature: 'naturaleza-animales',
    verbs: 'verbos-esenciales',
    adjectives: 'adjetivos-esenciales',
    'common-300': '300-palabras-mas-comunes',
    'common-1000': '1000-palabras-mas-comunes',
  },
  fr: {
    travel: 'voyage',
    food: 'restaurant-nourriture',
    dating: 'rencontres',
    work: 'travail-affaires',
    smalltalk: 'conversation-courante',
    shopping: 'achats',
    health: 'sante-urgences',
    slang: 'argot-expressions',
    home: 'maison-objets-quotidiens',
    nature: 'nature-animaux',
    verbs: 'verbes-essentiels',
    adjectives: 'adjectifs-essentiels',
    'common-300': '300-mots-les-plus-courants',
    'common-1000': '1000-mots-les-plus-courants',
  },
  de: {
    travel: 'reisen',
    food: 'restaurant-essen',
    dating: 'dating',
    work: 'arbeit-beruf',
    smalltalk: 'small-talk',
    shopping: 'einkaufen',
    health: 'gesundheit-notfaelle',
    slang: 'slang-redewendungen',
    home: 'zuhause-alltagsgegenstaende',
    nature: 'natur-tiere',
    verbs: 'wichtige-verben',
    adjectives: 'wichtige-adjektive',
    'common-300': '300-haeufigste-woerter',
    'common-1000': '1000-haeufigste-woerter',
  },
  it: {
    travel: 'viaggi',
    food: 'ristorante-cibo',
    dating: 'appuntamenti',
    work: 'lavoro-affari',
    smalltalk: 'conversazione-quotidiana',
    shopping: 'shopping',
    health: 'salute-emergenze',
    slang: 'slang-modi-di-dire',
    home: 'casa-oggetti-quotidiani',
    nature: 'natura-animali',
    verbs: 'verbi-essenziali',
    adjectives: 'aggettivi-essenziali',
    'common-300': '300-parole-piu-comuni',
    'common-1000': '1000-parole-piu-comuni',
  },
  pt: {
    travel: 'viagem',
    food: 'restaurante-comida',
    dating: 'encontros',
    work: 'trabalho-negocios',
    smalltalk: 'conversa-do-dia-a-dia',
    shopping: 'compras',
    health: 'saude-emergencias',
    slang: 'girias-expressoes',
    home: 'casa-objetos-do-dia-a-dia',
    nature: 'natureza-animais',
    verbs: 'verbos-essenciais',
    adjectives: 'adjetivos-essenciais',
    'common-300': '300-palavras-mais-comuns',
    'common-1000': '1000-palavras-mais-comuns',
  },
};

function prefix(locale: string): string {
  return locale === 'en' ? '' : `/${locale}`;
}

/** `/learn`, `/es/aprender`, `/de/lernen`, … */
export function learnIndexPath(locale: string): string {
  return `${prefix(locale)}/${SECTION[locale] ?? SECTION.en}`;
}

/** `/learn/spanish`, `/es/aprender/ingles`, … */
export function learnTargetPath(locale: string, target: string): string {
  return `${learnIndexPath(locale)}/${(LANGUAGE_SLUGS[locale] ?? LANGUAGE_SLUGS.en)[target]}`;
}

/** `/learn/spanish/travel`, `/es/aprender/ingles/viajes`, … */
export function learnTopicPath(locale: string, target: string, deckSlug: string): string {
  const topic = (TOPIC_SLUGS[locale] ?? TOPIC_SLUGS.en)[deckSlug];
  return `${learnTargetPath(locale, target)}/${topic}`;
}

/** A deck has a page in this locale only if it has a slug here. */
export function hasTopicSlug(locale: string, deckSlug: string): boolean {
  return Boolean((TOPIC_SLUGS[locale] ?? {})[deckSlug]);
}

export function languageSlug(locale: string, target: string): string {
  return (LANGUAGE_SLUGS[locale] ?? LANGUAGE_SLUGS.en)[target];
}
