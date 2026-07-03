import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Difficulty, JourneyState, PracticeWord } from '../api/types';
import PracticeCard from './PracticeCard';
import type { CheckResult } from './PracticeCard';
import {
  JOURNEY_SET_SIZE,
  learnedCount,
  nextRound,
  recordStat,
  statsToWords,
  wordsToStats,
  type WordStat,
} from '../lib/journeyEngine';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  /** The whole library in order (the Journey selector / demo returns it start-to-end). */
  words: PracticeWord[];
  difficulty: Difficulty;
  sourceLanguage: string;
  targetLanguage: string;
  checkAnswer: (word: PracticeWord, answer: string) => Promise<CheckResult>;
  /** Saved progress to resume from (null/undefined = start fresh). */
  initialState?: JourneyState | null;
  /** Persist progress after each answer (fire-and-forget). */
  onPersist: (state: JourneyState) => void;
  /** Leave the endless session and return to the setup screen. */
  onExit: () => void;
  /** A caller-specific link/button (e.g. "Back to libraries"). */
  backSlot: ReactNode;
}

type Banner = 'grew' | 'complete' | null;

/**
 * The endless "Journey" runner: work through the whole library little by little. An active set is
 * drilled in repeated iterations (reshuffled each round, most-missed first) until every word is
 * learned, then the set grows with the next words from the library. There is no end screen — the
 * user leaves via the back links. All progress is per-session (see lib/journeyEngine).
 */
export default function JourneyRunner({
  words,
  difficulty,
  sourceLanguage,
  targetLanguage,
  checkAnswer,
  initialState,
  onPersist,
  onExit,
  backSlot,
}: Props) {
  const { t } = useI18n();
  // Resume from saved progress when present (clamp the active count to the current library size);
  // otherwise start a fresh set from the library's beginning. nextRound picks the opening iteration
  // (and grows straight away if a resumed set is already fully learned).
  const [resumed] = useState(initialState ?? null);
  const seedCount = resumed
    ? Math.min(Math.max(resumed.activeCount, 1), words.length)
    : Math.min(JOURNEY_SET_SIZE, words.length);
  const seedStats = resumed ? wordsToStats(resumed.words) : {};
  const [firstRound] = useState(() => nextRound(words, seedCount, seedStats));

  const [activeCount, setActiveCount] = useState(firstRound.activeCount);
  const [stats, setStats] = useState<Record<number, WordStat>>(seedStats);
  const [iteration, setIteration] = useState<PracticeWord[]>(firstRound.iteration);
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(1);
  const [step, setStep] = useState(0); // monotonic card key so each card mounts fresh
  const [banner, setBanner] = useState<Banner>(firstRound.banner);

  const activeSet = words.slice(0, activeCount);
  const current = iteration[pos];
  const learned = learnedCount(activeSet, stats);

  const onAdvance = (result: CheckResult) => {
    const nextStats = { ...stats, [current.entryId]: recordStat(stats[current.entryId], result.isCorrect) };
    setStats(nextStats);
    setStep((s) => s + 1);

    // Still in this iteration — just move to the next word.
    if (pos + 1 < iteration.length) {
      setPos((p) => p + 1);
      onPersist({ activeCount, words: statsToWords(nextStats) });
      return;
    }

    // End of an iteration: grow (review + new words), keep drilling the unlearned, or complete.
    const nr = nextRound(words, activeCount, nextStats);
    setActiveCount(nr.activeCount);
    setIteration(nr.iteration);
    setPos(0);
    setRound((r) => r + 1);
    setBanner(nr.banner);
    onPersist({ activeCount: nr.activeCount, words: statsToWords(nextStats) });
  };

  if (!current) return null;

  return (
    <div className="page narrow practice">
      <p className="practice-back">
        <button type="button" className="btn btn-link" onClick={onExit}>
          {t('practice.backToSettings')}
        </button>
      </p>
      <div className="practice-progress">
        <div>{t('practice.journeyLibrary', { learned, total: words.length })}</div>
        <div className="muted small">{t('practice.journeySet', { size: activeSet.length, round })}</div>
      </div>

      {banner === 'grew' && (
        <div className="alert journey-banner">{t('practice.journeyGrew', { size: activeSet.length })}</div>
      )}
      {banner === 'complete' && (
        <div className="alert journey-banner journey-complete">{t('practice.journeyComplete')}</div>
      )}

      <PracticeCard
        key={step}
        word={current}
        difficulty={difficulty}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        checkAnswer={checkAnswer}
        onAdvance={onAdvance}
        nextLabel={() => t('practice.next')}
      />

      <div className="form-actions center journey-exit">{backSlot}</div>
    </div>
  );
}
