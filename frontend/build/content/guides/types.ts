import type { GuideKey } from '../../../src/content/guides';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface Guide {
  /** Stable across locales — this is what ties the translations into one hreflang cluster. */
  key: GuideKey;
  /** `<title>`. */
  title: string;
  /** `<meta name="description">`. */
  description: string;
  /** `<h1>`. */
  heading: string;
  /** Intro paragraph under the h1. */
  lede: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  /** Heading above the FAQ block. */
  faqHeading: string;
  /** Heading above the links to the other guides in this locale. */
  moreHeading: string;
  /** Short link label per guide key, for those cross-links. */
  linkLabels: Record<GuideKey, string>;
}
