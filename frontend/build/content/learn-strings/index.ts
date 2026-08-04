import { LOCALES } from '../../../src/i18n/locales';
import type { LearnStrings } from './types';
import en from './en';
import es from './es';
import fr from './fr';
import de from './de';
import it from './it';
import pt from './pt';
import pl from './pl';

export type { LearnStrings } from './types';

const BY_LOCALE: Record<string, LearnStrings> = { en, es, fr, de, it, pt, pl };

/** Throws rather than falling back: an English sentence inside a French page is a visible defect. */
export function learnStrings(locale: string): LearnStrings {
  const strings = BY_LOCALE[locale];
  if (!strings) {
    throw new Error(`No learn strings for "${locale}". Add build/content/learn-strings/${locale}.ts`);
  }
  return strings;
}

/** Fails the build if a locale is missing copy, rather than silently emitting fewer pages. */
export function verifyLearnCoverage(deckSlugs: string[]): void {
  for (const locale of LOCALES) {
    const strings = learnStrings(locale.id);
    for (const other of LOCALES) {
      if (!strings.languageNames[other.id] || !strings.languageNamesCap[other.id]) {
        throw new Error(`learn-strings/${locale.id}: missing the name for "${other.id}"`);
      }
    }
    for (const slug of deckSlugs) {
      if (!strings.topicNouns[slug]) {
        throw new Error(`learn-strings/${locale.id}: missing a topic noun for deck "${slug}"`);
      }
    }
  }
}
