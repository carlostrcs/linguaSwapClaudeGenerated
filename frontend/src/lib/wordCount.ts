// Display helper for the featured shelf.
//
// Curated decks land on whatever size their topic actually supports (169, 237, 964…),
// because a themed topic runs out of genuine vocabulary and padding it would mean
// shipping words that don't belong. Rounding the DISPLAYED count keeps the shelf tidy
// without deleting real content: 169 shows as "160+".
//
// Always rounds DOWN, so the figure never overstates what the deck contains. Exact
// multiples of ten are shown as-is (200 is "200 words", not the misleading "200+"),
// and small decks are never rounded — an 8-word taster must not read "0+".

const STEP = 10;
const MIN_TO_ROUND = STEP * 2;

export interface DisplayCount {
  /** The number to show — floored to a round figure when `approx` is true. */
  count: number;
  /** True when the real count was rounded down, i.e. render it with a "+". */
  approx: boolean;
}

export function displayWordCount(actual: number): DisplayCount {
  if (actual < MIN_TO_ROUND) return { count: actual, approx: false };
  const floored = Math.floor(actual / STEP) * STEP;
  return { count: floored, approx: floored !== actual };
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** The word-count badge shown on a featured card, rounded down and localised. */
export function featuredWordCount(t: Translate, actual: number): string {
  const { count, approx } = displayWordCount(actual);
  if (approx) return t('libraries.wordsApprox', { count });
  return t(count === 1 ? 'libraries.word' : 'libraries.words', { count });
}
