import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Difficulty, PracticeMode, PracticeWord } from '../api/types';
import PracticeCard from './PracticeCard';
import type { CheckResult } from './PracticeCard';
import { isReinforcingMode } from '../lib/practiceModes';
import { useI18n } from '../i18n/I18nProvider';

export type { CheckResult } from './PracticeCard';

// In reinforcing modes (Learn New, Cram), a missed word is re-inserted this many cards ahead
// and may come back at most this many times, so you see it again soon without looping forever.
const REQUEUE_GAP = 3;
const MAX_REQUEUE = 2;

interface Props {
  words: PracticeWord[];
  difficulty: Difficulty;
  mode: PracticeMode;
  sourceLanguage: string;
  targetLanguage: string;
  /** Validate an answer. Real practice calls the API; the demo checks locally. */
  checkAnswer: (word: PracticeWord, answer: string) => Promise<CheckResult>;
  /** Fired once when the session finishes (real practice ends the session; demo prompts signup). */
  onComplete?: (score: number, total: number) => void;
  /** Restart — the parent returns to its setup screen. */
  onAgain: () => void;
  /** A caller-specific link/button for the done screen (e.g. "Back to libraries"). */
  backSlot: ReactNode;
}

/**
 * Runs a finite practice session card-by-card (the "playing" and "done" phases). Shared by the real
 * PracticePage and the no-account DemoPage. Reinforcing modes re-queue missed words so they recur
 * before the session ends. (The endless Journey mode uses JourneyRunner instead.)
 */
export default function PracticeRunner({
  words,
  difficulty,
  mode,
  sourceLanguage,
  targetLanguage,
  checkAnswer,
  onComplete,
  onAgain,
  backSlot,
}: Props) {
  const { t } = useI18n();
  // The play queue starts as the chosen words; reinforcing modes re-insert missed words into it.
  const [queue, setQueue] = useState<PracticeWord[]>(words);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const requeued = useRef<Record<number, number>>({}); // entryId -> times re-queued (capped)

  const reinforcing = isReinforcingMode(mode);
  const current = queue[index];

  // Whether this missed card will still be re-queued (so it is not really the last card).
  const willRequeue = (result: CheckResult) =>
    reinforcing && !result.isCorrect && (requeued.current[current.entryId] ?? 0) < MAX_REQUEUE;

  const onResult = (result: CheckResult) => {
    if (result.isCorrect) setCorrectCount((c) => c + 1);
  };

  const onAdvance = (result: CheckResult) => {
    // In reinforcing modes, a missed word is re-queued a few cards ahead (capped) so it comes
    // back before the session ends. Right answers (and non-reinforcing modes) just move on.
    let nextQueue = queue;
    if (willRequeue(result)) {
      requeued.current[current.entryId] = (requeued.current[current.entryId] ?? 0) + 1;
      const insertAt = Math.min(index + 1 + REQUEUE_GAP, queue.length);
      nextQueue = [...queue.slice(0, insertAt), current, ...queue.slice(insertAt)];
      setQueue(nextQueue);
    }

    if (index + 1 >= nextQueue.length) {
      setFinished(true);
      onComplete?.(correctCount, nextQueue.length);
      return;
    }
    setIndex((i) => i + 1);
  };

  // ---------- Done ----------
  if (finished) {
    return (
      <div className="page narrow">
        <div className="card done-card">
          <h1>{t('practice.complete')}</h1>
          <p className="score-big">
            {correctCount} / {queue.length}
          </p>
          <p className="muted">{t('practice.correctAnswers')}</p>
          <div className="form-actions center">
            <button type="button" className="btn btn-primary" onClick={onAgain}>
              {t('practice.again')}
            </button>
            {backSlot}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Playing ----------
  if (!current) return null;

  return (
    <div className="page narrow practice">
      <p className="practice-back">
        <button type="button" className="btn btn-link" onClick={onAgain}>
          {t('practice.backToSettings')}
        </button>
      </p>
      <div className="practice-progress">
        {t('practice.progress', { current: index + 1, total: queue.length, score: correctCount })}
      </div>
      <PracticeCard
        cardId={index}
        word={current}
        difficulty={difficulty}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        checkAnswer={checkAnswer}
        onResult={onResult}
        onAdvance={onAdvance}
        nextLabel={(result) =>
          index + 1 >= queue.length && !willRequeue(result) ? t('practice.finish') : t('practice.next')
        }
      />
    </div>
  );
}
