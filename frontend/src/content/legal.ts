// URL map for the legal documents.
//
// Same split as `guides.ts`: only the paths live here, because the app has to LINK to them (the
// landing footer, the register form) while the prose is build-time only and must never reach the
// client bundle. Sharing this map is what stops the app and the generator disagreeing.
//
// UNLIKE the guides, these are English-only and their paths carry NO locale prefix. Legal text is
// the one place where a confidently-worded machine translation is worse than an honest English
// original — a mistranslated liability or refund clause is a real problem, not a rough edge. Every
// locale's footer links here, with a translated *label*, and each page says English is
// authoritative. Translating them later means adding locale paths here and a per-locale document,
// exactly as the guides do.
//
// Paths are FROZEN once published: they get linked from Stripe's dashboard, app stores and emails.
//
// Pure data — imported by `build/` under `tsconfig.node.json`, so no DOM and no JSX.

export const LEGAL_KEYS = ['privacy', 'terms', 'refunds'] as const;

export type LegalKey = (typeof LEGAL_KEYS)[number];

const PATHS: Record<LegalKey, string> = {
  privacy: '/privacy',
  terms: '/terms',
  refunds: '/refunds',
};

export function legalPath(key: LegalKey): string {
  return PATHS[key];
}
