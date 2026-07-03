import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Chrome for the public, no-account demo. Mirrors the authenticated Layout (topbar + centred
 * `.content`) so the demo pages look like the real app, but with sign-up CTAs instead of the
 * user menu. Provides the `.content` shell every demo page renders into.
 */
export default function DemoLayout() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
        <span className="badge">{t('demo.badge')}</span>
        <div className="user-area">
          {isAuthenticated ? (
            <Link className="btn btn-primary" to="/libraries">
              {t('landing.myLibraries')}
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                {t('auth.signIn')}
              </Link>
              <Link className="btn btn-primary" to="/register">
                {t('landing.getStarted')}
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
