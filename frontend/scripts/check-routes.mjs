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
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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
    // With cleanUrls, `/app.html` is a 308 to `/app` — so it is NOT a servable path, and a rewrite
    // pointing at it resolves to nothing and falls through to a 404. This shipped to production
    // once; modelling it here is what stops it shipping twice.
    if (config.cleanUrls && /\.html$/.test(rewrite.destination)) {
      throw new Error(
        `vercel.json: rewrite destination "${rewrite.destination}" ends in .html while cleanUrls ` +
          'is on. Vercel 308s that path, so the rewrite resolves to nothing and every route it ' +
          `covers hard-404s. Use "${rewrite.destination.replace(/\.html$/, '')}".`,
      );
    }
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
  ['/learn', 200, 'Vocabulary lists', 'vocabulary index'],
  ['/learn/spanish', 200, 'Learn Spanish vocabulary', 'language hub'],
  ['/learn/spanish/travel', 200, 'aeropuerto', 'topic page ships a real word table'],
  ['/learn/german/restaurant-food', 200, 'Capitalisation counts', 'German pages warn about case'],

  // The same content from the other side: written in the reader's language, with the columns the
  // other way round. This is what "translate /learn" actually means for a non-English reader.
  ['/es/aprender', 200, 'Listas de vocabulario', 'vocabulary index in Spanish'],
  ['/es/aprender/ingles', 200, 'Aprende vocabulario de inglés', 'learn-English hub in Spanish'],
  ['/es/aprender/ingles/viajes', 200, 'aeropuerto', 'Spanish-to-English travel words'],
  ['/fr/apprendre/espagnol/voyage', 200, 'aéroport', 'French-to-Spanish travel words'],
  ['/de/lernen/englisch/reisen', 200, 'Flughafen', 'German-to-English travel words'],
  ['/it/imparare/tedesco/viaggi', 200, 'Capitalisation counts|Le maiuscole contano', 'Italian pages warn about German case'],
  ['/pt/aprender/frances/viagem', 200, 'aeroporto', 'Portuguese-to-French travel words'],

  // Polish — the 7th locale. Its vocabulary pages come from the backfilled deck column (pl as both a
  // reading language and a target); its homepage and guides ship as a full UI locale.
  ['/pl', 200, 'Ucz się słówek', 'Polish homepage is its own URL'],
  ['/pl/ucz-sie', 200, 'Listy słówek', 'vocabulary index in Polish'],
  ['/pl/ucz-sie/hiszpanski/podroze', 200, 'aeropuerto', 'Polish-to-Spanish travel words'],
  ['/learn/polish/travel', 200, 'lotnisko', 'English-to-Polish travel words'],
  ['/pl/poradniki/system-leitnera', 200, 'System Leitnera', 'guide in Polish, localized slug'],

  ['/guides/spaced-repetition', 200, 'forgetting curve', 'hand-written guide'],
  ['/es/guias/repeticion-espaciada', 200, 'curva del olvido', 'guide in Spanish, localized slug'],
  ['/de/ratgeber/verteilte-wiederholung', 200, 'Vergessenskurve', 'guide in German, localized slug'],
  ['/pt/guias/quantas-palavras', 200, 'frequência das palavras', 'guide in Portuguese'],

  // Infrastructure that the old catch-all rewrite used to swallow.
  ['/robots.txt', 200, 'User-agent: GPTBot', 'robots.txt is a real robots file'],
  ['/sitemap.xml', 200, '<sitemapindex', 'sitemap index'],
  ['/sitemaps/en.xml', 200, '<urlset', 'per-locale sitemap shard'],
  ['/llms.txt', 200, '# LinguaSwap', 'llms.txt'],

  // Legal documents. English-only and un-prefixed, linked from every locale's footer, and — like
  // the guides — real HTML that a reviewer (or Stripe) can read without running JavaScript.
  ['/privacy', 200, 'Privacy Policy', 'privacy policy is a real document'],
  ['/terms', 200, 'Terms of Service', 'terms of service is a real document'],
  ['/refunds', 200, 'Cancellation &amp; Refunds', 'refund policy is a real document'],

  // Installable app + offline shell. These are plain files, so the thing that can break them is a
  // rewrite starting to swallow them — exactly what happened to robots.txt before this check existed.
  ['/manifest.webmanifest', 200, '"start_url": "/libraries"', 'web app manifest is served, not the SPA'],
  ['/sw.js', 200, 'linguaswap-', 'service worker is served from the root (its scope)'],
  // `/offline`, not `/offline.html`: cleanUrls 308s the latter, and the worker must reference the
  // path it can actually cache — these checks follow redirects, so only the clean form proves it.
  ['/offline', 200, "You're offline", 'offline fallback page at its canonical URL'],

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
  // `a|b` means either is acceptable — used where a string differs between locales.
  const matched = expectText.split('|').some((option) => body.includes(option));
  const ok = res.status === expectStatus && matched;
  if (!ok) {
    failed++;
    console.error(
      `FAIL  ${path}\n      ${label}\n      status ${res.status} (want ${expectStatus})` +
        `${matched ? '' : `\n      missing text: ${JSON.stringify(expectText)}`}`,
    );
  } else {
    console.log(`ok    ${path.padEnd(34)} ${label}`);
  }
}

// A non-English homepage links to its OWN guides, and to the English-only vocabulary pages with a
// visible marker plus hreflang — the surprise of landing on an unexpected language is solved by
// signalling, not by hiding the content.
const spanishHome = readFileSync(join(DIST, 'es', 'index.html'), 'utf8');
const spanishFooterChecks = [
  [/href="\/es\/aprender"/, 'links to its own Spanish vocabulary index'],
  [/href="\/es\/guias\/repeticion-espaciada"/, 'links to its own Spanish guide'],
  [/href="\/learn"/, 'does NOT link to the English index', true],
];
for (const [pattern, label, negate] of spanishFooterChecks) {
  if (pattern.test(spanishHome) === Boolean(negate)) {
    failed++;
    console.error(`FAIL  /es footer ${label}`);
  } else {
    console.log(`ok    /es footer                        ${label}`);
  }
}

// A React Router <Link to="/learn"> looks right and is broken: it navigates on the client, never
// reaches the server, matches no route and renders the 404 page. The generated pages are real
// documents, so links to them from inside the SPA must be plain <a href>. This is invisible in
// review and only shows up by clicking, so it is worth a check.
const CONTENT_PREFIXES = ['/learn', '/guides', '/privacy', '/terms', '/refunds'];

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const badLinks = [];
for (const file of sourceFiles(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/<Link\b[^>]*\bto=["'`]([^"'`]+)/g)) {
    if (CONTENT_PREFIXES.some((p) => match[1] === p || match[1].startsWith(`${p}/`))) {
      badLinks.push(`${file.slice(ROOT.length + 1)} -> ${match[1]}`);
    }
  }
}
if (badLinks.length) {
  failed++;
  console.error(
    `FAIL  React Router <Link> pointing at a generated page (use <a href> instead):\n      ${badLinks.join('\n      ')}`,
  );
} else {
  console.log(`ok    SPA -> content links                use <a href>, not <Link>`);
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

// A worker that shipped with its placeholders intact would cache under a fixed name forever and
// pin every visitor to the first build it ever saw. build/sw.ts throws if one is missing; this is
// the same check on the artifact that actually gets deployed.
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
if (/'__[A-Z_]+__'/.test(sw)) {
  failed++;
  console.error('FAIL  sw.js still contains build placeholders — build/sw.ts did not stamp it');
} else {
  console.log(`ok    sw.js                              stamped with this build's cache name and assets`);
}

server.close();

if (failed) {
  console.error(`\n${failed} route check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length + 8} route checks passed.`);
console.log(`(${checks.length} URL checks + footer, link-style and metadata assertions)`);
