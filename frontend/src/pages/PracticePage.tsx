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

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const DIFFICULTY_HINT: Record<Difficulty, string> = {
  Easy: 'Some letters are revealed, and the box turns green while you are on track.',
  Medium: 'Only the first letter is shown — no colour hints.',
  Hard: 'No clues at all. Type the whole word from memory.',
};

// Mirror of the backend AnswerChecker normalization (case- and accent-insensitive).
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

type Phase = 'setup' | 'playing' | 'done';

export default function PracticePage() {
  const { id } = useParams();
  const libraryId = Number(id);

  const library = useQuery({ queryKey: ['library', libraryId], queryFn: () => getLibrary(libraryId), enabled: Number.isFinite(libraryId) });
  const entries = useQuery({ queryKey: ['entries', libraryId], queryFn: () => listEntries(libraryId), enabled: Number.isFinite(libraryId) });

  const languages = useMemo(() => {
    const set = new Set<string>();
    entries.data?.forEach((e) => e.translations.forEach((t) => set.add(t.languageCode)));
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

  // Default the language selectors once the library has loaded.
  useEffect(() => {
    if (languages.length >= 1 && !source) setSource(languages[0]);
    if (languages.length >= 2 && !target) setTarget(languages[1]);
  }, [languages, source, target]);

  // Keep focus on the answer field as words advance.
  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus();
  }, [index, result, phase]);

  const current = session?.words[index];

  const begin = async (e: FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    if (!source || !target || source === target) {
      setSetupError('Pick two different languages.');
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
      setSetupError(err instanceof ApiError ? err.message : 'Could not start practice.');
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

  // Live border colour: green while a correct prefix (Easy only), red once diverged.
  let inputStatus = '';
  if (result) {
    inputStatus = result.isCorrect ? 'input-good' : 'input-bad';
  } else if (difficulty === 'Easy' && current?.expectedAnswer && answer.length > 0) {
    inputStatus = normalize(current.expectedAnswer).startsWith(normalize(answer)) ? 'input-good' : 'input-bad';
  }

  if (!Number.isFinite(libraryId)) return <p className="alert alert-error">Invalid library.</p>;

  // ---------- Setup ----------
  if (phase === 'setup') {
    return (
      <div className="page narrow">
        <p>
          <Link to="/libraries" className="btn btn-link">
            ← Back to libraries
          </Link>
        </p>
        <h1>Practise{library.data ? `: ${library.data.name}` : ''}</h1>

        {entries.isLoading && <p className="muted">Loading…</p>}
        {entries.data && languages.length < 2 ? (
          <p className="muted">
            This library needs words in at least two languages before you can practise. Add some in the editor.
          </p>
        ) : (
          languages.length >= 2 && (
            <form className="card" onSubmit={begin}>
              <div className="direction-row">
                <label>
                  From
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
                  To
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
                <legend>Difficulty</legend>
                {DIFFICULTIES.map((d) => (
                  <label key={d} className="radio">
                    <input type="radio" name="difficulty" checked={difficulty === d} onChange={() => setDifficulty(d)} />
                    {d}
                  </label>
                ))}
              </fieldset>
              <p className="muted small">{DIFFICULTY_HINT[difficulty]}</p>

              {setupError && <p className="alert alert-error">{setupError}</p>}
              <button type="submit" className="btn btn-primary" disabled={starting}>
                {starting ? 'Starting…' : 'Start practice'}
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
          <h1>Session complete!</h1>
          <p className="score-big">
            {correctCount} / {session.words.length}
          </p>
          <p className="muted">correct answers</p>
          <div className="form-actions center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPhase('setup');
                setResult(null);
              }}
            >
              Practise again
            </button>
            <Link className="btn btn-ghost" to="/libraries">
              Back to libraries
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
        Word {index + 1} of {session.words.length} · Score {correctCount}
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
            placeholder="Type your answer"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly={!!result}
          />

          {result && (
            <div className={`feedback ${result.isCorrect ? 'feedback-good' : 'feedback-bad'}`}>
              {result.isCorrect ? (
                <span>✓ Correct!</span>
              ) : (
                <span>
                  ✗ Not quite — answer: <strong>{result.expectedAnswer}</strong>
                </span>
              )}
              {result.mastered && <span className="mastered-badge">Mastered ⭐</span>}
            </div>
          )}

          <div className="form-actions">
            {!result ? (
              <button type="submit" className="btn btn-primary" disabled={checking || !answer.trim()}>
                {checking ? 'Checking…' : 'Check'}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                {index + 1 >= session.words.length ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
