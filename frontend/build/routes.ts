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
import { guidePath } from '../src/content/guides';
import { legalPath } from '../src/content/legal';
import { guidesFor, verifyGuideCoverage } from './content/guides/index';
import { LEGAL_DOCS, isDraft } from './content/legal';
import { renderLegal } from './render/legal';
import { MIN_DECK_ENTRIES, SAMPLE_ROWS, publishableDecks } from './content/topics';
import { VOCAB_LOCALES, learnIndexPath, learnTargetPath, learnTopicPath } from '../src/content/learn';
import { learnStrings, verifyLearnCoverage } from './content/learn-strings/index';
import { interpolate } from '../src/i18n/interpolate';
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
  targetsFor,
  topicCrumbs,
} from './render/learn';
import { APP_SHELL_FILE, NOT_FOUND_FILE, SITE_URL } from './site';
import { alternatesFor, homeAlternates, localeHome, outputFileFor } from './urls';
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
      // Every locale homepage boots the SPA, not just `/`. They are the app's entry point in that
      // language: the language picker navigates here, and a logged-in visitor must get the
      // logged-in landing rather than the static logged-out snapshot baked in at build time.
      spa: true,
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
      `linguaswap-seo: ${skipped} deck(s) skipped — no slug map entry, or under ${MIN_DECK_ENTRIES} entries.`,
    );
  }

  verifyLearnCoverage(decks.map((d) => d.slug));

  // Only locales whose deck column exists get vocabulary pages: a /learn page reads entry.t[locale]
  // and entry.t[target], and analysePair .normalize()s them, so a locale without deck coverage would
  // crash the build. A new UI locale (Polish) ships its homepage + guides first and joins this matrix
  // when its deck column lands (add it to VOCAB_LOCALES + DECK_LANGS together).
  const locales = LOCALES.map((l) => l.id).filter((id) => VOCAB_LOCALES.includes(id));
  const pages: PageSpec[] = [];

  for (const locale of locales) {
    const s = learnStrings(locale);
    const targets = targetsFor(locale, locales);
    const totalWords = decks.reduce((n, deck) => n + deck.entries.length, 0);
    const indexPath = learnIndexPath(locale);

    pages.push({
      path: indexPath,
      file: outputFileFor(indexPath),
      lang: locale,
      title: s.indexTitle,
      description: interpolate(s.indexDescription, {
        topics: decks.length,
        languages: locales.length,
      }),
      // The index exists in every locale, so the whole set is one hreflang cluster.
      alternates: alternatesFor(new Map(locales.map((l) => [l, learnIndexPath(l)]))),
      structuredData: [breadcrumbStructuredData(learnCrumbs(locale), SITE_URL)],
      body: renderLearnIndex(locale, decks, locales),
      spa: false,
      sitemapShard: locale,
    });

    for (const target of targets) {
      const hubPath = learnTargetPath(locale, target);
      // Cluster key is the TARGET language: "learn Spanish" exists for every reader whose own
      // language is not Spanish, so the cluster has five members rather than six.
      const hubCluster = new Map(
        locales.filter((l) => l !== target).map((l) => [l, learnTargetPath(l, target)]),
      );

      pages.push({
        path: hubPath,
        file: outputFileFor(hubPath),
        lang: locale,
        title: interpolate(s.hubTitle, {
          language: s.languageNamesCap[target],
          topics: decks.length,
        }),
        description: interpolate(s.hubDescription, {
          words: totalWords,
          language: s.languageNames[target],
          topics: decks.length,
        }),
        alternates: alternatesFor(hubCluster),
        structuredData: [breadcrumbStructuredData(targetCrumbs(locale, target), SITE_URL)],
        body: renderTargetHub(locale, target, decks, locales),
        spa: false,
        sitemapShard: locale,
      });

      for (const deck of decks) {
        const path = learnTopicPath(locale, target, deck.slug);
        const shown = Math.min(SAMPLE_ROWS, deck.entries.length);

        pages.push({
          path,
          file: outputFileFor(path),
          lang: locale,
          title: interpolate(s.topicTitle, {
            language: s.languageNamesCap[target],
            topic: s.topicNouns[deck.slug],
            count: deck.entries.length,
          }),
          description: interpolate(s.topicDescription, {
            shown,
            language: s.languageNames[target],
            topic: s.topicNouns[deck.slug],
            count: deck.entries.length,
          }),
          alternates: alternatesFor(
            new Map(
              locales.filter((l) => l !== target).map((l) => [l, learnTopicPath(l, target, deck.slug)]),
            ),
          ),
          structuredData: [
            breadcrumbStructuredData(topicCrumbs(locale, target, deck), SITE_URL),
            topicStructuredData(locale, target, deck, absoluteUrl(SITE_URL, path)),
          ],
          body: renderTopicPage(locale, target, deck, decks, locales),
          spa: false,
          sitemapShard: locale,
        });
      }
    }
  }

  return pages;
}

/**
 * `DefinedTermSet` is the correct schema.org type for a bilingual glossary. It is not a Google
 * rich-result type, so it wins no snippet — but it is exactly the structure an LLM crawler can
 * read a word list out of, which is half the point of this work.
 */
function topicStructuredData(locale: string, target: string, deck: Deck, url: string): unknown {
  const s = learnStrings(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: interpolate(s.topicHeading, {
      language: s.languageNames[target],
      topic: s.topicNouns[deck.slug],
      count: deck.entries.length,
    }),
    description: deck.description,
    url,
    inLanguage: locale,
    hasDefinedTerm: deck.entries.slice(0, SAMPLE_ROWS).map((entry) => ({
      '@type': 'DefinedTerm',
      name: entry.t[target],
      inDefinedTermSet: url,
      description: entry.t[locale],
    })),
  };
}

/**
 * The hand-written guides, in every locale.
 *
 * This is pure translation rather than a content matrix: one article, six languages, six URLs.
 * It is also what makes a non-English homepage coherent — before this, `/es` could only link to
 * English articles, which is a worse experience than not linking at all.
 */
function guidePages(): PageSpec[] {
  verifyGuideCoverage();

  return LOCALES.flatMap((locale) =>
    guidesFor(locale.id).map((guide) => {
      const path = guidePath(locale.id, guide.key);
      // One cluster per guide: the same article in six languages, each linking to all the others.
      const alternates = alternatesFor(
        new Map(LOCALES.map((l) => [l.id, guidePath(l.id, guide.key)])),
      );

      return {
        path,
        file: outputFileFor(path),
        lang: locale.id,
        title: guide.title,
        description: guide.description,
        alternates,
        structuredData: guideStructuredData(guide, locale.id, absoluteUrl(SITE_URL, path)),
        body: renderGuide(locale.id, guide),
        spa: false,
        sitemapShard: locale.id,
      };
    }),
  );
}

/**
 * Privacy, terms and refunds. English-only and un-prefixed (see `src/content/legal.ts`), so there
 * is no hreflang cluster: one document, one URL, linked from every locale's footer.
 *
 * While the operator details are still placeholders the pages are emitted `noindex` and kept out of
 * the sitemap, so a half-finished policy cannot be indexed as though it were the real thing.
 */
function legalPages(): PageSpec[] {
  const draft = isDraft();

  return LEGAL_DOCS.map((doc) => {
    const path = legalPath(doc.key);
    return {
      path,
      file: outputFileFor(path),
      lang: 'en',
      title: doc.title,
      description: doc.description,
      robots: draft ? 'noindex, nofollow' : undefined,
      body: renderLegal(doc),
      spa: false,
      sitemapShard: draft ? undefined : 'en',
    };
  });
}

export function buildPages(snapshot: DeckSnapshot): PageSpec[] {
  return [
    ...homePages(),
    ...learnPages(snapshot),
    ...guidePages(),
    ...legalPages(),
    ...appPages(),
    ...shellPages(),
  ];
}
