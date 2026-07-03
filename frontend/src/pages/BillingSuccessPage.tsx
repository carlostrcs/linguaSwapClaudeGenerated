import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { confirmCheckout } from '../api/billing';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

type Status = 'loading' | 'success' | 'error';

/** Stripe redirects here after checkout. We confirm the session, then reflect premium locally. */
export default function BillingSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React 18 StrictMode double-invoke
    ran.current = true;

    if (!sessionId) {
      setStatus('error');
      setError(t('premium.success.missingSession'));
      return;
    }

    confirmCheckout(sessionId)
      .then((acc) => {
        if (user)
          updateUser({
            ...user,
            isPremium: acc.isPremium,
            subscriptionActive: acc.subscriptionActive,
            trialEndsAt: acc.trialEndsAt,
          });
        qc.invalidateQueries({ queryKey: ['account'] });
        setStatus('success');
      })
      .catch((e) => {
        setStatus('error');
        setError(e instanceof ApiError ? e.message : t('premium.success.failed'));
      });
  }, [sessionId, user, updateUser, qc, t]);

  return (
    <div className="page narrow">
      <div className="card">
        {status === 'loading' && <p>{t('premium.success.confirming')}</p>}
        {status === 'success' && (
          <>
            <h1>{t('premium.success.title')}</h1>
            <p>{t('premium.success.body')}</p>
            <Link className="btn btn-primary" to="/libraries">
              {t('premium.success.cta')}
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>{t('premium.success.errorTitle')}</h1>
            <p className="alert alert-error">{error}</p>
            <Link className="btn btn-primary" to="/account">
              {t('premium.success.backToAccount')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
