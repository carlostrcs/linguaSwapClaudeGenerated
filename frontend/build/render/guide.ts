// Renders a hand-written guide, its FAQ, cross-links to the other guides in the same locale, and
// the matching structured data.

import { guidePath } from '../../src/content/guides';
import { escapeHtml } from '../html';
import type { Guide } from '../content/guides/index';
import { guidesFor } from '../content/guides/index';
import { renderCta, renderDoc } from './doc';
import type { Crumb } from './doc';

export function guideCrumbs(guide: Guide, guidesLabel: string): Crumb[] {
  return [{ label: 'LinguaSwap', path: '/' }, { label: guidesLabel }, { label: guide.heading }];
}

export function renderGuide(locale: string, guide: Guide): string {
  const sections = guide.sections.map(
    (section) => `
      <section class="doc-section">
        <h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((p) => `        <p>${escapeHtml(p)}</p>`).join('\n')}
      </section>`,
  );

  const faq = `
      <section class="doc-section doc-faq">
        <h2>${escapeHtml(guide.faqHeading)}</h2>
${guide.faq
  .map(
    (item) => `        <div class="doc-faq-item">
          <h3>${escapeHtml(item.q)}</h3>
          <p>${escapeHtml(item.a)}</p>
        </div>`,
  )
  .join('\n')}
      </section>`;

  // Cross-links keep the guides a small connected cluster rather than three orphans.
  const others = guidesFor(locale).filter((g) => g.key !== guide.key);
  const more = `
      <section class="doc-section doc-related">
        <h2>${escapeHtml(guide.moreHeading)}</h2>
        <ul class="doc-links">
${others
  .map(
    (other) =>
      `          <li><a href="${guidePath(locale, other.key)}">${escapeHtml(guide.linkLabels[other.key])}</a></li>`,
  )
  .join('\n')}
        </ul>
      </section>`;

  return renderDoc({
    crumbs: guideCrumbs(guide, guide.moreHeading),
    heading: guide.heading,
    lede: guide.lede,
    sections: [...sections, faq, more, renderCta(locale, guide.heading, guide.lede)],
    locale,
  });
}

/**
 * `Article` + `FAQPage`. The FAQ block is the one most likely to be surfaced directly, both as a
 * Google rich result and as a quotable answer for an AI assistant — which is why the questions are
 * phrased the way people actually ask them.
 */
export function guideStructuredData(guide: Guide, locale: string, url: string): unknown[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.heading,
      description: guide.description,
      url,
      inLanguage: locale,
      author: { '@type': 'Organization', name: 'LinguaSwap' },
      publisher: { '@type': 'Organization', name: 'LinguaSwap' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale,
      mainEntity: guide.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];
}
