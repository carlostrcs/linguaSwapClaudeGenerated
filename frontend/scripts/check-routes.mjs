// Serves `dist/` with Vercel's routing semantics and asserts the important URLs behave.
//
// WHY THIS EXISTS: `vite preview` has its own SPA fallback that swallows extensionless paths, so
// it answers `/es` with the app shell no matter what is on disk — it cannot tell you whether the
// generated pages will actually be served. Deploying to find out is a slow and public way to
// discover that every content page 404s.
//
// The model below is Vercel's documented order:
//   cleanUrls/trailingSlash redirects -> filesystem -> rewrites -> 404.html (with a 404 status)
// The filesystem step is what makes `robots.txt`, `sitemap.xml` and every generated page win over
// the SPA catch-all.
//
// Run with `npm run routes:check` after `npm run build`.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function isFile(path) {
  return existsSync(path) && statSync(path).isFile();
}

/** Vercel's filesystem step: exact file, then `<path>.html`, then `<path>/index.html`. */
function resolveFile(pathname) {
  const rel = pathname.replace(/^\/+/, '');
  if (rel === '') return isFile(join(DIST, 'index.html')) ? join(DIST, 'index.html') : null;

  for (const candidate of [rel, `${rel}.html`, join(rel, 'index.html')]) {
    const full = join(DIST, candidate);
    if (isFile(full)) return full;
  }
  return null;
}

function patternToRegExp(source) {
  const body = source
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:\w+\*/g, '(?:/.*)?')
    .replace(/:\w+\*/g, '.*')
    .replace(/:\w+/g, '[^/]+');
  return new RegExp(`^${body}$`);
}

const rewrites = (config.rewrites ?? []).map((r) => ({ ...r, re: patternToRegExp(r.source) }));

function send(res, status, file) {
  res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}

const server = createServer((req, res) => {
  let pathname = new URL(req.url, 'http://localhost').pathname;

  // trailingSlash: false — one canonical form per URL.
  if (config.trailingSlash === false && pathname.length > 1 && pathname.endsWith('/')) {
    res.writeHead(308, { location: pathname.replace(/\/+$/, '') });
    return res.end();
  }
  // cleanUrls — `/foo.html` redirects to `/foo`.
  if (config.cleanUrls && pathname.endsWith('.html') && !pathname.startsWith('/app.')) {
    const clean = pathname.replace(/(\/index)?\.html$/, '') || '/';
    if (clean !== pathname) {
      res.writeHead(308, { location: clean });
      return res.end();
    }
  }

  const direct = resolveFile(pathname);
  if (direct) return send(res, 200, direct);

  const rewrite = rewrites.find((r) => r.re.test(pathname));
  if (rewrite) {
    const target = resolveFile(rewrite.destination);
    if (target) return send(res, 200, target);
  }

  const notFound = join(DIST, '404.html');
  return isFile(notFound) ? send(res, 404, notFound) : (res.writeHead(404), res.end('Not found'));
});

// ------------------------------------------------------------------------------------- checks

const checks = [
  // The whole point: real content in the raw bytes, with no JavaScript executed.
  ['/', 200, 'Learn vocabulary that sticks', 'landing copy is in the served HTML'],
  ['/es', 200, 'Aprende vocabulario que se queda', 'Spanish homepage is its own URL'],
  ['/de', 200, 'Vokabeln lernen, die hängen bleiben', 'German homepage is its own URL'],
  ['/learn', 200, 'Vocabulary lists for English speakers', 'vocabulary index'],
  ['/learn/spanish', 200, 'Learn Spanish vocabulary', 'language hub'],
  ['/learn/spanish/travel', 200, 'aeropuerto', 'topic page ships a real word table'],
  ['/learn/german/restaurant-food', 200, 'Capitalisation counts', 'German pages warn about case'],
  ['/guides/spaced-repetition', 200, 'forgetting curve', 'hand-written guide'],

  // Infrastructure that the old catch-all rewrite used to swallow.
  ['/robots.txt', 200, 'User-agent: GPTBot', 'robots.txt is a real robots file'],
  ['/sitemap.xml', 200, '<sitemapindex', 'sitemap index'],
  ['/sitemaps/en.xml', 200, '<urlset', 'per-locale sitemap shard'],
  ['/llms.txt', 200, '# LinguaSwap', 'llms.txt'],

  // App routes still reach the SPA.
  ['/login', 200, 'id="root"', 'auth route is prerendered and still boots the SPA'],
  ['/demo', 200, 'Demo libraries', 'demo has a real static intro'],
  ['/libraries', 200, 'id="root"', 'protected route falls back to the app shell'],
  ['/practice/12', 200, 'id="root"', 'parameterised route falls back to the app shell'],
  ['/billing/success', 200, 'id="root"', 'Stripe return path still resolves'],
  ['/demo/libraries/3', 200, 'id="root"', 'demo sub-route falls back to the app shell'],

  // The soft-404 fix: junk URLs must NOT be a 200 copy of the homepage.
  ['/nope', 404, 'noindex', 'unknown URL returns a real 404'],
  ['/learn/klingon/travel', 404, 'noindex', 'unknown language returns a real 404'],
];

const base = await new Promise((resolve) => {
  server.listen(0, () => resolve(`http://localhost:${server.address().port}`));
});

let failed = 0;

for (const [path, expectStatus, expectText, label] of checks) {
  const res = await fetch(`${base}${path}`, { redirect: 'follow' });
  const body = await res.text();
  const ok = res.status === expectStatus && body.includes(expectText);
  if (!ok) {
    failed++;
    console.error(
      `FAIL  ${path}\n      ${label}\n      status ${res.status} (want ${expectStatus})` +
        `${body.includes(expectText) ? '' : `\n      missing text: ${JSON.stringify(expectText)}`}`,
    );
  } else {
    console.log(`ok    ${path.padEnd(34)} ${label}`);
  }
}

// hreflang and JSON-LD must NOT carry the prerender marker: `<Seo/>` strips marked tags on mount,
// and React re-renders neither of these — so marking them would delete the structured data and the
// hreflang cluster for every crawler that runs JavaScript, Googlebot included.
const spanish = readFileSync(join(DIST, 'es', 'index.html'), 'utf8');
for (const [pattern, label] of [
  [/<link rel="alternate"[^>]*data-prerendered-seo/, 'hreflang'],
  [/<script type="application\/ld\+json"[^>]*data-prerendered-seo/, 'JSON-LD'],
]) {
  if (pattern.test(spanish)) {
    failed++;
    console.error(`FAIL  ${label} is marked data-prerendered-seo — <Seo/> would delete it on mount`);
  } else {
    console.log(`ok    ${label.padEnd(34)} survives hydration (not marked for cleanup)`);
  }
}

// The SPA fallback must never be the landing page: that is what made every junk URL a 200 copy
// of the homepage before.
const shell = readFileSync(join(DIST, 'app.html'), 'utf8');
if (shell.includes('Learn vocabulary that sticks')) {
  failed++;
  console.error('FAIL  app.html contains landing copy — the fallback must be a bare noindex shell');
} else {
  console.log(`ok    app.html                           bare noindex shell, not the landing page`);
}

server.close();

if (failed) {
  console.error(`\n${failed} route check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length + 3} route checks passed.`);
