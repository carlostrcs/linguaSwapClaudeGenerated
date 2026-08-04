// Aggregates the per-locale guide files.
//
// These are hand-written and deliberately NOT generated. The vocabulary pages are templated by
// necessity — one shape, many language pairs — and a site made only of those reads as scaled
// content. These are the pages the templated ones link up to, and the ones most likely to be
// quoted by an AI assistant answering "how does spaced repetition work?".

import { GUIDE_KEYS } from '../../../src/content/guides';
import { LOCALES } from '../../../src/i18n/locales';
import type { Guide } from './types';
import en from './en';
import es from './es';
import fr from './fr';
import de from './de';
import it from './it';
import pt from './pt';
import pl from './pl';

export type { Guide, GuideSection } from './types';

const BY_LOCALE: Record<string, Guide[]> = { en, es, fr, de, it, pt, pl };

/**
 * Guides for a locale, in `GUIDE_KEYS` order.
 *
 * Throws on a missing locale or a missing guide: unlike the app's UI strings — where falling back
 * to English is right — an English article stranded in the middle of a French site is a visible
 * defect and exactly the "templated filler" signal these pages exist to avoid.
 */
export function guidesFor(locale: string): Guide[] {
  const guides = BY_LOCALE[locale];
  if (!guides) throw new Error(`No guides for locale "${locale}". Add build/content/guides/${locale}.ts`);

  return GUIDE_KEYS.map((key) => {
    const guide = guides.find((g) => g.key === key);
    if (!guide) throw new Error(`Locale "${locale}" is missing the "${key}" guide`);
    return guide;
  });
}

/** Fails the build if any locale is missing its guides, rather than silently emitting fewer pages. */
export function verifyGuideCoverage(): void {
  for (const locale of LOCALES) guidesFor(locale.id);
}
