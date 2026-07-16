import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type { Difficulty, PracticeWord } from '../api/types';
import HintGuide from './HintGuide';
import SpeakButton from './SpeakButton';
import { normalize, primaryAnswer } from '../lib/demo/demoEngine';
import { isCaseSensitiveLang, langLabel, specialCharsFor } from '../lib/languages';
import { useI18n } from '../i18n/I18nProvider';

export interface CheckResult {
  isCorrect: boolean;
  expectedAnswer: string;
  mastered: boolean;
}

interface Props {
  word: PracticeWord;
  difficulty: Difficulty;
  sourceLanguage: string;
  targetLanguage: string;
  /** Validate an answer. Real practice calls the API; the demo checks locally. */
  checkAnswer: (word: PracticeWord, answer: string) => Promise<CheckResult>;
  /** Fired right after a check resolves (so the parent can score / track stats). */
  onResult?: (result: CheckResult) => void;
  /** Fired when the user advances past the already-checked card. */
  onAdvance: (result: CheckResult) => void;
  /** Label for the advance button once a result is shown (parent decides, e.g. Next / Finish). */
  nextLabel: (result: CheckResult) => string;
}

/**
 * Presents a single practice word: the prompt, hint, answer input (with the diacritic keypad and
 * caret handling), and the check → feedback → advance flow. Owns only this one card's transient
 * state; the parent controls which word is shown and what happens on advance. Remount the card
 * (via a changing `key`) to move to the next word — that resets the input cleanly.
 */
export default function PracticeCard({
  word,
  difficulty,
  sourceLanguage,
  targetLanguage,
  checkAnswer,
  onResult,
  onAdvance,
  nextLabel,
}: Props) {
  const { t } = useI18n();
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  const specialChars = specialCharsFor(targetLanguage);
  const caseSensitive = isCaseSensitiveLang(targetLanguage);

  useEffect(() => {
    inputRef.current?.focus();
  }, [result]);

  // Restore the caret after a keypad insert (the input is controlled, so the value updates first).
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [answer]);

  // Insert a special character at the cursor (or replacing the selection).
  const insertChar = (ch: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? answer.length;
    const end = input?.selectionEnd ?? answer.length;
    pendingCaret.current = start + ch.length;
    setAnswer(answer.slice(0, start) + ch + answer.slice(end));
  };

  // Number keys 1-9 type the matching keypad character (so the user never leaves the home keys).
  // A digit with no character mapped to it is left to type normally.
  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (result || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key >= '1' && e.key <= '9') {
      const idx = Number(e.key) - 1;
      if (idx < specialChars.length) {
        e.preventDefault();
        insertChar(specialChars[idx]);
      }
    }
  };

  const onCheck = async () => {
    setChecking(true);
    try {
      const res = await checkAnswer(word, answer);
      setResult(res);
      onResult?.(res);
    } finally {
      setChecking(false);
    }
  };

  const onSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (result) onAdvance(result);
    else void onCheck();
  };

  let inputStatus = '';
  if (result) {
    inputStatus = result.isCorrect ? 'input-good' : 'input-bad';
  } else if (difficulty === 'Easy' && answer.length > 0) {
    // The live border tracks the primary answer only — prefix-matching the raw comma-separated
    // list would go red the moment the user's typing passes the first alternative.
    const primary = primaryAnswer(word.acceptedAnswer);
    inputStatus = normalize(primary, caseSensitive).startsWith(normalize(answer, caseSensitive))
      ? 'input-good'
      : 'input-bad';
  }

  return (
    <div className="card practice-card">
      <div className="prompt-label">
        {langLabel(sourceLanguage)} → {langLabel(targetLanguage)}
      </div>
      <div className="prompt-word-row">
        <span className="prompt-word">{word.prompt}</span>
        <SpeakButton text={word.prompt} lang={sourceLanguage} />
      </div>
      {word.notes && <div className="prompt-note">{word.notes}</div>}

      {difficulty !== 'Hard' && word.hint && <HintGuide hint={word.hint} />}

      <form onSubmit={onSubmitForm}>
        <input
          ref={inputRef}
          className={`answer-input ${inputStatus}`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={t('practice.answerPlaceholder')}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={!!result}
        />

        {specialChars.length > 0 && !result && (
          <div className="special-chars" aria-label={t('practice.specialChars')}>
            {specialChars.map((ch, i) => (
              <button
                type="button"
                key={ch}
                className="special-char-btn"
                tabIndex={-1}
                title={t('practice.insertChar', { char: ch, key: i + 1 })}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertChar(ch)}
              >
                <span className="special-char-glyph">{ch}</span>
                <span className="special-char-key">{i + 1}</span>
              </button>
            ))}
          </div>
        )}

        {result && (
          <div className={`feedback ${result.isCorrect ? 'feedback-good' : 'feedback-bad'}`}>
            {result.isCorrect ? (
              <span>{t('practice.correct')}</span>
            ) : (
              <span>
                {t('practice.notQuite')} <strong>{result.expectedAnswer}</strong>
              </span>
            )}
            <SpeakButton text={result.expectedAnswer} lang={targetLanguage} />
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
              {nextLabel(result)}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
