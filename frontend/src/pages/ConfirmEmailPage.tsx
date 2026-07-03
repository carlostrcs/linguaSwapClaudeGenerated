import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { confirmEmail } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

type Status = 'loading' | 'success' | 'error';

/** The confirmation email links here (public — often opened logged-out). We POST the token,
 *  then reflect the confirmed state locally if the user happens to be signed in. */
export default function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const userId = params.get('userId');
  const token = params.get('token');
  const { user, isAuthenticated, updateUser } = useAuth();
  const qc = useQueryClient();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React 18 StrictMode double-invoke
    ran.current = true;

    if (!userId || !token) {
      setStatus('error');
      setError(t('auth.confirmEmail.missingToken'));
      return;
    }

    confirmEmail(userId, token)
      .then(() => {
        if (user) updateUser({ ...user, emailConfirmed: true });
        qc.invalidateQueries({ queryKey: ['account'] });
        setStatus('success');
      })
      .catch((e) => {
        setStatus('error');
        setError(e instanceof ApiError ? e.message : t('auth.confirmEmail.failed'));
      });
  }, [userId, token, user, updateUser, qc, t]);

  return (
    <div className="page narrow">
      <div className="card">
        <h1>{t('auth.confirmEmail.title')}</h1>
        {status === 'loading' && <p>{t('auth.confirmEmail.confirming')}</p>}
        {status === 'success' && (
          <>
            <p>{t('auth.confirmEmail.success')}</p>
            <Link className="btn btn-primary" to={isAuthenticated ? '/libraries' : '/login'}>
              {isAuthenticated ? t('auth.confirmEmail.goToApp') : t('auth.confirmEmail.goToLogin')}
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="alert alert-error">{error}</p>
            <Link className="btn btn-primary" to={isAuthenticated ? '/libraries' : '/login'}>
              {isAuthenticated ? t('auth.confirmEmail.goToApp') : t('auth.confirmEmail.goToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
