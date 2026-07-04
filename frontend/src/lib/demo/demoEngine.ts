// Client-side mirrors of the backend practice rules, so the no-account demo can run a full
// practice session in the browser without hitting the (JWT-protected) API. Each function below
// matches its backend counterpart so the demo behaves exactly like real practice:
//   - normalize / isCorrect  -> Services/AnswerChecker.cs
//   - buildHint              -> Services/HintService.cs
//   - applyLeitner           -> Services/LeitnerService.cs
import type { Difficulty, EntryDto, PracticeMode, PracticeWord } from '../../api/types';

// Mirror of AnswerChecker.Normalize: trim + accent-SENSITIVE (NFC). Case-insensitive by default,
// but case-significant when `caseSensitive` is set (capitalization languages — see lib/languages).
export function normalize(value: string, caseSensitive = false): string {
  const nfc = value.normalize('NFC').trim();
  return caseSensitive ? nfc : nfc.toLowerCase();
}

// Mirror of AnswerChecker.SplitAcceptable: expected text may hold comma-separated answers.
function splitAcceptable(expected: string): string[] {
  return expected
    .split(',')
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

// Mirror of AnswerChecker.PrimaryAnswer: the first acceptable option drives hints and length.
export function primaryAnswer(expected: string): string {
  return splitAcceptable(expected)[0] ?? expected.trim();
}

// Mirror of AnswerChecker.IsCorrect: any acceptable option matching (normalised) is correct.
export function isCorrect(expected: string, actual: string, caseSensitive = false): boolean {
  const normalizedActual = normalize(actual, caseSensitive);
  return splitAcceptable(expected).some((option) => normalize(option, caseSensitive) === normalizedActual);
}

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

// Mirror of HintService.BuildHint: Easy reveals every other letter, Medium only the first,
// Hard reveals nothing. Spaces/punctuation are always shown so word boundaries stay visible.
export function buildHint(answer: string, difficulty: Difficulty): string {
  if (difficulty === 'Hard') return '';
  let out = '';
  let letterIndex = 0;
  for (const ch of answer) {
    if (!LETTER_OR_DIGIT.test(ch)) {
      out += ch;
      continue;
    }
    const reveal = difficulty === 'Easy' ? letterIndex % 2 === 0 : letterIndex === 0;
    out += reveal ? ch : '_';
    letterIndex += 1;
  }
  return out;
}

const MAX_BOX = 5;

// Mirror of LeitnerService box progression: correct climbs a box (capped at 5), wrong resets to 1.
export function applyLeitner(box: number, correct: boolean): number {
  if (correct) return Math.min((box || 1) + 1, MAX_BOX);
  return 1;
}

export function isMastered(box: number): boolean {
  return box >= MAX_BOX;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const SESSION_SIZE = 20;

// Client-side mirror of Services/PracticeSelectors. The demo only tracks a box level per word
// (no review timestamps), so SmartReview here is a simple shuffle rather than due-first; the other
// modes match their selectors. `boxes` maps entryId -> box for this direction (absent = never seen).
export function buildDemoWords(
  entries: EntryDto[],
  source: string,
  target: string,
  difficulty: Difficulty,
  mode: PracticeMode,
  boxes: Record<number, number> = {},
): PracticeWord[] {
  const candidates = entries
    .map((entry) => {
      const prompt = entry.translations.find((tr) => tr.languageCode === source)?.text;
      const answer = entry.translations.find((tr) => tr.languageCode === target)?.text;
      if (!prompt || !answer) return null;
      return { entry, prompt, answer, box: boxes[entry.id] as number | undefined };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  let chosen: typeof candidates;
  switch (mode) {
    case 'LearnNew': // only never-seen words
      chosen = shuffle(candidates.filter((c) => c.box === undefined)).slice(0, SESSION_SIZE);
      break;
    case 'Weak': // seen words, lowest box first (demo has no incorrect-count tiebreak)
      chosen = shuffle(
        [...candidates.filter((c) => c.box !== undefined)]
          .sort((a, b) => (a.box ?? 0) - (b.box ?? 0))
          .slice(0, SESSION_SIZE),
      );
      break;
    case 'Cram': // whole library, no cap
      chosen = shuffle(candidates);
      break;
    case 'Journey': // whole library in order (JourneyRunner manages the active set + looping)
      chosen = candidates;
      break;
    default: // SmartReview
      chosen = shuffle(candidates).slice(0, SESSION_SIZE);
  }

  return chosen.map((c) => {
    const primary = primaryAnswer(c.answer);
    return {
      entryId: c.entry.id,
      prompt: c.prompt,
      hint: buildHint(primary, difficulty),
      answerLength: difficulty === 'Hard' ? 0 : primary.length,
      // Easy sends the answer for the live border; Learn New also sends it (all difficulties) so its
      // preview pass can show each translation. Mirrors PracticeController.Start.
      expectedAnswer: difficulty === 'Easy' || mode === 'LearnNew' ? primary : null,
      notes: c.entry.notes ?? null,
    };
  });
}

// The languages available to practise in a set of entries (codes that appear in translations).
export function availableLanguages(entries: EntryDto[]): string[] {
  const set = new Set<string>();
  entries.forEach((entry) => entry.translations.forEach((tr) => set.add(tr.languageCode)));
  return [...set].sort();
}
