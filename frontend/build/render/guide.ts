// Renders a hand-written guide, plus its FAQ and the matching structured data.

import { escapeHtml } from '../html';
import type { Guide } from '../content/guides';
import { renderCta, renderDoc } from './doc';

export function renderGuide(guide: Guide): string {
  const sections = guide.sections.map(
    (section) => `
      <section class="doc-section">
        <h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((p) => `        <p>${escapeHtml(p)}</p>`).join('\n')}
      </section>`,
  );

  const faq = `
      <section class="doc-section doc-faq">
        <h2>Common questions</h2>
${guide.faq
  .map(
    (item) => `        <div class="doc-faq-item">
          <h3>${escapeHtml(item.q)}</h3>
          <p>${escapeHtml(item.a)}</p>
        </div>`,
  )
  .join('\n')}
      </section>`;

  return renderDoc({
    crumbs: [{ label: 'Home', path: '/' }, { label: 'Guides' }, { label: guide.heading }],
    heading: guide.heading,
    lede: guide.lede,
    sections: [
      ...sections,
      faq,
      renderCta(
        'Put it into practice',
        'LinguaSwap schedules your vocabulary with a Leitner system, in whichever language direction you are learning.',
      ),
    ],
  });
}

/**
 * `Article` + `FAQPage`. The FAQ block is the one most likely to be surfaced directly, both as a
 * Google rich result and as a quotable answer for an AI assistant — which is why the questions are
 * phrased the way people actually ask them.
 */
export function guideStructuredData(guide: Guide, url: string): unknown[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.heading,
      description: guide.description,
      url,
      inLanguage: 'en',
      author: { '@type': 'Organization', name: 'LinguaSwap' },
      publisher: { '@type': 'Organization', name: 'LinguaSwap' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];
}
