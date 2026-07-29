import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import LanguagePicker from '../components/LanguagePicker';
import Seo from '../components/Seo';
import { HOME_SEO_KEYS } from '../content/seo';
// Shared with the build-time generator, which prerenders this same page into the served HTML so a
// crawler that runs no JavaScript still sees the copy. See src/content/landing.ts.
import {
  LANDING_FEATURES,
  featureBodyKey,
  featureTitleKey,
  landingFooter,
} from '../content/landing';

export default function LandingPage() {
  const { t, lang } = useI18n();
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      {/* Localized: every locale has its own indexable homepage (`/`, `/es`, …). */}
      <Seo title={t(HOME_SEO_KEYS.title)} description={t(HOME_SEO_KEYS.description)} />
      <header className="landing-header">
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
        <div className="landing-header-actions">
          {/* Navigates: each locale has its own indexable homepage, so switching language here
              should change the URL rather than leave two URLs rendering the same language. */}
          <LanguagePicker navigateToLocaleHome />
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

      <section className="landing-hero">
        <h1>{t('landing.heroTitle')}</h1>
        <p className="landing-subtitle">{t('landing.heroSubtitle')}</p>
        <div className="landing-actions">
          {isAuthenticated ? (
            <Link className="btn btn-primary btn-lg" to="/libraries">
              {t('landing.myLibraries')}
            </Link>
          ) : (
            <Link className="btn btn-primary btn-lg" to="/register">
              {t('landing.getStarted')}
            </Link>
          )}
          <Link className="btn btn-secondary btn-lg" to="/demo">
            {t('landing.tryDemo')}
          </Link>
        </div>
        {!isAuthenticated && <p className="muted small">{t('landing.demoNote')}</p>}
      </section>

      <section className="landing-features">
        <h2>{t('landing.featuresTitle')}</h2>
        <div className="feature-grid">
          {LANDING_FEATURES.map((f) => (
            <div className="card feature-card" key={f.key}>
              <div className="feature-icon" aria-hidden="true">
                {f.icon}
              </div>
              <h3>{t(featureTitleKey(f.key))}</h3>
              <p className="muted">{t(featureBodyKey(f.key))}</p>
            </div>
          ))}
        </div>
        <p className="muted landing-premium-note">{t('landing.premiumNote')}</p>
      </section>

      {!isAuthenticated && (
        <section className="landing-cta">
          <h2>{t('landing.ctaTitle')}</h2>
          <p className="muted">{t('landing.ctaSubtitle')}</p>
          <div className="landing-actions">
            <Link className="btn btn-primary btn-lg" to="/register">
              {t('landing.getStarted')}
            </Link>
            <Link className="btn btn-secondary btn-lg" to="/demo">
              {t('landing.tryDemo')}
            </Link>
          </div>
        </section>
      )}

      {/* Without this the generated vocabulary pages and guides are reachable only from the
          sitemap — invisible to users, and slow to be crawled. */}
      <footer className="landing-footer">
        <nav className="doc-footer-links" aria-label="More">
          {landingFooter(lang).map((link) => {
            // The marker is the whole point: a reader who picked French should know before
            // clicking that this particular page is still in English.
            const label = link.inLanguage
              ? `${t(link.key)} (${t('landing.footerInEnglish')})`
              : t(link.key);

            // A plain anchor for the generated pages: they are real documents the server serves,
            // not React routes, so a <Link> would navigate on the client and land on the 404 page.
            return link.staticPage ? (
              <a key={link.to} href={link.to} hrefLang={link.inLanguage}>
                {label}
              </a>
            ) : (
              <Link key={link.to} to={link.to}>
                {label}
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
