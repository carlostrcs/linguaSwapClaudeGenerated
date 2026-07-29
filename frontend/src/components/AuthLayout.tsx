import { Link, Outlet, useLocation } from 'react-router-dom';
import LanguagePicker from './LanguagePicker';
import Seo from './Seo';
import { ROUTE_SEO } from '../content/seo';
import type { SeoRoutePath } from '../content/seo';

/**
 * Minimal chrome for the logged-out auth pages (Login / Register): the app topbar with just the
 * clickable "LinguaSwap" brand over the centred `.content` shell, so these pages match the rest
 * of the app and the user can always click the brand to return home.
 */
export default function AuthLayout() {
  // One lookup covers every auth route. The 404 route also renders here but has no ROUTE_SEO
  // entry — NotFoundPage supplies its own, so the two never both emit a <title>.
  const { pathname } = useLocation();
  const seo = pathname in ROUTE_SEO ? ROUTE_SEO[pathname as SeoRoutePath] : null;

  return (
    <div className="app">
      {seo && <Seo {...seo} />}
      <header className="topbar">
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
        <div className="user-area">
          <LanguagePicker />
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
