// Facts computed from the actual deck data, per (target language, deck) pair.
//
// This is the main reason ~70 generated pages are not near-duplicates of one template. The word
// tables already differ — Spanish travel and German food share no rows — but without this the
// PROSE around them would be identical on every page, which is the shape search engines penalise
// as scaled/doorway content. These numbers make each page's opening paragraph specific to its own
// language pair, and they are useful to a learner rather than padding.

import { isCaseSensitiveLang, specialCharsFor } from '../../src/lib/languages';
import type { Deck } from '../decks';

/** Lower-case and strip diacritics, so `hôtel` and `hotel` compare as the same shape. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Classic Levenshtein distance. Inputs are single words or short phrases. */
function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, substitution);
    }
    previous = current;
  }
  return previous[b.length];
}

/** 1 = identical after folding, 0 = nothing in common. */
function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - distance(a, b) / longest;
}

export interface PairFacts {
  total: number;
  /** Rows where the two languages are spelled identically once accents are stripped. */
  identical: number;
  /** Rows that are identical or nearly so — recognisable on sight. */
  nearCognates: number;
  nearCognatePercent: number;
  /** Rows carrying a usage note. */
  withNotes: number;
  /** Diacritics a learner has to be able to type for this language. */
  diacritics: string[];
  /** True where capitalisation is graded, i.e. German. */
  caseSensitive: boolean;
  /** A few identical pairs, as concrete examples. */
  cognateExamples: { source: string; target: string }[];
}

// 0.7 catches real cognates that a stricter threshold misses (`map`/`mapa`, `music`/`música`).
// The length floor is what stops it becoming noise: on three-letter words almost anything scores
// well, and calling `car`/`coche` a cognate would be a visible falsehood on the page.
const NEAR_COGNATE_THRESHOLD = 0.7;
const NEAR_COGNATE_MIN_LENGTH = 4;

export function analysePair(deck: Deck, source: string, target: string): PairFacts {
  let identical = 0;
  let nearCognates = 0;
  let withNotes = 0;
  const cognateExamples: { source: string; target: string }[] = [];

  for (const entry of deck.entries) {
    const a = fold(entry.t[source]);
    const b = fold(entry.t[target]);

    if (entry.n) withNotes++;
    if (a === b) {
      identical++;
      nearCognates++;
      if (cognateExamples.length < 4) {
        cognateExamples.push({ source: entry.t[source], target: entry.t[target] });
      }
    } else if (
      Math.min(a.length, b.length) >= NEAR_COGNATE_MIN_LENGTH &&
      similarity(a, b) >= NEAR_COGNATE_THRESHOLD
    ) {
      nearCognates++;
    }
  }

  const total = deck.entries.length;
  return {
    total,
    identical,
    nearCognates,
    nearCognatePercent: Math.round((nearCognates / total) * 100),
    withNotes,
    diacritics: specialCharsFor(target),
    caseSensitive: isCaseSensitiveLang(target),
    cognateExamples,
  };
}
