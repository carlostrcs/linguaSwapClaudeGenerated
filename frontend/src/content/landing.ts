// The landing page as pure data.
//
// This exists so `LandingPage.tsx` and the build-time generator (`build/render/landing.ts`) render
// the SAME page. The generator bakes the landing copy into `dist/index.html` so a crawler that runs
// no JavaScript still sees it; React then replaces it on mount. If the two renderers described
// different content, that divergence is what a search engine would notice.
//
// The copy itself lives in `i18n/dictionaries/*.ts` under these keys, so the *text* cannot drift —
// only the two markup renderers can, and they are deliberately kept small and side by side.
//
// Pure data (no JSX, no ReactNode) because `build/` imports it under `tsconfig.node.json`.

import { guidePath } from './guides';

export interface LandingFeature {
  /** Suffix of the `landing.feature.<key>.{title,body}` i18n keys. */
  key: string;
  icon: string;
}

export const LANDING_FEATURES: readonly LandingFeature[] = [
  { key: 'libraries', icon: '📚' },
  { key: 'direction', icon: '🔄' },
  { key: 'srs', icon: '🧠' },
  { key: 'stats', icon: '📈' },
];

export const LANDING_KEYS = {
  hero: {
    title: 'landing.heroTitle',
    subtitle: 'landing.heroSubtitle',
    note: 'landing.demoNote',
  },
  features: {
    title: 'landing.featuresTitle',
    note: 'landing.premiumNote',
  },
  cta: {
    title: 'landing.ctaTitle',
    subtitle: 'landing.ctaSubtitle',
  },
  actions: {
    register: 'landing.getStarted',
    demo: 'landing.tryDemo',
    signIn: 'auth.signIn',
    myLibraries: 'landing.myLibraries',
  },
} as const;

/**
 * Landing-page footer.
 *
 * Its real job is discoverability in both directions. Without it the generated `/learn/**` and
 * `/guides/**` pages are reachable only from the sitemap and from each other — users never find
 * them, and search engines crawl them far more slowly than pages linked from the homepage.
 *
 * The targets are English for now: wave 1 of the content layer is English-source. A localized
 * homepage still links here rather than dead-ending, and localized equivalents replace these
 * targets when the later waves land.
 */
export interface LandingFooterLink {
  key: string;
  to: string;
  /**
   * The target is a generated document, NOT a React route. These must render as a plain
   * `<a href>`: a React Router `<Link>` navigates on the client, never reaches the server, finds
   * no matching route, and renders the 404 page instead of the real page.
   */
  staticPage?: boolean;
}

/**
 * Footer links for a locale.
 *
 * The guides exist in all six languages, so every locale links to its own. The vocabulary pages
 * are English-source only — `/learn/spanish/travel` means "Spanish vocabulary *for an English
 * speaker*" — so they are offered on the English homepage alone. Sending a French visitor to an
 * English word list is worse than not offering the link; the fix is localized vocabulary pages,
 * not a translated label on an English target.
 */
export function landingFooter(locale: string): LandingFooterLink[] {
  const links: LandingFooterLink[] = [];
  if (locale === 'en') {
    links.push({ key: 'landing.footerVocabulary', to: '/learn', staticPage: true });
  }
  links.push({
    key: 'landing.footerGuides',
    to: guidePath(locale, 'spaced-repetition'),
    staticPage: true,
  });
  links.push({ key: 'landing.tryDemo', to: '/demo' });
  return links;
}

export function featureTitleKey(key: string): string {
  return `landing.feature.${key}.title`;
}

export function featureBodyKey(key: string): string {
  return `landing.feature.${key}.body`;
}
