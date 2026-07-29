// Build-time assertions. Everything here fails the build rather than warning.
//
// This repo has no CI (`.github/workflows/` is empty), so the build is the only gate there is.
// It follows the convention CLAUDE.md already sets out for the production safety rails: a crash
// at build time beats a deploy that looks fine and is quietly broken.

import { landingFooter } from '../src/content/landing';
import { LOCALES } from '../src/i18n/locales';
import type { PageSpec } from './routes';

/**
 * The landing footer is the one place the app links into the generated pages, and getting it wrong
 * is invisible: a React Router `<Link>` to a generated page navigates on the client, never reaches
 * the server, matches no route, and silently renders the 404 page instead of the real document.
 *
 * Checked against the pages this build actually emits rather than against a path prefix, because
 * the guide URLs are localized (`/de/ratgeber/…`) and a prefix list would rot the moment a locale
 * is added. `spa === false` is the exact property that requires a full page load.
 */
function verifyLandingFooter(pages: PageSpec[]): void {
  const emitted = new Map(pages.filter((p) => p.path).map((p) => [p.path, p]));

  for (const locale of LOCALES) {
    for (const link of landingFooter(locale.id)) {
      const target = emitted.get(link.to);
      if (!target) {
        throw new Error(
          `landingFooter("${locale.id}") links to "${link.to}", which this build does not emit.`,
        );
      }
      if (!target.spa && !link.staticPage) {
        throw new Error(
          `landingFooter("${locale.id}"): "${link.to}" is a generated page but is not marked ` +
            'staticPage. It would render as a React Router <Link> and land on the 404 page.',
        );
      }
      if (target.spa && link.staticPage) {
        throw new Error(
          `landingFooter("${locale.id}"): "${link.to}" is marked staticPage but is a React route — ` +
            'a full page reload here is a pointless bundle re-download.',
        );
      }
    }
  }
}

/**
 * Client-side routes that are NOT emitted as files and therefore depend on a `vercel.json` rewrite
 * to reach the SPA shell. If one stops being covered it returns a hard 404 in production while
 * still working perfectly in `vite dev` — the exact failure this check exists to prevent.
 */
export const REWRITE_DEPENDENT_ROUTES = [
  '/libraries',
  '/libraries/12',
  '/featured',
  '/practice/12',
  '/stats',
  '/account',
  '/billing/success',
  '/demo/libraries/12',
  '/demo/practice/12',
];

interface VercelConfig {
  rewrites?: { source: string; destination: string }[];
}

/** Vercel path pattern -> RegExp. `:name*` spans segments, `:name` is one segment. */
function patternToRegExp(source: string): RegExp {
  const body = source
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:\w+\*/g, '(?:/.*)?')
    .replace(/:\w+\*/g, '.*')
    .replace(/:\w+/g, '[^/]+');
  return new RegExp(`^${body}$`);
}

export function verifyPages(pages: PageSpec[]): void {
  verifyLandingFooter(pages);

  const byFile = new Map<string, PageSpec>();

  for (const page of pages) {
    const where = page.path || page.file;

    if (!page.title.trim()) throw new Error(`${where}: missing title`);
    if (!page.description.trim()) throw new Error(`${where}: missing description`);
    if (page.path && !page.path.startsWith('/')) {
      throw new Error(`${where}: path must be site-root-relative`);
    }
    if (page.path.length > 1 && page.path.endsWith('/')) {
      throw new Error(`${where}: path must not have a trailing slash (canonicals need one form)`);
    }

    const clash = byFile.get(page.file);
    if (clash) {
      throw new Error(`${page.file}: emitted twice (${clash.path || '—'} and ${page.path || '—'})`);
    }
    byFile.set(page.file, page);
  }

  verifyAlternates(pages);
}

/**
 * `hreflang` clusters must be reciprocal and must point at pages this build actually emits.
 * A cluster member that 404s, or that does not link back, invalidates the whole cluster —
 * and it is invisible until a search console flags it weeks later.
 */
function verifyAlternates(pages: PageSpec[]): void {
  const emitted = new Set(pages.filter((p) => p.path).map((p) => p.path));
  const clusterOf = new Map<string, Set<string>>();

  for (const page of pages) {
    if (!page.alternates?.length) continue;
    const members = new Set<string>();

    for (const alt of page.alternates) {
      if (!emitted.has(alt.path)) {
        throw new Error(
          `${page.path}: hreflang="${alt.hreflang}" points at ${alt.path}, which this build does not emit`,
        );
      }
      if (alt.hreflang !== 'x-default') members.add(alt.path);
    }

    if (!members.has(page.path)) {
      throw new Error(`${page.path}: hreflang cluster is missing its own self-reference`);
    }
    if (!page.alternates.some((a) => a.hreflang === 'x-default')) {
      throw new Error(`${page.path}: hreflang cluster has no x-default`);
    }
    clusterOf.set(page.path, members);
  }

  for (const [path, members] of clusterOf) {
    for (const member of members) {
      const theirs = clusterOf.get(member);
      if (!theirs || !theirs.has(path)) {
        throw new Error(`hreflang is not reciprocal: ${path} lists ${member}, but not the reverse`);
      }
    }
  }
}

/**
 * Every route the SPA owns must resolve in production: either the generator emits a real file for
 * it, or a `vercel.json` rewrite sends it to the app shell.
 */
export function verifyVercelCoverage(pages: PageSpec[], config: VercelConfig): void {
  const emitted = new Set(pages.filter((p) => p.path).map((p) => p.path));
  const rewrites = (config.rewrites ?? []).map((r) => ({ ...r, re: patternToRegExp(r.source) }));

  const routes = [...REWRITE_DEPENDENT_ROUTES, ...emitted];
  const uncovered = routes.filter(
    (route) => !emitted.has(route) && !rewrites.some((r) => r.re.test(route)),
  );

  if (uncovered.length) {
    throw new Error(
      'These routes are neither prerendered nor matched by a vercel.json rewrite, so they would ' +
        `404 in production:\n  ${uncovered.join('\n  ')}`,
    );
  }
}
