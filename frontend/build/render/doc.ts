// Shared chrome for the generated content pages.
//
// These pages ship NO JavaScript — they reuse the app's stylesheet and nothing else. That is the
// point: they are the fastest pages on the site and the only ones a non-JS crawler can read in
// full. Keeping the chrome in one place also keeps the internal link graph consistent, which is
// what stops a set of generated pages from looking like an orphaned doorway farm.
//
// Labels come from the app's own dictionaries via `translator(locale)`, so a guide in French gets
// French chrome without a second copy of those strings.

import { guidePath } from '../../src/content/guides';
import { legalPath } from '../../src/content/legal';
import { hasVocabPages, learnIndexPath } from '../../src/content/learn';
import { translator } from '../../src/i18n/interpolate';
import type { LanguageId } from '../../src/i18n/translations';
import { LOCALES } from '../../src/i18n/locales';
import { escapeHtml } from '../html';
import { localeHome } from '../urls';

export interface Crumb {
  label: string;
  /** Omit on the last crumb (the current page). */
  path?: string;
}

function renderBreadcrumbs(crumbs: Crumb[]): string {
  const items = crumbs.map((crumb, i) => {
    const label = escapeHtml(crumb.label);
    const last = i === crumbs.length - 1;
    const content = crumb.path && !last ? `<a href="${crumb.path}">${label}</a>` : label;
    return `<li${last ? ' aria-current="page"' : ''}>${content}</li>`;
  });
  return `<nav class="doc-crumbs" aria-label="Breadcrumb"><ol>${items.join('')}</ol></nav>`;
}

/** Schema.org breadcrumbs matching the visible trail. */
export function breadcrumbStructuredData(crumbs: Crumb[], siteUrl: string): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.path ? { item: `${siteUrl}${crumb.path}` } : {}),
    })),
  };
}

export function renderCta(locale: string, heading: string, body: string): string {
  const t = translator(locale as LanguageId);
  return `
      <section class="doc-cta">
        <h2>${escapeHtml(heading)}</h2>
        <p>${escapeHtml(body)}</p>
        <p class="doc-cta-actions">
          <a class="btn btn-primary btn-lg" href="/register${locale === 'en' ? '' : `?lang=${locale}`}">${escapeHtml(t('landing.getStarted'))}</a>
          <a class="btn btn-secondary btn-lg" href="/demo${locale === 'en' ? '' : `?lang=${locale}`}">${escapeHtml(t('landing.tryDemo'))}</a>
        </p>
      </section>`;
}

function renderFooter(locale: string): string {
  const t = translator(locale as LanguageId);
  const link = (href: string, label: string) => `<a href="${href}">${escapeHtml(label)}</a>`;

  // Every link stays inside the reader's own language. The vocabulary link appears only where the
  // decks carry that language (hasVocabPages) — a UI locale awaiting its deck column (Polish) links
  // to its guides but not to a /learn index that isn't generated.
  const links = [
    link(localeHome(locale), 'LinguaSwap'),
    ...(hasVocabPages(locale) ? [link(learnIndexPath(locale), t('landing.footerVocabulary'))] : []),
    link(guidePath(locale, 'spaced-repetition'), t('landing.footerGuides')),
    link(`/demo${locale === 'en' ? '' : `?lang=${locale}`}`, t('landing.tryDemo')),
    // English-only documents, so these two targets are identical in every locale — only the label
    // is translated. See src/content/legal.ts.
    link(legalPath('privacy'), t('landing.footerPrivacy')),
    link(legalPath('terms'), t('landing.footerTerms')),
  ];

  const languages = LOCALES.map((l) =>
    l.id === locale
      ? `<span>${escapeHtml(l.label)}</span>`
      : `<a href="${localeHome(l.id)}" hreflang="${l.id}">${escapeHtml(l.label)}</a>`,
  ).join('');

  return `
      <footer class="doc-footer">
        <nav class="doc-footer-links" aria-label="Site">${links.join('')}</nav>
        <nav class="doc-footer-langs" aria-label="Language">${languages}</nav>
      </footer>`;
}

export interface DocOptions {
  crumbs: Crumb[];
  heading: string;
  /** Intro paragraph under the h1. */
  lede: string;
  /** Pre-rendered HTML blocks, in order. */
  sections: string[];
  /** Drives the chrome's language and the footer's links. */
  locale: string;
}

export function renderDoc({ crumbs, heading, lede, sections, locale }: DocOptions): string {
  const t = translator(locale as LanguageId);
  return `
    <div class="doc">
      <header class="doc-header">
        <a class="brand" href="${localeHome(locale)}">LinguaSwap</a>
        <a class="btn btn-primary" href="/register${locale === 'en' ? '' : `?lang=${locale}`}">${escapeHtml(t('landing.getStarted'))}</a>
      </header>
      ${renderBreadcrumbs(crumbs)}
      <main class="doc-main">
        <h1>${escapeHtml(heading)}</h1>
        <p class="doc-lede">${escapeHtml(lede)}</p>
${sections.join('\n')}
      </main>
${renderFooter(locale)}
    </div>
  `;
}
