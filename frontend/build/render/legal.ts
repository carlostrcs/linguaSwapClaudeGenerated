// Renders a legal document, plus links to the other two so they form one small cluster.
//
// Reuses `renderDoc`, so these pages get the same chrome, breadcrumbs and footer as the guides and
// ship no JavaScript. They are always rendered in English (see src/content/legal.ts for why), so
// the locale passed to the chrome is always 'en'.

import { LEGAL_KEYS, legalPath } from '../../src/content/legal';
import type { LegalKey } from '../../src/content/legal';
import { escapeHtml } from '../html';
import { legalDoc } from '../content/legal';
import type { LegalDoc } from '../content/legal';
import { renderDoc } from './doc';
import type { Crumb } from './doc';

const LINK_LABELS: Record<LegalKey, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  refunds: 'Cancellation & Refunds',
};

export function legalLabel(key: LegalKey): string {
  return LINK_LABELS[key];
}

export function legalCrumbs(doc: LegalDoc): Crumb[] {
  return [{ label: 'LinguaSwap', path: '/' }, { label: doc.heading }];
}

export function renderLegal(doc: LegalDoc): string {
  const sections = doc.sections.map((section) => {
    const paragraphs = (section.paragraphs ?? [])
      .map((p) => `        <p>${escapeHtml(p)}</p>`)
      .join('\n');
    const bullets = section.bullets?.length
      ? `        <ul class="doc-list">\n${section.bullets
          .map((b) => `          <li>${escapeHtml(b)}</li>`)
          .join('\n')}\n        </ul>`
      : '';

    return `
      <section class="doc-section">
        <h2>${escapeHtml(section.heading)}</h2>
${[paragraphs, bullets].filter(Boolean).join('\n')}
      </section>`;
  });

  const others = LEGAL_KEYS.filter((key) => key !== doc.key);
  sections.push(`
      <section class="doc-section doc-related">
        <h2>Related</h2>
        <ul class="doc-links">
${others
  .map(
    (key) =>
      `          <li><a href="${legalPath(key)}">${escapeHtml(legalDoc(key).heading)}</a></li>`,
  )
  .join('\n')}
        </ul>
      </section>`);

  return renderDoc({
    crumbs: legalCrumbs(doc),
    heading: doc.heading,
    lede: doc.lede,
    sections,
    locale: 'en',
  });
}
