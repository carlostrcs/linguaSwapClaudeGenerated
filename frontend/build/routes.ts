// The manifest: every HTML file the generator emits.
//
// One array is the single source for the emitted files, the sitemap and the `vercel.json`
// coverage check, so a page cannot exist in one and be missing from another.

import { APP_SEO, HOME_SEO_KEYS, NOT_FOUND_SEO, ROUTE_SEO } from '../src/content/seo';
import { absoluteUrl } from '../src/content/site';
import { LOCALES } from '../src/i18n/locales';
import { translator } from '../src/i18n/interpolate';
import type { LanguageId } from '../src/i18n/translations';
import { siteStructuredData } from './head';
import type { Deck, DeckSnapshot } from './decks';
import { GUIDES, guidePath } from './content/guides';
import {
  MIN_DECK_ENTRIES,
  SAMPLE_ROWS,
  TARGETS,
  TOPIC_NOUNS,
  learnIndexPath,
  publishableDecks,
  targetPath,
  topicPath,
} from './content/topics';
import type { Target } from './content/topics';
import { renderLanding } from './render/landing';
import { renderDemoIntro } from './render/demo';
import { breadcrumbStructuredData } from './render/doc';
import { guideStructuredData, renderGuide } from './render/guide';
import {
  learnCrumbs,
  renderLearnIndex,
  renderTargetHub,
  renderTopicPage,
  targetCrumbs,
  topicCrumbs,
  topicHeading,
} from './render/learn';
import { APP_SHELL_FILE, NOT_FOUND_FILE, SITE_URL } from './site';
import { homeAlternates, localeHome, outputFileFor } from './urls';
import type { Alternate } from './urls';

export interface PageSpec {
  /** Site-root-relative URL. Empty for files that are only rewrite targets (`app.html`). */
  path: string;
  /** `dist`-relative output file. */
  file: string;
  lang: string;
  title: string;
  description: string;
  robots?: string;
  alternates?: Alternate[];
  structuredData?: unknown[];
  /** Markup for the container. Empty means head-only (the SPA renders everything). */
  body: string;
  /** Keeps the SPA scripts and the `#root` container. */
  spa: boolean;
  /** Listed in a sitemap, and if so in which shard. */
  sitemapShard?: string;
}

/** One indexable homepage per locale: `/` for English, `/es`, `/fr`, … for the rest. */
function homePages(): PageSpec[] {
  const alternates = homeAlternates();

  return LOCALES.map((locale) => {
    const t = translator(locale.id as LanguageId);
    const path = localeHome(locale.id);

    return {
      path,
      file: outputFileFor(path),
      lang: locale.id,
      title: t(HOME_SEO_KEYS.title),
      description: t(HOME_SEO_KEYS.description),
      alternates,
      structuredData: siteStructuredData(),
      body: renderLanding(locale.id),
      // English `/` is also the SPA entry point, so it keeps the scripts. The localized homepages
      // are pure content: no bundle, no boot, nothing to hydrate.
      spa: locale.id === 'en',
      sitemapShard: locale.id,
    };
  });
}

/** The app's own public routes. Head-only unless there is something worth prerendering. */
function appPages(): PageSpec[] {
  const bodies: Partial<Record<string, string>> = { '/demo': renderDemoIntro() };
  const inSitemap = new Set(['/demo', '/register']);

  return (Object.keys(ROUTE_SEO) as (keyof typeof ROUTE_SEO)[]).map((path) => {
    const seo = ROUTE_SEO[path];
    return {
      path,
      file: outputFileFor(path),
      lang: 'en',
      title: seo.title,
      description: seo.description,
      robots: 'robots' in seo ? seo.robots : undefined,
      body: bodies[path] ?? '',
      spa: true,
      sitemapShard: inSitemap.has(path) ? 'app' : undefined,
    };
  });
}

/**
 * The SPA fallback and the 404 page.
 *
 * `app.html` exists so the catch-all rewrite does not point at `index.html`: once `index.html` is
 * the real landing page, every junk URL would otherwise return the full homepage at HTTP 200 —
 * a soft-404 farm that teaches crawlers infinite valid URLs exist.
 */
function shellPages(): PageSpec[] {
  return [
    { path: '', file: APP_SHELL_FILE, lang: 'en', ...APP_SEO, body: '', spa: true },
    { path: '', file: NOT_FOUND_FILE, lang: 'en', ...NOT_FOUND_SEO, body: '', spa: true },
  ];
}

/**
 * The generated vocabulary pages — the part of the site that has a chance of ranking for what
 * people actually search ("spanish travel vocabulary"), built from the curated decks.
 *
 * English-source only for now. Adding a source locale needs the page prose translated AND the deck
 * `notes` translated (they are English glosses of the English headword), so it is a wave of its
 * own rather than a loop over LOCALES.
 */
function learnPages(snapshot: DeckSnapshot): PageSpec[] {
  const decks = publishableDecks(snapshot.decks);
  const skipped = snapshot.decks.length - decks.length;
  if (skipped > 0) {
    // A warning, not an error: the backend must be able to add a deck without breaking this build.
    console.warn(
      `linguaswap-seo: ${skipped} deck(s) skipped — no slug in TOPIC_SLUGS, or under ${MIN_DECK_ENTRIES} entries.`,
    );
  }

  const pages: PageSpec[] = [
    {
      path: learnIndexPath(),
      file: outputFileFor(learnIndexPath()),
      lang: 'en',
      title: 'Vocabulary lists by language and topic | LinguaSwap',
      description:
        'Curated vocabulary lists for Spanish, French, German, Italian and Portuguese — travel, food, work, health, slang and the most common words, with spaced repetition to make them stick.',
      structuredData: [breadcrumbStructuredData(learnCrumbs(), SITE_URL)],
      body: renderLearnIndex(decks),
      spa: false,
      sitemapShard: 'learn',
    },
  ];

  for (const target of TARGETS) {
    const words = decks.reduce((n, deck) => n + deck.entries.length, 0);
    pages.push({
      path: targetPath(target),
      file: outputFileFor(targetPath(target)),
      lang: 'en',
      title: `Learn ${target.name} vocabulary — ${decks.length} curated word lists | LinguaSwap`,
      description:
        `${words} curated ${target.name} words across ${decks.length} topics, each paired with its English ` +
        'equivalent and scheduled for review by a Leitner spaced-repetition system.',
      structuredData: [breadcrumbStructuredData(targetCrumbs(target), SITE_URL)],
      body: renderTargetHub(target, decks),
      spa: false,
      sitemapShard: 'learn',
    });

    for (const deck of decks) {
      const path = topicPath(target, deck);
      pages.push({
        path,
        file: outputFileFor(path),
        lang: 'en',
        title: `${topicHeading(target, deck)} — ${deck.entries.length} words | LinguaSwap`,
        description:
          `${Math.min(SAMPLE_ROWS, deck.entries.length)} ${target.name} ${TOPIC_NOUNS[deck.slug]} words with ` +
          `their English translations, from a curated library of ${deck.entries.length}. Practise them in ` +
          'either direction with spaced repetition.',
        structuredData: [
          breadcrumbStructuredData(topicCrumbs(target, deck), SITE_URL),
          topicStructuredData(target, deck, absoluteUrl(SITE_URL, path)),
        ],
        body: renderTopicPage(target, deck, decks),
        spa: false,
        sitemapShard: 'learn',
      });
    }
  }

  return pages;
}

/**
 * `DefinedTermSet` is the correct schema.org type for a bilingual glossary. It is not a Google
 * rich-result type, so it wins no snippet — but it is exactly the structure an LLM crawler can
 * read a word list out of, which is half the point of this work.
 */
function topicStructuredData(target: Target, deck: Deck, url: string): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: `${topicHeading(target, deck)}`,
    description: deck.description,
    url,
    inLanguage: 'en',
    hasDefinedTerm: deck.entries.slice(0, SAMPLE_ROWS).map((entry) => ({
      '@type': 'DefinedTerm',
      name: entry.t[target.id],
      inDefinedTermSet: url,
      description: entry.n ? `${entry.t.en} — ${entry.n}` : entry.t.en,
    })),
  };
}

function guidePages(): PageSpec[] {
  return GUIDES.map((guide) => {
    const path = guidePath(guide.slug);
    return {
      path,
      file: outputFileFor(path),
      lang: 'en',
      title: guide.title,
      description: guide.description,
      structuredData: guideStructuredData(guide, absoluteUrl(SITE_URL, path)),
      body: renderGuide(guide),
      spa: false,
      sitemapShard: 'guides',
    };
  });
}

export function buildPages(snapshot: DeckSnapshot): PageSpec[] {
  return [
    ...homePages(),
    ...learnPages(snapshot),
    ...guidePages(),
    ...appPages(),
    ...shellPages(),
  ];
}
