// Site identity shared by the running app and the build-time page generator.
//
// Pure data + pure functions on purpose: `build/` imports this under `tsconfig.node.json`, which
// has no DOM lib and no `import.meta.env`. Each side reads the env var itself and passes it in —
// the app via `import.meta.env.VITE_SITE_URL`, the generator via `process.env.VITE_SITE_URL`.

/**
 * Fallback origin when `VITE_SITE_URL` is unset.
 *
 * This is the current Vercel preview host. A `.vercel.app` subdomain is a weak ranking signal, so
 * set `VITE_SITE_URL` to the real domain in the Vercel dashboard — every canonical, `hreflang`,
 * sitemap entry and OG url is built from it, so that one variable is the whole migration.
 */
export const DEFAULT_SITE_URL = 'https://lingua-swap-claude-generated.vercel.app';

export const SITE_NAME = 'LinguaSwap';

/** Normalise an origin: fall back when unset, drop any trailing slash. */
export function siteUrl(fromEnv: string | undefined | null): string {
  const raw = (fromEnv ?? '').trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, '');
}

/** Absolute URL for a site-root-relative path. `/` stays `/` (no bare-origin canonicals). */
export function absoluteUrl(base: string, path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl(base)}${suffix}`;
}
