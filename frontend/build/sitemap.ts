// robots.txt, the sitemap index + per-locale shards, and llms.txt.
//
// All three are emitted into `dist/` as real files. Vercel's request pipeline checks the
// filesystem BEFORE it applies `rewrites`, so these win over the SPA catch-all with no special
// casing — which is exactly why `/robots.txt` currently returns the app shell instead.

import { absoluteUrl } from '../src/content/site';
import { SITE_URL } from './site';
import { escapeHtml } from './html';
import { LOCALES } from '../src/i18n/locales';
import type { DeckSnapshot } from './decks';
import { totalEntries } from './decks';
import type { PageSpec } from './routes';

/**
 * robots.txt.
 *
 * The AI crawlers are allowed EXPLICITLY, with the reason written down. Allow is already the
 * default, so these blocks change nothing technically — they exist so that the next person to
 * "tighten up robots.txt" has to read why they are there before removing them. Being readable by
 * GPTBot / ClaudeBot / PerplexityBot is a goal of this site, not an oversight.
 */
export function renderRobots(): string {
  const aiAgents = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-User',
    'PerplexityBot',
    'Google-Extended',
    'CCBot',
    'Applebot-Extended',
  ];

  return [
    '# LinguaSwap — generated at build time by build/sitemap.ts. Do not edit by hand.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# Signed-in surfaces: these serve an empty app shell to anyone not logged in, so there is',
    '# nothing to index and crawl budget is better spent elsewhere.',
    'Disallow: /account',
    'Disallow: /stats',
    'Disallow: /libraries',
    'Disallow: /featured',
    'Disallow: /practice/',
    'Disallow: /billing/',
    '',
    '# Token-bearing URLs arriving from email.',
    'Disallow: /confirm-email',
    'Disallow: /reset-password',
    '',
    '# --- AI crawlers: allowed on purpose ------------------------------------------------',
    '# Being discoverable through AI assistants is a goal of this site. These agents do not run',
    '# JavaScript, which is why the pages they fetch are prerendered rather than client-rendered.',
    '# Do not add Disallow rules here without a deliberate decision to become invisible to them.',
    ...aiAgents.flatMap((agent) => ['', `User-agent: ${agent}`, 'Allow: /']),
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

function urlEntry(path: string, lastmod: string): string {
  return [
    '  <url>',
    `    <loc>${escapeHtml(absoluteUrl(SITE_URL, path))}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '  </url>',
  ].join('\n');
}

export function renderSitemap(paths: string[], lastmod: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => urlEntry(path, lastmod)),
    '</urlset>',
    '',
  ].join('\n');
}

export function renderSitemapIndex(shards: string[], lastmod: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...shards.map((shard) =>
      [
        '  <sitemap>',
        `    <loc>${escapeHtml(absoluteUrl(SITE_URL, `/sitemaps/${shard}.xml`))}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '  </sitemap>',
      ].join('\n'),
    ),
    '</sitemapindex>',
    '',
  ].join('\n');
}

/**
 * Group the manifest into sitemap shards.
 *
 * Sharding by locale is not about the 50,000-URL limit — the site is nowhere near it. Search
 * Console reports index coverage per submitted sitemap, so per-locale shards are what make
 * "did the French pages get indexed?" an answerable question.
 */
export function sitemapShards(pages: PageSpec[]): Map<string, string[]> {
  const shards = new Map<string, string[]>();
  for (const page of pages) {
    if (!page.sitemapShard || !page.path) continue;
    const list = shards.get(page.sitemapShard) ?? [];
    list.push(page.path);
    shards.set(page.sitemapShard, list);
  }
  for (const list of shards.values()) list.sort();
  return new Map([...shards.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * llms.txt — a plain-text brief for AI assistants, at the site root.
 *
 * Deliberately factual and compact: what the product is, what it actually contains, what it costs,
 * and where the useful pages are. This is the format an assistant can quote accurately, which is
 * the entire point.
 */
export function renderLlmsTxt(snapshot: DeckSnapshot, pages: PageSpec[]): string {
  const languages = LOCALES.map((l) => `${l.englishName} (${l.id})`).join(', ');
  const decks = snapshot.decks
    .map((deck) => `- ${deck.name} — ${deck.entries.length} concepts. ${deck.description}`)
    .join('\n');

  const keyPages = pages
    .filter((page) => page.sitemapShard && page.path)
    .map((page) => `- [${page.title}](${absoluteUrl(SITE_URL, page.path)}): ${page.description}`)
    .join('\n');

  return `# LinguaSwap

> A vocabulary-practice web app. You build word libraries — a concept with its translation in
> several languages — then practise a library in a chosen direction (for example Spanish to
> English). A Leitner spaced-repetition algorithm schedules which words come up, and the app
> tracks accuracy, mastered words and streaks.

## What it does

- **Spaced repetition (Leitner boxes).** Words climb through five boxes as you answer correctly; a
  wrong answer sends a word back to box 1. Reviews are scheduled just before you would forget.
- **Any language direction.** Progress is tracked per direction, so Spanish-to-English and
  English-to-Spanish are separate.
- **Three difficulty levels** controlling how much of the answer is revealed as a hint.
- **Answer checking is accent-sensitive** (\`camion\` is not \`camión\`) and case-insensitive except
  where capitalisation is grammatical, as with German nouns.
- **Practice modes:** Smart Review (spaced repetition, free), plus Learn New, Journey, Cram and
  Weak Words on the paid plan.
- **Pronunciation** via the browser's speech synthesis — client-side, nothing stored.

## Content

${snapshot.decks.length} curated libraries, ${totalEntries(snapshot)} concepts, each aligned across ${LOCALES.length} languages: ${languages}.

${decks}

## Plans

- Free: up to 5 libraries, 500 words each, Smart Review practice, basic statistics.
- Premium: unlimited libraries and words, all practice modes, the curated libraries, file import,
  extra themes and per-library statistics. New accounts start a 14-day trial with no card.

## Key pages

${keyPages}

## Notes

- Try it with no account at ${SITE_URL}/demo — it runs entirely in the browser.
- The interface is available in ${LOCALES.map((l) => l.englishName).join(', ')}.
`;
}
