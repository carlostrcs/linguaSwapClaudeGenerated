// The build-time page generator.
//
// WHY THIS EXISTS: the app is a client-rendered SPA, so the HTML it serves is an empty
// `<div id="root">`. Google can render JavaScript; the AI crawlers cannot — GPTBot, ClaudeBot and
// PerplexityBot fetch raw HTML once, take what is there, and move on. Before this plugin, every
// page of the site was a blank document to them.
//
// WHAT IT DOES: after Vite has written `dist/`, it reads the built shell (which already carries
// the hashed asset tags) and emits one real HTML file per URL — each with its own `<head>` and,
// where it is worth having, real body markup.
//
// WHY `writeBundle` AND NOT `transformIndexHtml`: `transformIndexHtml` only ever produces the one
// entry HTML, and hooks into Vite's internal HTML pipeline ordering. By `writeBundle` the build
// output is on disk, so this is a single code path that reads a finished file and writes ~15 more.
// It also means `vite dev` shows the plain SPA, which is what you want — stale generated markup in
// front of the dev server is a nasty thing to debug.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

import { buildHead } from './head';
import { buildPages } from './routes';
import type { PageSpec } from './routes';
import { parseShell, renderPage } from './shell';
import { loadDecks, totalEntries } from './decks';
import {
  renderLlmsTxt,
  renderRobots,
  renderSitemap,
  renderSitemapIndex,
  sitemapShards,
} from './sitemap';
import { SITE_URL } from './site';
import { stampServiceWorker } from './sw';
import { verifyPages, verifyVercelCoverage } from './verify';

function write(outDir: string, file: string, contents: string): void {
  const target = join(outDir, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
}

function renderSpec(spec: PageSpec, shell: ReturnType<typeof parseShell>): string {
  return renderPage({
    shell,
    lang: spec.lang,
    head: buildHead({
      title: spec.title,
      description: spec.description,
      path: spec.path || '/',
      robots: spec.robots,
      alternates: spec.alternates,
      structuredData: spec.structuredData,
    }),
    body: spec.body,
    spa: spec.spa,
  });
}

export function seoPlugin(): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'linguaswap-seo',
    apply: 'build',

    configResolved(resolved) {
      config = resolved;
    },

    writeBundle() {
      const root = config.root;
      const outDir = resolve(root, config.build.outDir);

      const snapshot = loadDecks(join(root, 'content', 'decks.json'));
      const pages = buildPages(snapshot);
      const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')) as Record<string, never>;

      verifyPages(pages);
      verifyVercelCoverage(pages, vercel);

      const shell = parseShell(readFileSync(join(outDir, 'index.html'), 'utf8'));

      for (const spec of pages) write(outDir, spec.file, renderSpec(spec, shell));

      // `lastmod` comes from the committed snapshot, never `new Date()`: a timestamp that changes
      // on every deploy churns every URL and trains crawlers to ignore the field entirely.
      const lastmod = snapshot.generatedAt;
      const shards = sitemapShards(pages);

      for (const [shard, paths] of shards) {
        write(outDir, `sitemaps/${shard}.xml`, renderSitemap(paths, lastmod));
      }
      write(outDir, 'sitemap.xml', renderSitemapIndex([...shards.keys()], lastmod));
      write(outDir, 'robots.txt', renderRobots());
      write(outDir, 'llms.txt', renderLlmsTxt(snapshot, pages));

      // After the pages exist: the worker precaches the shell it will serve offline.
      stampServiceWorker(outDir, pages, vercel);

      const indexable = pages.filter((p) => p.sitemapShard).length;
      config.logger.info(
        `\nlinguaswap-seo  ${pages.length} pages (${indexable} in ${shards.size} sitemaps) · ` +
          `${snapshot.decks.length} decks / ${totalEntries(snapshot)} concepts · ${SITE_URL}`,
      );
    },
  };
}
