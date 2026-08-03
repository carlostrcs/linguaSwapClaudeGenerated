// The URL scheme for the generated pages, and the `hreflang` clusters built from it.
//
// One helper per URL shape, used by the renderers, the sitemap and the hreflang builder alike —
// so a path can never be spelled one way in a link and another way in the sitemap.

import { LOCALES } from '../src/i18n/locales';
import { localeHomePath } from '../src/content/site';

export const LOCALE_IDS = LOCALES.map((l) => l.id);

/** Re-exported from the shared module so app and generator agree on every locale URL. */
export const localeHome = localeHomePath;

export interface Alternate {
  hreflang: string;
  path: string;
}

/**
 * The `hreflang` block for a cluster of translated pages.
 *
 * Two rules that are easy to get wrong and are handled here once: every member links to every
 * member **including itself** (a missing self-reference invalidates the cluster), and `x-default`
 * points at the English member.
 *
 * Bare language codes, no region. The deck data mixes European and Brazilian Portuguese, so
 * claiming `pt-PT` or `pt-BR` would be a false signal.
 */
export function alternatesFor(pathByLocale: Map<string, string>): Alternate[] {
  const alternates: Alternate[] = [];
  for (const locale of LOCALE_IDS) {
    const path = pathByLocale.get(locale);
    if (path) alternates.push({ hreflang: locale, path });
  }
  const fallback = pathByLocale.get('en') ?? alternates[0]?.path;
  if (fallback) alternates.push({ hreflang: 'x-default', path: fallback });
  return alternates;
}

/** The homepage cluster: `/` plus one prefixed page per other locale. */
export function homeAlternates(): Alternate[] {
  return alternatesFor(new Map(LOCALE_IDS.map((id) => [id, localeHome(id)])));
}

/** `dist/`-relative output file for a site path. `/` -> index.html, `/es` -> es/index.html. */
export function outputFileFor(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? 'index.html' : `${trimmed}/index.html`;
}
