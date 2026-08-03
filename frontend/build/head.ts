// Builds the `<head>` block injected into each generated page.
//
// Every element carries PRERENDER_MARK so `<Seo/>` can remove them once React mounts — see the
// comment there for why that matters (React 19 hoists its own metadata but does not de-duplicate
// against what is already in the document).

import { OG_IMAGE } from '../src/content/seo';
import { SITE_NAME, absoluteUrl } from '../src/content/site';
import { PRERENDER_MARK, SITE_URL } from './site';
import { escapeHtml, jsonLd } from './html';

export interface HeadOptions {
  title: string;
  description: string;
  /** Site-root-relative path; becomes the absolute self-canonical. */
  path: string;
  robots?: string;
  /** BCP-47-ish language of the page itself. */
  lang?: string;
  /** `hreflang` cluster: every member including self, plus an `x-default` entry. */
  alternates?: { hreflang: string; path: string }[];
  /** Schema.org objects, emitted as one `<script type="application/ld+json">` each. */
  structuredData?: unknown[];
}

function meta(kind: 'name' | 'property', key: string, value: string): string {
  return `<meta ${kind}="${key}" content="${escapeHtml(value)}" ${PRERENDER_MARK}>`;
}

export function buildHead(options: HeadOptions): string {
  const { title, description, path, robots = 'index,follow', alternates = [] } = options;
  const canonical = absoluteUrl(SITE_URL, path);
  const image = absoluteUrl(SITE_URL, OG_IMAGE);

  const lines = [
    `<title ${PRERENDER_MARK}>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    meta('name', 'robots', robots),
    `<link rel="canonical" href="${escapeHtml(canonical)}" ${PRERENDER_MARK}>`,

    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('property', 'og:url', canonical),
    meta('property', 'og:image', image),

    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
    meta('name', 'twitter:image', image),
  ];

  // NOTE: hreflang and JSON-LD are deliberately NOT marked with PRERENDER_MARK.
  //
  // The marker exists so `<Seo/>` can remove tags React is about to render again — otherwise the
  // page ends up with two titles. React renders neither of these, so marking them would mean
  // `<Seo/>` deleted them on mount and Google's renderer (which does run JavaScript) would find a
  // page with no structured data and no hreflang. They must survive hydration.
  for (const alt of alternates) {
    const href = escapeHtml(absoluteUrl(SITE_URL, alt.path));
    lines.push(`<link rel="alternate" hreflang="${alt.hreflang}" href="${href}">`);
  }

  // Emitted here rather than from `<Seo/>` because React only hoists `<script>` when it is
  // `async`, which a JSON-LD block is not — it would render inline in the body instead.
  for (const data of options.structuredData ?? []) {
    lines.push(`<script type="application/ld+json">${jsonLd(data)}</script>`);
  }

  return lines.map((line) => `    ${line}`).join('\n');
}

/** The site-level graph, attached to every locale homepage. */
export function siteStructuredData(): unknown[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: ['en', 'es', 'fr', 'de', 'it', 'pt'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any (web browser)',
      description:
        'Vocabulary practice with Leitner spaced repetition. Build word libraries across English, Spanish, French, German, Italian and Portuguese and drill them in any direction.',
      featureList: [
        'Leitner spaced repetition scheduling',
        'Practise any language direction',
        'Curated vocabulary libraries by topic',
        'Accent-sensitive answer checking',
        'Progress and accuracy statistics',
      ],
      offers: [
        {
          '@type': 'Offer',
          category: 'free',
          price: '0',
          priceCurrency: 'EUR',
          description: 'Free plan: up to 5 libraries and 500 words each, with spaced repetition.',
        },
      ],
    },
  ];
}
