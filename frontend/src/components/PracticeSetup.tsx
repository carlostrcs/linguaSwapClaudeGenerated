import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Difficulty, PracticeMode } from '../api/types';
import { langLabel } from '../lib/languages';
import { MODE_DESC_KEY, MODE_NAME_KEY, PRACTICE_MODES, isPremiumMode } from '../lib/practiceModes';
import { useI18n } from '../i18n/I18nProvider';

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const DIFFICULTY_KEY: Record<Difficulty, string> = { Easy: 'practice.easy', Medium: 'practice.medium', Hard: 'practice.hard' };
const DIFFICULTY_HINT_KEY: Record<Difficulty, string> = {
  Easy: 'practice.hintEasy',
  Medium: 'practice.hintMedium',
  Hard: 'practice.hintHard',
};

interface Props {
  languages: string[];
  source: string;
  target: string;
  difficulty: Difficulty;
  mode: PracticeMode;
  /** Whether the current user may use the premium modes (the demo passes true to showcase them). */
  isPremium: boolean;
  onSource: (value: string) => void;
  onTarget: (value: string) => void;
  onDifficulty: (value: Difficulty) => void;
  onMode: (value: PracticeMode) => void;
  onStart: (e: FormEvent) => void;
  error?: string | null;
  busy?: boolean;
}

/**
 * The "choose a direction and difficulty, then start" form. Shared by the real PracticePage and
 * the no-account DemoPage so the two stay identical.
 */
export default function PracticeSetup({
  languages,
  source,
  target,
  difficulty,
  mode,
  isPremium,
  onSource,
  onTarget,
  onDifficulty,
  onMode,
  onStart,
  error,
  busy,
}: Props) {
  const { t } = useI18n();
  return (
    <form className="card" onSubmit={onStart}>
      <div className="direction-row">
        <label>
          {t('practice.from')}
          <select
            value={source}
            onChange={(e) => {
              const next = e.target.value;
              if (next === target) onTarget(source); // collision → push old source into target (swap)
              onSource(next);
            }}
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {langLabel(l)}
              </option>
            ))}
          </select>
        </label>
        <span className="arrow">→</span>
        <label>
          {t('practice.to')}
          <select
            value={target}
            onChange={(e) => {
              const next = e.target.value;
              if (next === source) onSource(target); // collision → push old target into source (swap)
              onTarget(next);
            }}
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {langLabel(l)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mode-row">
        <legend>{t('practice.mode')}</legend>
        {PRACTICE_MODES.map((m) => {
          const locked = isPremiumMode(m) && !isPremium;
          return (
            <label key={m} className={`mode-option${mode === m ? ' selected' : ''}${locked ? ' locked' : ''}`}>
              <input
                type="radio"
                name="mode"
                checked={mode === m}
                disabled={locked}
                onChange={() => onMode(m)}
              />
              <span className="mode-name">
                {t(MODE_NAME_KEY[m])}
                {locked && <span className="mode-lock" aria-hidden>🔒</span>}
              </span>
              <span className="mode-desc muted small">{t(MODE_DESC_KEY[m])}</span>
            </label>
          );
        })}
      </fieldset>
      {!isPremium && (
        <p className="muted small">
          {t('practice.modesPremiumHint')} <Link to="/account">{t('premium.upgradeLink')}</Link>
        </p>
      )}

      <fieldset className="difficulty-row">
        <legend>{t('practice.difficulty')}</legend>
        {DIFFICULTIES.map((d) => (
          <label key={d} className="radio">
            <input type="radio" name="difficulty" checked={difficulty === d} onChange={() => onDifficulty(d)} />
            {t(DIFFICULTY_KEY[d])}
          </label>
        ))}
      </fieldset>
      <p className="muted small">{t(DIFFICULTY_HINT_KEY[difficulty])}</p>

      {error && <p className="alert alert-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? t('practice.starting') : t('practice.start')}
      </button>
    </form>
  );
}
