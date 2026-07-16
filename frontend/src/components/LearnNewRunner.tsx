import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Difficulty, PracticeWord } from '../api/types';
import PracticeCard from './PracticeCard';
import type { CheckResult } from './PracticeCard';
import SpeakButton from './SpeakButton';
import { primaryAnswer } from '../lib/demo/demoEngine';
import { learnedCount, nextRound, recordStat, type WordStat } from '../lib/journeyEngine';
import { langLabel } from '../lib/languages';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  /** The fresh batch of never-seen words to learn this session (the Learn New selector's picks). */
  words: PracticeWord[];
  difficulty: Difficulty;
  sourceLanguage: string;
  targetLanguage: string;
  checkAnswer: (word: PracticeWord, answer: string) => Promise<CheckResult>;
  /** Leave the endless session and return to the setup screen (the caller ends the session). */
  onExit: () => void;
  /** A caller-specific link/button (e.g. "Back to libraries"). */
  backSlot: ReactNode;
}

type Phase = 'preview' | 'drill';

/**
 * The Learn New runner: first a **preview pass** flipping through the batch's words and their
 * translations (study, no typing), then **endless drilling** of that same batch until every word is
 * learned. There is no end screen — the user leaves via the back links, and can keep drilling as
 * long as they like. Reuses the Journey learned-tracking (lib/journeyEngine), but the active set is
 * the whole fixed batch and never grows.
 */
export default function LearnNewRunner({
  words,
  difficulty,
  sourceLanguage,
  targetLanguage,
  checkAnswer,
  onExit,
  backSlot,
}: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('preview');
  const [previewPos, setPreviewPos] = useState(0);

  // Drill state (mirrors JourneyRunner, but the active set is the whole batch — activeCount never
  // grows, so nextRound only ever drills the not-yet-learned words or, once all are learned, keeps
  // running a review pass of everything with the "complete" banner up).
  const [firstRound] = useState(() => nextRound(words, words.length, {}));
  const [stats, setStats] = useState<Record<number, WordStat>>({});
  const [iteration, setIteration] = useState<PracticeWord[]>(firstRound.iteration);
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(1);
  const [step, setStep] = useState(0); // monotonic card key so each card mounts fresh
  const [complete, setComplete] = useState(firstRound.banner === 'complete');

  const back = (
    <p className="practice-back">
      <button type="button" className="btn btn-link" onClick={onExit}>
        {t('practice.backToSettings')}
      </button>
    </p>
  );

  // ---------- Preview: flip through each word + its translation, then start drilling ----------
  if (phase === 'preview') {
    const word = words[previewPos];
    if (!word) return null;
    const answer = primaryAnswer(word.acceptedAnswer);
    const last = previewPos + 1 >= words.length;
    const startDrilling = () => setPhase('drill');

    return (
      <div className="page narrow practice">
        {back}
        <div className="practice-progress">
          <div>{t('practice.learnNewPreviewTitle')}</div>
          <div className="muted small">
            {t('practice.learnNewPreviewProgress', { current: previewPos + 1, total: words.length })}
          </div>
        </div>

        <div className="card practice-card">
          <div className="prompt-label">
            {langLabel(sourceLanguage)} → {langLabel(targetLanguage)}
          </div>
          <div className="prompt-word-row">
            <span className="prompt-word">{word.prompt}</span>
            <SpeakButton text={word.prompt} lang={sourceLanguage} />
          </div>
          {word.notes && <div className="prompt-note">{word.notes}</div>}

          <div className="preview-answer">
            <div className="preview-answer-label">{langLabel(targetLanguage)}</div>
            <div className="prompt-word-row">
              <span className="prompt-word">{answer}</span>
              <SpeakButton text={answer} lang={targetLanguage} />
            </div>
          </div>

          <div className="preview-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => (last ? startDrilling() : setPreviewPos((p) => p + 1))}
            >
              {last ? t('practice.learnNewStartPractice') : t('practice.next')}
            </button>
            <button type="button" className="btn btn-link" onClick={startDrilling}>
              {t('practice.learnNewSkipPreview')}
            </button>
          </div>
        </div>

        <div className="form-actions center journey-exit">{backSlot}</div>
      </div>
    );
  }

  // ---------- Drill: loop the batch until every word is learned (endless) ----------
  const current = iteration[pos];
  const learned = learnedCount(words, stats);

  const onAdvance = (result: CheckResult) => {
    const nextStats = { ...stats, [current.entryId]: recordStat(stats[current.entryId], result.isCorrect) };
    setStats(nextStats);
    setStep((s) => s + 1);

    // Still in this iteration — just move to the next word.
    if (pos + 1 < iteration.length) {
      setPos((p) => p + 1);
      return;
    }

    // End of an iteration: re-drill the still-unlearned words, or (all learned) run a review pass.
    const nr = nextRound(words, words.length, nextStats);
    setIteration(nr.iteration);
    setPos(0);
    setRound((r) => r + 1);
    setComplete(nr.banner === 'complete');
  };

  if (!current) return null;

  return (
    <div className="page narrow practice">
      {back}
      <div className="practice-progress">
        <div>{t('practice.learnNewProgress', { learned, total: words.length })}</div>
        <div className="muted small">{t('practice.learnNewRound', { round })}</div>
      </div>

      {complete && (
        <div className="alert journey-banner journey-complete">
          {t('practice.learnNewComplete', { total: words.length })}
        </div>
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
