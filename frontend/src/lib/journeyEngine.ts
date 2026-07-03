// Pure logic for the endless "Journey" practice mode (see components/JourneyRunner). The user works
// through the whole library little by little: an active set of words is drilled in repeated
// iterations until every word is "learned", at which point the set grows with the next words from
// the library. Kept free of React so the rules stay simple and testable.
import type { JourneyWord, PracticeWord } from '../api/types';

/** How many words the active set starts with, and how many are added each time it grows. */
export const JOURNEY_SET_SIZE = 20;

/**
 * Per-word progress within a Journey. `streak` is the run of consecutive correct answers ending at
 * the latest attempt — `streak >= 3` is exactly "the last 3 attempts were correct", which is why we
 * store it instead of the raw history (and it maps 1:1 to the persisted JourneyWord shape).
 */
export interface WordStat {
  attempts: number;
  correct: number;
  streak: number;
}

export const emptyStat = (): WordStat => ({ attempts: 0, correct: 0, streak: 0 });

/** Fold a new answer into a word's stats. */
export function recordStat(stat: WordStat | undefined, correct: boolean): WordStat {
  const base = stat ?? emptyStat();
  return {
    attempts: base.attempts + 1,
    correct: base.correct + (correct ? 1 : 0),
    streak: correct ? base.streak + 1 : 0,
  };
}

/** A word is learned once it has ≥3 attempts, ≥90% success, and its last 3 attempts were all correct. */
export function isWordLearned(stat: WordStat | undefined): boolean {
  if (!stat || stat.attempts < 3) return false;
  const rate = stat.correct / stat.attempts;
  return rate >= 0.9 && stat.streak >= 3;
}

/** Convert the in-memory stats map to/from the persisted JourneyWord[] shape. */
export function statsToWords(stats: Record<number, WordStat>): JourneyWord[] {
  return Object.entries(stats).map(([entryId, s]) => ({
    entryId: Number(entryId),
    attempts: s.attempts,
    correct: s.correct,
    streak: s.streak,
  }));
}

export function wordsToStats(words: JourneyWord[]): Record<number, WordStat> {
  const out: Record<number, WordStat> = {};
  for (const w of words) {
    out[w.entryId] = { attempts: w.attempts, correct: w.correct, streak: w.streak };
  }
  return out;
}

/** Times a word has been answered wrong — the ordering key for an iteration (most errors first). */
export function errorCount(stat: WordStat | undefined): number {
  return stat ? stat.attempts - stat.correct : 0;
}

/** Every word in the active set is learned (so it is time to add more words). */
export function allLearned(activeSet: PracticeWord[], stats: Record<number, WordStat>): boolean {
  return activeSet.length > 0 && activeSet.every((w) => isWordLearned(stats[w.entryId]));
}

/** How many words of the active set are currently learned. */
export function learnedCount(activeSet: PracticeWord[], stats: Record<number, WordStat>): number {
  return activeSet.filter((w) => isWordLearned(stats[w.entryId])).length;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Order the show-list for one iteration: shuffled for variety, then stable-sorted so the words with
 * the most errors come first (Array.sort is stable, so ties keep the shuffled order).
 *   includeLearned=true  → a post-grow review pass: every active word once, so already-learned words
 *                          get their single showing before they hibernate.
 *   includeLearned=false → normal drilling: only the not-yet-learned words. Learned words stay hidden
 *                          until the next grow (or until a failure makes them un-learned again).
 */
export function buildIteration(
  activeSet: PracticeWord[],
  stats: Record<number, WordStat>,
  includeLearned: boolean,
): PracticeWord[] {
  const pool = includeLearned ? activeSet : activeSet.filter((w) => !isWordLearned(stats[w.entryId]));
  return shuffle(pool).sort((a, b) => errorCount(stats[b.entryId]) - errorCount(stats[a.entryId]));
}

export interface NextRound {
  activeCount: number;
  iteration: PracticeWord[];
  banner: 'grew' | 'complete' | null;
}

/**
 * Decide the next iteration — used to start/resume and at the end of every iteration.
 *   - Whole active set learned → **grow**: a review pass showing the now-learned words once plus the
 *     newly added ones; or, if the library is exhausted, keep reviewing everything (complete).
 *   - Otherwise → drill only the words still to be learned (learned words hibernate).
 */
export function nextRound(
  library: PracticeWord[],
  activeCount: number,
  stats: Record<number, WordStat>,
): NextRound {
  const activeSet = library.slice(0, activeCount);
  if (allLearned(activeSet, stats)) {
    if (activeCount < library.length) {
      const grown = Math.min(activeCount + JOURNEY_SET_SIZE, library.length);
      return { activeCount: grown, iteration: buildIteration(library.slice(0, grown), stats, true), banner: 'grew' };
    }
    return { activeCount, iteration: buildIteration(activeSet, stats, true), banner: 'complete' };
  }
  return { activeCount, iteration: buildIteration(activeSet, stats, false), banner: null };
}
