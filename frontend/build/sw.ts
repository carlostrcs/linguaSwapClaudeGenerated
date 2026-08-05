// Stamps the service worker with facts only the finished build knows.
//
// `public/sw.js` is copied verbatim into `dist/` by Vite, so it cannot know the hashed asset names
// or which paths belong to the SPA. Rather than let it carry a hand-written copy of the routing
// table — the kind of mirror CLAUDE.md keeps warning about — this fills four placeholders from the
// build's own data: the emitted pages and `vercel.json`, which `verify.ts` already parses.
//
// Every replacement throws if its placeholder is missing. A silently unstamped worker would cache
// under a fixed name forever and serve the first build it ever saw.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PageSpec } from './routes';
import { patternToRegExp } from './verify';

interface VercelConfig {
  cleanUrls?: boolean;
  rewrites?: { source: string; destination: string }[];
}

/**
 * With `cleanUrls`, Vercel 308s `/foo.html` to `/foo`, so a `.html` path is not a servable URL.
 * `verify.ts` already guards rewrite destinations against this; the worker needs the same guard for
 * a different reason. A precached redirect stores a response whose `redirected` flag is set, and
 * the browser refuses to satisfy a navigation with one — so the offline fallback would fail at the
 * only moment it matters, and only in production. It reached production once as a 308 on
 * `/offline.html`.
 */
function verifyNoHtmlPaths(sw: string, file: string): void {
  const offenders = [...sw.matchAll(/'(\/[^']*\.html)'/g)].map((match) => match[1]);
  if (offenders.length) {
    throw new Error(
      `${file}: references ${offenders.join(', ')} while cleanUrls is on. Vercel redirects those ` +
        'paths, and a cached redirected response cannot satisfy a navigation. Drop the extension.',
    );
  }
}

/** The hashed `/assets/*` URLs referenced by the built shell. */
function assetUrls(indexHtml: string): string[] {
  const urls = new Set<string>();
  for (const match of indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) urls.add(match[1]);
  return [...urls].sort();
}

function replaceOnce(source: string, placeholder: string, value: string, file: string): string {
  const token = `'${placeholder}'`;
  if (!source.includes(token)) {
    throw new Error(`${file}: placeholder ${token} not found — build/sw.ts and public/sw.js disagree.`);
  }
  return source.replace(token, value);
}

export function stampServiceWorker(outDir: string, pages: PageSpec[], config: VercelConfig): void {
  const swPath = join(outDir, 'sw.js');
  const indexHtml = readFileSync(join(outDir, 'index.html'), 'utf8');

  const assets = assetUrls(indexHtml);
  if (assets.length === 0) {
    throw new Error('dist/index.html references no /assets/* files — the shell would precache nothing.');
  }

  // Derived from the asset hashes, so the cache name changes exactly when the build's contents do:
  // a rebuild that changes nothing keeps the cache (no needless re-download), and any real change
  // retires the previous cache in `activate`.
  const buildId = createHash('sha256').update(assets.join('\n')).digest('hex').slice(0, 12);

  // The SPA shell is reachable two ways, and the worker's offline fallback needs both: paths
  // vercel.json rewrites to `/app`, and pages the generator emits WITH the SPA script (`/`, `/es`,
  // `/login`, `/demo`). Anything else is a content page that must never boot the app.
  const spaPatterns = (config.rewrites ?? []).map((rewrite) => patternToRegExp(rewrite.source).source);
  const spaPaths = pages.filter((page) => page.spa && page.path).map((page) => page.path);

  let sw = readFileSync(swPath, 'utf8');
  if (config.cleanUrls) verifyNoHtmlPaths(sw, swPath);
  sw = replaceOnce(sw, '__BUILD_ID__', JSON.stringify(buildId), swPath);
  sw = replaceOnce(sw, '__PRECACHE_ASSETS__', JSON.stringify(assets), swPath);
  sw = replaceOnce(sw, '__SPA_PATTERNS__', JSON.stringify(spaPatterns), swPath);
  sw = replaceOnce(sw, '__SPA_PATHS__', JSON.stringify(spaPaths), swPath);
  writeFileSync(swPath, sw, 'utf8');
}
