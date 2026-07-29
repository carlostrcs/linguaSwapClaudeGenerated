// Per-route metadata for the public SPA routes.
//
// Imported by BOTH `components/Seo.tsx` (what React renders at runtime) and `build/routes.ts`
// (what the generator bakes into the served HTML). Sharing one object is what keeps the
// prerendered `<head>` and the client-rendered `<head>` from describing different pages; the
// generator additionally asserts that every route it emits has an entry here.
//
// English only, and deliberately so: these are the app's own routes, which live at unprefixed
// paths. The localized, indexable surface is the generated `/{locale}/…` content pages.
//
// Pure data — `build/` imports this under `tsconfig.node.json` (no DOM, no JSX).

export interface RouteSeo {
  title: string;
  description: string;
  /** Defaults to `index,follow`. */
  robots?: string;
}

/** Social share image, served from `public/`. 1200x630. */
export const OG_IMAGE = '/og.png';

/**
 * The home page is the one route whose metadata is localized, because every locale has its own
 * indexable homepage (`/`, `/es`, `/fr`, …) and the title tag is the highest-value string on it.
 * It therefore comes from the dictionaries rather than from `ROUTE_SEO`.
 */
export const HOME_SEO_KEYS = {
  title: 'seo.home.title',
  description: 'seo.home.description',
} as const;

export const ROUTE_SEO = {
  '/demo': {
    title: 'Try LinguaSwap free — no account needed | LinguaSwap',
    description:
      'Practise vocabulary right now in your browser. Create libraries, add words and drill them with spaced repetition — nothing is saved to an account and no sign-up is required.',
  },
  '/login': {
    title: 'Sign in | LinguaSwap',
    description: 'Sign in to LinguaSwap to practise your word libraries and track your progress.',
  },
  '/register': {
    title: 'Create a free account | LinguaSwap',
    description:
      'Create a free LinguaSwap account to save your word libraries, practise with spaced repetition and track your progress across languages.',
  },
  '/forgot-password': {
    title: 'Reset your password | LinguaSwap',
    description: 'Send yourself a link to choose a new LinguaSwap password.',
  },
  // Token-bearing URLs from emails: never worth indexing, and the token should not end up in an
  // index or a referrer chain.
  '/confirm-email': {
    title: 'Confirm your email | LinguaSwap',
    description: 'Confirm your LinguaSwap email address.',
    robots: 'noindex,nofollow',
  },
  '/reset-password': {
    title: 'Choose a new password | LinguaSwap',
    description: 'Choose a new password for your LinguaSwap account.',
    robots: 'noindex,nofollow',
  },
} satisfies Record<string, RouteSeo>;

export type SeoRoutePath = keyof typeof ROUTE_SEO;

/**
 * The protected pages. They render nothing to a logged-out visitor, so there is nothing to index —
 * one `<Seo/>` in `components/Layout.tsx` covers all of them at once.
 */
export const APP_SEO: RouteSeo = {
  title: 'LinguaSwap',
  description: 'Learn vocabulary with spaced repetition.',
  robots: 'noindex,follow',
};

/** Shared by `pages/NotFoundPage.tsx` and the generated `dist/404.html`, so they agree. */
export const NOT_FOUND_SEO: RouteSeo = {
  title: 'Page not found | LinguaSwap',
  description: 'That page does not exist — the link may be wrong, or the page may have moved.',
  robots: 'noindex,follow',
};
