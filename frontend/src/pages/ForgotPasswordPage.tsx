import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { useI18n } from '../i18n/I18nProvider';

/** Ask for the account email and trigger a reset link. The success screen is deliberately neutral
 *  ("if that email exists…") and is shown even on an API error, so this page can never be used to
 *  probe which addresses are registered. */
export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await forgotPassword(email);
    } catch {
      // Swallow: the response is intentionally identical whether or not the email exists.
    } finally {
      setBusy(false);
      setSent(true);
    }
  };

  return (
    <div className="auth-page">
      <p>
        <Link to="/login" className="btn btn-link">
          {t('auth.backToLogin')}
        </Link>
      </p>
      {sent ? (
        <div className="card auth-card">
          <h2>{t('auth.forgotPassword.checkEmailTitle')}</h2>
          <p>{t('auth.forgotPassword.checkEmailBody', { email })}</p>
        </div>
      ) : (
        <form className="card auth-card" onSubmit={onSubmit}>
          <h2>{t('auth.forgotPassword.title')}</h2>
          <p className="muted">{t('auth.forgotPassword.subtitle')}</p>
          <label>
            {t('common.email')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendLink')}
          </button>
          <p className="muted">
            {t('auth.rememberedPassword')} <Link to="/login">{t('auth.signIn')}</Link>
          </p>
        </form>
      )}
    </div>
  );
}
