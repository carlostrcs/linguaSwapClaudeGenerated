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

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

import { buildHead } from './head';
import { buildPages } from './routes';
import { isDraft } from './content/legal';
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
  let devPages: Map<string, PageSpec> | null = null;

  /** The generated pages, keyed by URL. Built once per dev server, on first miss. */
  function pagesByPath(root: string): Map<string, PageSpec> {
    devPages ??= new Map(
      buildPages(loadDecks(join(root, 'content', 'decks.json')))
        .filter((page) => page.path)
        .map((page) => [page.path, page]),
    );
    return devPages;
  }

  return {
    name: 'linguaswap-seo',
    // NOT `apply: 'build'`: `writeBundle` is build-only anyway, and the dev server needs
    // `configureServer` below.

    configResolved(resolved) {
      config = resolved;
    },

    /**
     * Serve the generated pages in `vite dev` too.
     *
     * Without this the dev server answers `/privacy`, `/learn` and `/guides/**` with the SPA shell,
     * React Router matches no route, and every one of those links — all of which are in the site
     * footer — renders the 404 page. The pages were fine; only dev was lying about them, which is a
     * miserable way to find out that a footer link "works in production".
     *
     * Renders from the same `buildPages()` the real build uses, so what you click in dev is what
     * gets emitted. SPA pages are left alone for Vite's own fallback to handle.
     */
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        let pathname: string;
        try {
          pathname = decodeURI(new URL(req.url, 'http://localhost').pathname);
        } catch {
          return next();
        }
        pathname = pathname.replace(/\/+$/, '') || '/';

        const page = pagesByPath(server.config.root).get(pathname);
        if (!page || page.spa) return next();

        // In dev there is no hashed stylesheet to link, and `?direct` is how Vite serves raw CSS
        // (the bare path returns a JS module that injects it).
        const shell = { headBase: '    <link rel="stylesheet" href="/src/index.css?direct" />', scripts: '' };
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderPage({ shell, lang: page.lang, head: buildHead({
          title: page.title,
          description: page.description,
          path: page.path,
          robots: page.robots,
        }), body: page.body, spa: false }));
      });
    },

    /**
     * Same problem, different server: `vite preview` serves `dist/` with an SPA fallback that
     * swallows extensionless paths, so `/privacy` and `/learn` return the app shell even though the
     * real files are sitting right there on disk. This applies Vercel's filesystem step first —
     * exact file, then `<path>.html`, then `<path>/index.html` — so preview agrees with production.
     *
     * `routes:check` remains the authority (it models rewrites and cleanUrls too); this just stops
     * a casual click-through in preview from reporting a working link as broken.
     */
    configurePreviewServer(server) {
      const outDir = resolve(config.root, config.build.outDir);

      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        let pathname: string;
        try {
          pathname = decodeURI(new URL(req.url, 'http://localhost').pathname);
        } catch {
          return next();
        }

        const rel = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
        if (rel === '') return next();

        const candidate = [rel, `${rel}.html`, join(rel, 'index.html')]
          .map((c) => join(outDir, c))
          .find((full) => full.startsWith(outDir) && existsSync(full) && statSync(full).isFile());

        if (!candidate || !candidate.endsWith('.html')) return next();

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(readFileSync(candidate));
      });
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

      // Loud, because the failure mode is silent: an unfinished policy that looks published.
      if (isDraft()) {
        config.logger.warn(
          '\nlinguaswap-seo  legal pages are DRAFT — operator details in build/content/legal.ts are ' +
            'still placeholders, so /privacy, /terms and /refunds are noindex and out of the sitemap.',
        );
      }

      const indexable = pages.filter((p) => p.sitemapShard).length;
      config.logger.info(
        `\nlinguaswap-seo  ${pages.length} pages (${indexable} in ${shards.size} sitemaps) · ` +
          `${snapshot.decks.length} decks / ${totalEntries(snapshot)} concepts · ${SITE_URL}`,
      );
    },
  };
}
