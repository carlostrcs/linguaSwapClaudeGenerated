import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

const FEATURES = [
  { key: 'libraries', icon: '📚' },
  { key: 'direction', icon: '🔄' },
  { key: 'srs', icon: '🧠' },
  { key: 'stats', icon: '📈' },
];

export default function LandingPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
        <div className="landing-header-actions">
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
          {FEATURES.map((f) => (
            <div className="card feature-card" key={f.key}>
              <div className="feature-icon" aria-hidden="true">
                {f.icon}
              </div>
              <h3>{t(`landing.feature.${f.key}.title`)}</h3>
              <p className="muted">{t(`landing.feature.${f.key}.body`)}</p>
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
    </div>
  );
}
