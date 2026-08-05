/*
 * LinguaSwap service worker — app shell caching and an offline fallback.
 *
 * SCOPE, DELIBERATELY NARROW: this caches the *app*, never the *data*. Every `/api/*` request goes
 * straight to the network, always. API responses are per-user and mutable (word lists, premium
 * gates, Leitner boxes); a stale copy served from a shared device cache would be both a privacy
 * risk and a correctness one, and CLAUDE.md is explicit that the server is the record of truth.
 * Offline practice works because grading is already client-side (lib/practiceCheck) and unsent
 * answers park in lib/offlineQueue — not because anything here replays the API.
 *
 * STALENESS, THE CLASSIC PWA FOOT-GUN: navigations are **network-first**, so an online user always
 * gets fresh HTML and therefore the newest hashed asset URLs. The cache is only ever the offline
 * fallback. Combined with a per-build cache name (stamped below, old caches deleted on activate),
 * there is no way to get wedged on an old build while online.
 *
 * The placeholders are filled in by build/sw.ts at the end of the Vite build — that is also where
 * the SPA route list comes from (derived from vercel.json's rewrites plus the pages the generator
 * emits as SPA pages, so this file never becomes a hand-maintained mirror of the routing table).
 * An unstamped copy is never registered: registerServiceWorker.ts only runs in a production build.
 */

const BUILD = '__BUILD_ID__';
const CACHE = `linguaswap-${BUILD}`;

// Both are extensionless because `cleanUrls` makes Vercel 308 `/foo.html` to `/foo`. A redirecting
// URL is poison here twice over: the precache would store a response with the `redirected` flag
// set, and the browser refuses to satisfy a navigation with one — so the offline fallback would
// fail exactly when it is needed. build/sw.ts fails the build if either regains an extension.
const APP_SHELL = '/app';
const OFFLINE_PAGE = '/offline';

// Stamped: the hashed /assets/* URLs of this build, so the app is usable offline from the first
// load after install rather than only after it happens to have fetched each file.
const PRECACHE_ASSETS = '__PRECACHE_ASSETS__';
// Stamped: RegExp sources for the paths vercel.json rewrites to the SPA shell.
const SPA_PATTERNS = '__SPA_PATTERNS__';
// Stamped: exact paths the generator emits as SPA pages (`/`, `/es`, `/login`, `/demo`, …).
const SPA_PATHS = '__SPA_PATHS__';

const spaPatterns = SPA_PATTERNS.map((source) => new RegExp(source));
const spaPaths = new Set(SPA_PATHS);
const precache = [APP_SHELL, OFFLINE_PAGE, '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', ...PRECACHE_ASSETS];

/** Is this a path React Router owns, rather than a generated content page? */
function isAppRoute(pathname) {
  return spaPaths.has(pathname) || spaPatterns.some((re) => re.test(pathname));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Individually, not addAll: one missing file would reject the whole install and leave the
      // user with no service worker at all. A gap in the precache only degrades the offline story.
      await Promise.allSettled(precache.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Every build gets its own cache name, so this drops the previous build's assets wholesale.
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith('linguaswap-') && name !== CACHE).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * Deliberately NOT skipWaiting(): a waiting worker takes over on the next launch instead of
 * swapping the cache under a page that is mid-session. Network-first navigations mean the user is
 * never stuck on old HTML anyway, so there is nothing to gain by being aggressive here.
 */

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // In production the API is a different origin (Render vs Vercel), so this alone keeps every API
  // call out of the worker; the pathname check covers a same-origin setup too.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Content-hashed filenames are immutable: a changed file gets a new URL, so cache-first can
  // never serve something stale, and repeat loads never touch the network.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  }
});

async function handleNavigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    // `redirected` responses cannot satisfy a navigation when replayed from the cache (the browser
    // rejects them), and cleanUrls means Vercel issues 308s — so never store one.
    if (fresh.ok && !fresh.redirected) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Unvisited page, no network. An app route can still be served by the SPA shell — React Router
    // renders the right screen for the URL. A generated content page must NOT boot the SPA (it
    // would match no route and redirect the reader away), so it gets the offline page instead.
    const fallback = isAppRoute(new URL(request.url).pathname) ? APP_SHELL : OFFLINE_PAGE;
    return (await cache.match(fallback)) ?? (await cache.match(OFFLINE_PAGE)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  if (fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}
