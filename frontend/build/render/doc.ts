// Shared chrome for the generated content pages.
//
// These pages ship NO JavaScript — they reuse the app's stylesheet and nothing else. That is the
// point: they are the fastest pages on the site and the only ones a non-JS crawler can read in
// full. Keeping the chrome in one place also keeps the internal link graph consistent, which is
// what stops a set of generated pages from looking like an orphaned doorway farm.

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

export function renderCta(heading: string, body: string): string {
  return `
      <section class="doc-cta">
        <h2>${escapeHtml(heading)}</h2>
        <p>${escapeHtml(body)}</p>
        <p class="doc-cta-actions">
          <a class="btn btn-primary btn-lg" href="/register">Create a free account</a>
          <a class="btn btn-secondary btn-lg" href="/demo">Try the demo — no account</a>
        </p>
      </section>`;
}

function renderFooter(): string {
  const languages = LOCALES.map(
    (locale) =>
      `<a href="${localeHome(locale.id)}" hreflang="${locale.id}">${escapeHtml(locale.label)}</a>`,
  ).join('');

  return `
      <footer class="doc-footer">
        <nav class="doc-footer-links" aria-label="Site">
          <a href="/">Home</a>
          <a href="/learn">All vocabulary lists</a>
          <a href="/guides/spaced-repetition">How spaced repetition works</a>
          <a href="/demo">Demo</a>
          <a href="/register">Create a free account</a>
        </nav>
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
}

export function renderDoc({ crumbs, heading, lede, sections }: DocOptions): string {
  return `
    <div class="doc">
      <header class="doc-header">
        <a class="brand" href="/">LinguaSwap</a>
        <a class="btn btn-primary" href="/register">Create a free account</a>
      </header>
      ${renderBreadcrumbs(crumbs)}
      <main class="doc-main">
        <h1>${escapeHtml(heading)}</h1>
        <p class="doc-lede">${escapeHtml(lede)}</p>
${sections.join('\n')}
      </main>
${renderFooter()}
    </div>
  `;
}
