// Static render of the landing page, for the HTML a crawler sees before any JavaScript runs.
//
// Mirrors `src/pages/LandingPage.tsx`'s logged-out output. Both read their structure from
// `src/content/landing.ts` and their copy from the same i18n dictionaries, so the two cannot
// describe different products — only the two small renderers could drift, and only in markup.
//
// On `/` this markup is replaced by React on mount (`createRoot().render()` clears the container).
// On the localized homepages there is no SPA at all; this is the page.

import {
  LANDING_FEATURES,
  LANDING_KEYS,
  featureBodyKey,
  featureTitleKey,
} from '../../src/content/landing';
import { LOCALES } from '../../src/i18n/locales';
import { translator } from '../../src/i18n/interpolate';
import type { LanguageId } from '../../src/i18n/translations';
import { escapeHtml } from '../html';
import { localeHome } from '../urls';

/**
 * Link into the app, carrying the locale. The app routes are unprefixed, so `?lang=` is how a
 * visitor who arrived on `/fr` keeps French when they click through to `/register`
 * (`I18nProvider.initialLang` reads it and stores it).
 */
function appHref(path: string, locale: string): string {
  return locale === 'en' ? path : `${path}?lang=${locale}`;
}

/**
 * Crawlable links to the other locales.
 *
 * The React header renders a `<select>` here instead — a select is useless without JavaScript,
 * while real anchors also give crawlers a path between the translated homepages. Same languages,
 * same names; only the control differs.
 */
function localeLinks(current: string): string {
  const links = LOCALES.map((locale) => {
    const label = escapeHtml(locale.label);
    if (locale.id === current) return `<span class="lang-link is-current">${label}</span>`;
    return `<a class="lang-link" href="${localeHome(locale.id)}" hreflang="${locale.id}">${label}</a>`;
  });
  return `<nav class="lang-links" aria-label="Language">${links.join('')}</nav>`;
}

export function renderLanding(locale: string): string {
  const t = translator(locale as LanguageId);
  const e = (key: string) => escapeHtml(t(key));
  const href = (path: string) => appHref(path, locale);

  const features = LANDING_FEATURES.map(
    (feature) => `
        <div class="card feature-card">
          <div class="feature-icon" aria-hidden="true">${feature.icon}</div>
          <h3>${escapeHtml(t(featureTitleKey(feature.key)))}</h3>
          <p class="muted">${escapeHtml(t(featureBodyKey(feature.key)))}</p>
        </div>`,
  ).join('');

  return `
    <div class="landing">
      <header class="landing-header">
        <a class="brand" href="${localeHome(locale)}">LinguaSwap</a>
        <div class="landing-header-actions">
          ${localeLinks(locale)}
          <a class="btn btn-ghost" href="${href('/login')}">${e(LANDING_KEYS.actions.signIn)}</a>
          <a class="btn btn-primary" href="${href('/register')}">${e(LANDING_KEYS.actions.register)}</a>
        </div>
      </header>

      <section class="landing-hero">
        <h1>${e(LANDING_KEYS.hero.title)}</h1>
        <p class="landing-subtitle">${e(LANDING_KEYS.hero.subtitle)}</p>
        <div class="landing-actions">
          <a class="btn btn-primary btn-lg" href="${href('/register')}">${e(LANDING_KEYS.actions.register)}</a>
          <a class="btn btn-secondary btn-lg" href="${href('/demo')}">${e(LANDING_KEYS.actions.demo)}</a>
        </div>
        <p class="muted small">${e(LANDING_KEYS.hero.note)}</p>
      </section>

      <section class="landing-features">
        <h2>${e(LANDING_KEYS.features.title)}</h2>
        <div class="feature-grid">${features}
        </div>
        <p class="muted landing-premium-note">${e(LANDING_KEYS.features.note)}</p>
      </section>

      <section class="landing-cta">
        <h2>${e(LANDING_KEYS.cta.title)}</h2>
        <p class="muted">${e(LANDING_KEYS.cta.subtitle)}</p>
        <div class="landing-actions">
          <a class="btn btn-primary btn-lg" href="${href('/register')}">${e(LANDING_KEYS.actions.register)}</a>
          <a class="btn btn-secondary btn-lg" href="${href('/demo')}">${e(LANDING_KEYS.actions.demo)}</a>
        </div>
      </section>
    </div>
  `;
}
