// Loads and validates the committed deck snapshot (`frontend/content/decks.json`).
//
// The build reads ONLY this file — never `../backend`. See `scripts/lib/decks.mjs` for why.

import { readFileSync } from 'node:fs';

export const DECK_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt'] as const;

export interface DeckEntry {
  /** Translations, keyed by language code. Every DECK_LANGS key is guaranteed present. */
  t: Record<string, string>;
  /** Usage note. English prose glossing the English headword. */
  n?: string;
}

export interface Deck {
  slug: string;
  name: string;
  description: string;
  entries: DeckEntry[];
}

export interface DeckSnapshot {
  generatedAt: string;
  sourceHash: string;
  decks: Deck[];
}

/**
 * Parse + validate. Throws on anything malformed: a generated page built from half-valid data is
 * worse than a failed build, because it deploys and quietly ranks for nothing.
 *
 * Note the deck *count* is deliberately not asserted — the backend must be able to add a deck
 * without breaking the frontend deploy. Unknown slugs are handled where pages are generated.
 */
export function loadDecks(path: string): DeckSnapshot {
  let parsed: DeckSnapshot;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8')) as DeckSnapshot;
  } catch (cause) {
    throw new Error(
      `Could not read ${path}. Run: npm --prefix frontend run content:sync\n  ${String(cause)}`,
    );
  }

  if (!Array.isArray(parsed.decks) || parsed.decks.length === 0) {
    throw new Error(`${path}: no decks`);
  }
  if (!parsed.generatedAt || !parsed.sourceHash) {
    throw new Error(`${path}: missing generatedAt / sourceHash`);
  }

  for (const deck of parsed.decks) {
    if (!deck.slug || !deck.name) throw new Error(`${path}: a deck is missing slug or name`);
    if (!Array.isArray(deck.entries) || deck.entries.length === 0) {
      throw new Error(`${path}: deck "${deck.slug}" has no entries`);
    }
    for (const [i, entry] of deck.entries.entries()) {
      for (const lang of DECK_LANGS) {
        if (!entry.t?.[lang]) {
          throw new Error(`${path}: deck "${deck.slug}" entry ${i} is missing "${lang}"`);
        }
      }
    }
  }

  // Deterministic order regardless of how the snapshot was written.
  parsed.decks.sort((a, b) => a.slug.localeCompare(b.slug));
  return parsed;
}

export function totalEntries(snapshot: DeckSnapshot): number {
  return snapshot.decks.reduce((n, deck) => n + deck.entries.length, 0);
}
