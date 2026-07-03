import { useState } from 'react';
import { resendConfirmation } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

const DISMISS_KEY = 'linguaswap.confirmBannerDismissed';

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

/** Soft, dismissible reminder to confirm the account email. Shown across the app until the
 *  address is confirmed. Dismissal lasts the session (reappears next visit until confirmed). */
export default function ConfirmEmailBanner() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [resend, setResend] = useState<ResendState>('idle');

  // Only for a signed-in, not-yet-confirmed user who hasn't dismissed it this session.
  if (!user || user.emailConfirmed !== false || dismissed) return null;

  const onResend = async () => {
    setResend('sending');
    try {
      await resendConfirmation();
      setResend('sent');
    } catch {
      setResend('error');
    }
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="trial-banner">
      {t('auth.confirmEmail.banner', { email: user.email })}{' '}
      {resend === 'sent' ? (
        <strong>{t('auth.confirmEmail.resent')}</strong>
      ) : (
        <button
          type="button"
          className="btn btn-link"
          onClick={onResend}
          disabled={resend === 'sending'}
        >
          {resend === 'error' ? t('auth.confirmEmail.resendFailed') : t('auth.confirmEmail.resend')}
        </button>
      )}
      <button type="button" className="btn btn-link" onClick={dismiss}>
        {t('auth.confirmEmail.dismiss')}
      </button>
    </div>
  );
}
