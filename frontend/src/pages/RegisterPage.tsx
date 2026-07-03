import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import { isValidEmail, passwordIssueKey, PASSWORD_MIN_LENGTH } from '../lib/validation';

// Feather "eye" / "eye-off" icons, inlined (no icon lib in this project; keeps it CSP-safe).
const EyeIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minLength?: number;
  'aria-invalid'?: boolean;
};

/** A password input with a show/hide eye toggle. Manages its own visibility state. */
function PasswordInput({ value, onChange, className, minLength, ...rest }: PasswordInputProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const label = visible ? t('auth.hidePassword') : t('auth.showPassword');
  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={minLength}
        className={className}
        {...rest}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        {visible ? EyeOffIcon : EyeIcon}
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Live match indicator: only shown once the user has started typing the confirmation.
  const passwordsMatch = password === confirmPassword;
  const showMatchState = confirmPassword.length > 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate locally first so the user gets immediate feedback; the API re-checks regardless.
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    const pwIssue = passwordIssueKey(password);
    if (pwIssue) {
      setError(t(pwIssue, { min: PASSWORD_MIN_LENGTH }));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setBusy(true);
    try {
      signIn(await register(email, password, displayName || undefined));
      navigate('/libraries');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.registerFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <p>
        <Link to="/" className="btn btn-link">
          {t('auth.backHome')}
        </Link>
      </p>
      <form className="card auth-card" onSubmit={onSubmit}>
        <h2>{t('auth.createAccount')}</h2>
        {error && <p className="alert alert-error">{error}</p>}
        <label>
          {t('auth.displayNameOptional')}
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          {t('common.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t('auth.passwordHint')}
          <PasswordInput value={password} onChange={setPassword} minLength={PASSWORD_MIN_LENGTH} />
          <small className="muted">{t('auth.passwordRequirements', { min: PASSWORD_MIN_LENGTH })}</small>
        </label>
        <label>
          {t('auth.confirmPassword')}
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            className={showMatchState ? (passwordsMatch ? 'input-good' : 'input-bad') : undefined}
            aria-invalid={showMatchState && !passwordsMatch}
          />
          {showMatchState && (
            <small className={passwordsMatch ? 'feedback-good' : 'feedback-bad'}>
              {passwordsMatch ? t('auth.passwordsMatch') : t('auth.passwordsDontMatch')}
            </small>
          )}
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('auth.creating') : t('auth.createAccountBtn')}
        </button>
        <p className="muted">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
        </p>
      </form>
    </div>
  );
}
