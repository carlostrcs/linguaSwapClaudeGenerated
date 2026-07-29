// The URL vocabulary for the generated content pages: which decks become topics, which languages
// become targets, and what each is called in a path.
//
// Slugs are keyword-shaped rather than mirroring the internal deck names (`food` ->
// `restaurant-food`), because the slug is a real ranking surface. They are also FROZEN: changing
// one orphans an indexed URL, so `verifyTopics` fails the build if a deck's slug goes missing
// rather than letting it silently change.

import { LOCALES } from '../../src/i18n/locales';
import type { Deck } from '../decks';

/** How many rows of a deck each page publishes. */
export const SAMPLE_ROWS = 40;

/** A deck needs at least this many entries to justify a page of its own. */
export const MIN_DECK_ENTRIES = 120;

/** Deck slug -> URL slug. The keys are the filenames in Data/DefaultLibraries. */
export const TOPIC_SLUGS: Record<string, string> = {
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
};

/**
 * A short noun phrase for each deck, used in headings ("Spanish travel vocabulary").
 * Kept separate from the deck's display name, which is title-cased and reads oddly mid-sentence.
 */
export const TOPIC_NOUNS: Record<string, string> = {
  travel: 'travel',
  food: 'restaurant and food',
  dating: 'dating',
  work: 'business and work',
  smalltalk: 'small talk',
  shopping: 'shopping',
  health: 'health and emergency',
  slang: 'slang and idiom',
  home: 'household',
  nature: 'nature and animal',
  verbs: 'essential verb',
  adjectives: 'essential adjective',
  'common-300': '300 most common word',
  'common-1000': '1000 most common word',
};

export interface Target {
  /** Language code, e.g. `es`. */
  id: string;
  /** English name, e.g. `Spanish` — also the URL slug, lower-cased. */
  name: string;
  slug: string;
}

/**
 * Wave 1 is English-source only: pages are written in English, for an English speaker, about the
 * five other languages the decks cover. Adding a source locale means translating the page prose
 * AND the deck `notes` (which are English glosses of the English headword) — see the plan.
 */
export const SOURCE = 'en';

export const TARGETS: Target[] = LOCALES.filter((l) => l.id !== SOURCE).map((l) => ({
  id: l.id,
  name: l.englishName,
  slug: l.englishName.toLowerCase(),
}));

export function topicSlug(deck: Deck): string | null {
  return TOPIC_SLUGS[deck.slug] ?? null;
}

/** Decks big enough to publish. Guards against a future 40-word deck becoming a thin page. */
export function publishableDecks(decks: Deck[]): Deck[] {
  return decks.filter((deck) => topicSlug(deck) && deck.entries.length >= MIN_DECK_ENTRIES);
}

export function learnIndexPath(): string {
  return '/learn';
}

export function targetPath(target: Target): string {
  return `/learn/${target.slug}`;
}

export function topicPath(target: Target, deck: Deck): string {
  return `/learn/${target.slug}/${TOPIC_SLUGS[deck.slug]}`;
}
