import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { legalPath } from '../content/legal';
import { useI18n } from '../i18n/I18nProvider';
import { isValidEmail, passwordIssueKey, PASSWORD_MIN_LENGTH } from '../lib/validation';
import PasswordInput from '../components/PasswordInput';

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
      // A brand-new account owns no libraries, so the Libraries page would greet it with an
      // empty state. Send it to the featured shelf instead — there is something to add there,
      // and the free trial started at registration means it can be added right away.
      navigate('/featured');
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
        {/* Acceptance has to be visible at the point of acceptance, with the documents one click
            away. Plain <a> rather than <Link>: these are generated pages, and a React Router link
            would navigate on the client, match no route and land on the 404 page. */}
        <p className="muted small">
          {t('auth.acceptTerms')
            .split(/(\{terms\}|\{privacy\})/)
            .map((part, i) => {
              if (part === '{terms}') {
                return (
                  <a key={i} href={legalPath('terms')}>
                    {t('legal.termsName')}
                  </a>
                );
              }
              if (part === '{privacy}') {
                return (
                  <a key={i} href={legalPath('privacy')}>
                    {t('legal.privacyName')}
                  </a>
                );
              }
              return part;
            })}
        </p>
        <p className="muted">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
        </p>
      </form>
    </div>
  );
}
