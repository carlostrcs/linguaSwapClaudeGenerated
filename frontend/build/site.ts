// Build-time site configuration.
//
// The origin comes from `VITE_SITE_URL` via the same helper the app uses (`src/content/site.ts`),
// so a canonical rendered by React and one baked into the HTML can never disagree.

import { siteUrl } from '../src/content/site';

export const SITE_URL = siteUrl(process.env.VITE_SITE_URL);

/** Marker put on every `<head>` element the generator injects, so `<Seo/>` can remove them. */
export const PRERENDER_MARK = 'data-prerendered-seo';

/** Where the SPA fallback rewrite points. A bare, `noindex` shell — never the landing page. */
export const APP_SHELL_FILE = 'app.html';

export const NOT_FOUND_FILE = '404.html';
