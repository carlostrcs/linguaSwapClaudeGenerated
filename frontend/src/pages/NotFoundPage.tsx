import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { NOT_FOUND_SEO } from '../content/seo';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Replaces the old catch-all `<Navigate to="/" replace />`.
 *
 * Redirecting an unknown URL to the home page is what made every typo, stale link and hallucinated
 * URL return HTTP 200 with the homepage — a soft 404. It taught crawlers that infinite valid URLs
 * exist, diluted `/`, and hid broken inbound links from us. Now the route renders a real 404 page,
 * `dist/404.html` is served with a real 404 status for paths that match nothing, and the SPA
 * fallback points at a `noindex` shell rather than at the landing page.
 */
export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="card">
      <Seo {...NOT_FOUND_SEO} />
      <h1>{t('notFound.title')}</h1>
      <p className="muted">{t('notFound.body')}</p>
      <div className="landing-actions">
        <Link className="btn btn-primary" to="/">
          {t('notFound.home')}
        </Link>
        <Link className="btn btn-secondary" to="/demo">
          {t('notFound.demo')}
        </Link>
      </div>
    </div>
  );
}
