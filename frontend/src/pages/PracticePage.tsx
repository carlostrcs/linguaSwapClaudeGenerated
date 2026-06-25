import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listEntries } from '../api/entries';
import { getLibrary } from '../api/libraries';
import { endSession, startSession, submitAnswer } from '../api/practice';
import { ApiError } from '../api/client';
import type { AnswerResponse, Difficulty, StartSessionResponse } from '../api/types';
import HintGuide from '../components/HintGuide';
import { useI18n } from '../i18n/I18nProvider';

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const DIFFICULTY_KEY: Record<Difficulty, string> = { Easy: 'practice.easy', Medium: 'practice.medium', Hard: 'practice.hard' };
const DIFFICULTY_HINT_KEY: Record<Difficulty, string> = { Easy: 'practice.hintEasy', Medium: 'practice.hintMedium', Hard: 'practice.hintHard' };

// Mirror of the backend AnswerChecker normalization: case-insensitive but accent-sensitive.
function normalize(value: string): string {
  return value.normalize('NFC').toLowerCase().trim();
}

type Phase = 'setup' | 'playing' | 'done';

export default function PracticePage() {
  const { id } = useParams();
  const libraryId = Number(id);
  const { t } = useI18n();

  const library = useQuery({ queryKey: ['library', libraryId], queryFn: () => getLibrary(libraryId), enabled: Number.isFinite(libraryId) });
  const entries = useQuery({ queryKey: ['entries', libraryId], queryFn: () => listEntries(libraryId), enabled: Number.isFinite(libraryId) });

  const languages = useMemo(() => {
    const set = new Set<string>();
    entries.data?.forEach((e) => e.translations.forEach((tr) => set.add(tr.languageCode)));
    return [...set].sort();
  }, [entries.data]);

  const [phase, setPhase] = useState<Phase>('setup');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const [session, setSession] = useState<StartSessionResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (languages.length >= 1 && !source) setSource(languages[0]);
    if (languages.length >= 2 && !target) setTarget(languages[1]);
  }, [languages, source, target]);

  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus();
  }, [index, result, phase]);

  const current = session?.words[index];

  const begin = async (e: FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    if (!source || !target || source === target) {
      setSetupError(t('practice.pickTwo'));
      return;
    }
    setStarting(true);
    try {
      const started = await startSession(libraryId, source, target, difficulty);
      setSession(started);
      setIndex(0);
      setAnswer('');
      setResult(null);
      setCorrectCount(0);
      setPhase('playing');
    } catch (err) {
      setSetupError(err instanceof ApiError ? err.message : t('practice.startFailed'));
    } finally {
      setStarting(false);
    }
  };

  const onCheck = async () => {
    if (!session || !current) return;
    setChecking(true);
    try {
      const res = await submitAnswer(session.sessionId, current.entryId, answer);
      setResult(res);
      if (res.isCorrect) setCorrectCount((c) => c + 1);
    } finally {
      setChecking(false);
    }
  };

  const onNext = async () => {
    if (!session) return;
    if (index + 1 >= session.words.length) {
      try {
        await endSession(session.sessionId);
      } catch {
        /* ending is best-effort */
      }
      setPhase('done');
      return;
    }
    setIndex((i) => i + 1);
    setAnswer('');
    setResult(null);
  };

  const onSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (result) void onNext();
    else void onCheck();
  };

  let inputStatus = '';
  if (result) {
    inputStatus = result.isCorrect ? 'input-good' : 'input-bad';
  } else if (difficulty === 'Easy' && current?.expectedAnswer && answer.length > 0) {
    inputStatus = normalize(current.expectedAnswer).startsWith(normalize(answer)) ? 'input-good' : 'input-bad';
  }

  if (!Number.isFinite(libraryId)) return <p className="alert alert-error">{t('editor.invalidLibrary')}</p>;

  // ---------- Setup ----------
  if (phase === 'setup') {
    return (
      <div className="page narrow">
        <p>
          <Link to="/libraries" className="btn btn-link">
            {t('editor.back')}
          </Link>
        </p>
        <h1>{t('practice.title')}{library.data ? `: ${library.data.name}` : ''}</h1>

        {entries.isLoading && <p className="muted">{t('common.loading')}</p>}
        {entries.data && languages.length < 2 ? (
          <p className="muted">{t('practice.needTwoLangs')}</p>
        ) : (
          languages.length >= 2 && (
            <form className="card" onSubmit={begin}>
              <div className="direction-row">
                <label>
                  {t('practice.from')}
                  <select value={source} onChange={(e) => setSource(e.target.value)}>
                    {languages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="arrow">→</span>
                <label>
                  {t('practice.to')}
                  <select value={target} onChange={(e) => setTarget(e.target.value)}>
                    {languages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="difficulty-row">
                <legend>{t('practice.difficulty')}</legend>
                {DIFFICULTIES.map((d) => (
                  <label key={d} className="radio">
                    <input type="radio" name="difficulty" checked={difficulty === d} onChange={() => setDifficulty(d)} />
                    {t(DIFFICULTY_KEY[d])}
                  </label>
                ))}
              </fieldset>
              <p className="muted small">{t(DIFFICULTY_HINT_KEY[difficulty])}</p>

              {setupError && <p className="alert alert-error">{setupError}</p>}
              <button type="submit" className="btn btn-primary" disabled={starting}>
                {starting ? t('practice.starting') : t('practice.start')}
              </button>
            </form>
          )
        )}
      </div>
    );
  }

  // ---------- Done ----------
  if (phase === 'done' && session) {
    return (
      <div className="page narrow">
        <div className="card done-card">
          <h1>{t('practice.complete')}</h1>
          <p className="score-big">
            {correctCount} / {session.words.length}
          </p>
          <p className="muted">{t('practice.correctAnswers')}</p>
          <div className="form-actions center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPhase('setup');
                setResult(null);
              }}
            >
              {t('practice.again')}
            </button>
            <Link className="btn btn-ghost" to="/libraries">
              {t('practice.backToLibraries')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Playing ----------
  if (!session || !current) return null;

  return (
    <div className="page narrow practice">
      <div className="practice-progress">
        {t('practice.progress', { current: index + 1, total: session.words.length, score: correctCount })}
      </div>
      <div className="card practice-card">
        <div className="prompt-label">
          {session.sourceLanguage} → {session.targetLanguage}
        </div>
        <div className="prompt-word">{current.prompt}</div>

        {difficulty !== 'Hard' && current.hint && <HintGuide hint={current.hint} />}

        <form onSubmit={onSubmitForm}>
          <input
            ref={inputRef}
            className={`answer-input ${inputStatus}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('practice.answerPlaceholder')}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly={!!result}
          />

          {result && (
            <div className={`feedback ${result.isCorrect ? 'feedback-good' : 'feedback-bad'}`}>
              {result.isCorrect ? (
                <span>{t('practice.correct')}</span>
              ) : (
                <span>
                  {t('practice.notQuite')} <strong>{result.expectedAnswer}</strong>
                </span>
              )}
              {result.mastered && <span className="mastered-badge">{t('practice.mastered')}</span>}
            </div>
          )}

          <div className="form-actions">
            {!result ? (
              <button type="submit" className="btn btn-primary" disabled={checking || !answer.trim()}>
                {checking ? t('practice.checking') : t('practice.check')}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                {index + 1 >= session.words.length ? t('practice.finish') : t('practice.next')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
