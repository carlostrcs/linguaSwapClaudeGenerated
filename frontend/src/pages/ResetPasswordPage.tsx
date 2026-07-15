import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { ApiError } from '../api/client';
import { useI18n } from '../i18n/I18nProvider';
import { passwordIssueKey, PASSWORD_MIN_LENGTH } from '../lib/validation';
import PasswordInput from '../components/PasswordInput';

/** Target of the emailed reset link (public — opened logged-out). Reads userId+token from the query,
 *  collects a new password, and posts it. Password rules mirror registration via lib/validation. */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const userId = params.get('userId');
  const token = params.get('token');
  const { t } = useI18n();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const showMatchState = confirmPassword.length > 0;

  // A link missing either param is malformed — tell the user rather than fail on submit.
  if (!userId || !token) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h2>{t('auth.resetPassword.title')}</h2>
          <p className="alert alert-error">{t('auth.resetPassword.invalidLink')}</p>
          <Link className="btn btn-primary" to="/forgot-password">
            {t('auth.resetPassword.requestNew')}
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

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
      await resetPassword(userId, token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.resetPassword.failed'));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h2>{t('auth.resetPassword.doneTitle')}</h2>
          <p>{t('auth.resetPassword.doneBody')}</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}>
            {t('auth.signIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h2>{t('auth.resetPassword.title')}</h2>
        <p className="muted">{t('auth.resetPassword.subtitle')}</p>
        {error && <p className="alert alert-error">{error}</p>}
        <label>
          {t('auth.resetPassword.newPassword')}
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
          {busy ? t('auth.resetPassword.saving') : t('auth.resetPassword.save')}
        </button>
      </form>
    </div>
  );
}
