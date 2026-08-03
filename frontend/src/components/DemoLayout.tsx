import { Link, Outlet, useLocation } from 'react-router-dom';
import Seo from './Seo';
import { APP_SEO, ROUTE_SEO } from '../content/seo';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import LanguagePicker from './LanguagePicker';

/**
 * Chrome for the public, no-account demo. Mirrors the authenticated Layout (topbar + centred
 * `.content`) so the demo pages look like the real app, but with sign-up CTAs instead of the
 * user menu. Provides the `.content` shell every demo page renders into.
 */
export default function DemoLayout() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  // `/demo` is a real entry point worth indexing. Its sub-routes render whatever happens to be in
  // this browser's localStorage, so there is no stable document there to index.
  const { pathname } = useLocation();

  return (
    <div className="app">
      <Seo {...(pathname === '/demo' ? ROUTE_SEO['/demo'] : APP_SEO)} />
      <header className="topbar">
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
        <span className="badge">{t('demo.badge')}</span>
        <div className="user-area">
          <LanguagePicker />
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
