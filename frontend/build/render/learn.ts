// The generated vocabulary pages: an index, one hub per target language, and one page per
// (locale, target, topic) triple — all written in the reader's own language.
//
// A page is a LANGUAGE PAIR seen from one side. `/learn/spanish/travel` is Spanish travel words
// for an English speaker; `/es/aprender/ingles/viajes` is English travel words for a Spanish
// speaker. Those are different tables out of the same deck row, not translations of one page —
// which is why this takes a locale AND a target rather than being translated after the fact.
//
// Each page publishes a SAMPLE of its deck (SAMPLE_ROWS). That is a product decision — the curated
// libraries are a paid feature — that happens to suit these pages: a 40-row table plus real prose
// is a page, whereas dumping 1,000 rows would be a 150 kB data dump.

import { interpolate } from '../../src/i18n/interpolate';
import { learnIndexPath, learnTargetPath, learnTopicPath } from '../../src/content/learn';
import { escapeHtml } from '../html';
import type { Deck } from '../decks';
import { analysePair } from '../content/analysis';
import type { PairFacts } from '../content/analysis';
import { SAMPLE_ROWS } from '../content/topics';
import { learnStrings } from '../content/learn-strings/index';
import type { LearnStrings } from '../content/learn-strings/index';
import { renderCta, renderDoc } from './doc';
import type { Crumb } from './doc';

/** Everything a page needs about its own (locale, target) pair. */
interface Ctx {
  locale: string;
  target: string;
  s: LearnStrings;
}

function ctx(locale: string, target: string): Ctx {
  return { locale, target, s: learnStrings(locale) };
}

const t = (template: string, vars: Record<string, string | number>) => interpolate(template, vars);

/** The languages a reader of this locale can learn here — everything except their own. */
export function targetsFor(locale: string, locales: string[]): string[] {
  return locales.filter((id) => id !== locale);
}

// ------------------------------------------------------------------------------- breadcrumbs

export function learnCrumbs(locale: string): Crumb[] {
  const s = learnStrings(locale);
  return [{ label: s.crumbHome, path: locale === 'en' ? '/' : `/${locale}` }, { label: s.crumbVocabulary }];
}

export function targetCrumbs(locale: string, target: string): Crumb[] {
  const s = learnStrings(locale);
  return [
    { label: s.crumbHome, path: locale === 'en' ? '/' : `/${locale}` },
    { label: s.crumbVocabulary, path: learnIndexPath(locale) },
    { label: s.languageNamesCap[target] },
  ];
}

export function topicCrumbs(locale: string, target: string, deck: Deck): Crumb[] {
  const s = learnStrings(locale);
  return [
    { label: s.crumbHome, path: locale === 'en' ? '/' : `/${locale}` },
    { label: s.crumbVocabulary, path: learnIndexPath(locale) },
    { label: s.languageNamesCap[target], path: learnTargetPath(locale, target) },
    { label: deck.name },
  ];
}

// ---------------------------------------------------------------------------------- headings

/** "Spanish travel vocabulary" / "Vocabulario de viaje en inglés" — what the page ranks for. */
export function topicHeading({ target, s }: Ctx, deck: Deck): string {
  return t(s.topicHeading, {
    language: s.languageNames[target],
    topic: s.topicNouns[deck.slug],
    count: deck.entries.length,
  });
}

export function topicLinkLabel(c: Ctx, deck: Deck): string {
  return topicHeading(c, deck).replace(/:.*$/, '');
}

// --------------------------------------------------------------------------------- the table

function renderTable({ locale, target, s }: Ctx, deck: Deck): string {
  const shown = Math.min(SAMPLE_ROWS, deck.entries.length);
  const sourceName = s.languageNamesCap[locale];
  const targetName = s.languageNamesCap[target];

  // Notes are English prose glossing the English headword, so they belong only where English is
  // one of the two columns. On, say, an es->fr page they would be both the wrong language and
  // about a word that is not on the page.
  const showNotes = locale === 'en' || target === 'en';

  const rows = deck.entries.slice(0, shown).map((entry) => {
    const note = showNotes && entry.n ? escapeHtml(entry.n) : '';
    const noteCell = showNotes ? `<td class="doc-note">${note}</td>` : '';
    return `          <tr><td lang="${locale}">${escapeHtml(entry.t[locale])}</td><td lang="${target}">${escapeHtml(entry.t[target])}</td>${noteCell}</tr>`;
  });

  return `
      <section class="doc-section">
        <h2>${escapeHtml(t(s.tableHeading, { source: sourceName, target: targetName, shown }))}</h2>
        <div class="doc-table-wrap">
          <table class="doc-table">
            <thead><tr><th>${escapeHtml(sourceName)}</th><th>${escapeHtml(targetName)}</th>${
              showNotes ? `<th>${escapeHtml(s.colNotes)}</th>` : ''
            }</tr></thead>
            <tbody>
${rows.join('\n')}
            </tbody>
          </table>
        </div>
      </section>`;
}

// --------------------------------------------------------------------------- pair-specific prose

/**
 * The section that makes this page different from the same topic in another pair. Every number is
 * measured from the deck itself, so es->it and es->de genuinely read differently rather than being
 * one template with a name swapped in — which is what separates these from scaled filler.
 */
function renderFacts({ locale, target, s }: Ctx, facts: PairFacts): string {
  const points: string[] = [];

  if (facts.nearCognatePercent >= 15) {
    const examples = facts.cognateExamples
      .slice(0, 3)
      .map((pair) => `<code>${escapeHtml(pair.target)}</code>`)
      .join(', ');
    points.push(
      t(s.factCognates, {
        count: facts.nearCognates,
        total: facts.total,
        percent: facts.nearCognatePercent,
        source: s.languageNames[locale],
        target: s.languageNames[target],
        examples: examples ? ` — ${examples}` : '',
      }),
    );
  }

  if (facts.diacritics.length) {
    points.push(
      t(s.factAccents, { chars: facts.diacritics.map((c) => `<code>${escapeHtml(c)}</code>`).join(' ') }),
    );
  }

  if (facts.caseSensitive) points.push(s.factCase);
  if (facts.withNotes > 0) points.push(t(s.factNotes, { count: facts.withNotes }));

  if (!points.length) return '';

  return `
      <section class="doc-section">
        <h2>${escapeHtml(t(s.watchOut, { language: s.languageNames[target] }))}</h2>
        <ul class="doc-points">
${points.map((p) => `          <li>${p}</li>`).join('\n')}
        </ul>
      </section>`;
}

function renderRemainder({ locale, target, s }: Ctx, deck: Deck): string {
  const remaining = deck.entries.length - Math.min(SAMPLE_ROWS, deck.entries.length);
  if (remaining <= 0) return '';

  return `
      <section class="doc-section doc-more">
        <p>${t(s.moreWords, {
          count: remaining,
          deck: escapeHtml(deck.name),
          source: s.languageNamesCap[locale],
          target: s.languageNamesCap[target],
        })}</p>
      </section>`;
}

// ------------------------------------------------------------------------------ related links

function renderRelated(c: Ctx, deck: Deck, decks: Deck[], locales: string[]): string {
  const { locale, target, s } = c;

  // The same topic, same target, in the other reading languages — this is the hreflang cluster
  // made visible, and it is what stops each locale's pages being an island.
  const sameTopic = locales
    .filter((other) => other !== locale && other !== target)
    .map((other) => {
      const o = ctx(other, target);
      return `<li><a href="${learnTopicPath(other, target, deck.slug)}" hreflang="${other}">${escapeHtml(
        topicLinkLabel(o, deck),
      )}</a> — ${escapeHtml(o.s.languageNamesCap[other])}</li>`;
    });

  const sameLanguage = decks
    .filter((other) => other.slug !== deck.slug)
    .slice(0, 6)
    .map(
      (other) =>
        `<li><a href="${learnTopicPath(locale, target, other.slug)}">${escapeHtml(topicLinkLabel(c, other))}</a></li>`,
    );

  return `
      <section class="doc-section doc-related">
        <h2>${escapeHtml(s.sameTopicElsewhere)}</h2>
        <ul class="doc-links">
${sameTopic.map((l) => `          ${l}`).join('\n')}
        </ul>
        <h2>${escapeHtml(t(s.moreIn, { language: s.languageNames[target] }))}</h2>
        <ul class="doc-links">
${sameLanguage.map((l) => `          ${l}`).join('\n')}
          <li><a href="${learnTargetPath(locale, target)}">${escapeHtml(
            t(s.allLists, { language: s.languageNames[target] }),
          )}</a></li>
        </ul>
      </section>`;
}

// ------------------------------------------------------------------------------------- pages

export function renderTopicPage(
  locale: string,
  target: string,
  deck: Deck,
  decks: Deck[],
  locales: string[],
): string {
  const c = ctx(locale, target);
  const facts = analysePair(deck, locale, target);
  const shown = Math.min(SAMPLE_ROWS, deck.entries.length);

  return renderDoc({
    crumbs: topicCrumbs(locale, target, deck),
    locale,
    heading: topicHeading(c, deck),
    lede: t(c.s.topicLede, {
      description: deck.description,
      shown,
      language: c.s.languageNames[target],
    }),
    sections: [
      renderTable(c, deck),
      renderRemainder(c, deck),
      renderFacts(c, facts),
      renderCta(
        locale,
        t(c.s.topicCtaHeading, {
          language: c.s.languageNames[target],
          topic: c.s.topicNouns[deck.slug],
        }),
        c.s.topicCtaBody,
      ),
      renderRelated(c, deck, decks, locales),
    ],
  });
}

export function renderTargetHub(
  locale: string,
  target: string,
  decks: Deck[],
  locales: string[],
): string {
  const c = ctx(locale, target);
  const { s } = c;
  const totalWords = decks.reduce((n, deck) => n + deck.entries.length, 0);

  const cards = decks.map((deck) => {
    const facts = analysePair(deck, locale, target);
    return `          <li>
            <a href="${learnTopicPath(locale, target, deck.slug)}"><strong>${escapeHtml(topicLinkLabel(c, deck))}</strong></a>
            <span class="doc-card-meta">${escapeHtml(
              t(s.cardMeta, { words: deck.entries.length, percent: facts.nearCognatePercent }),
            )}</span>
            <span class="muted">${escapeHtml(deck.description)}</span>
          </li>`;
  });

  const others = targetsFor(locale, locales)
    .filter((other) => other !== target)
    .map(
      (other) =>
        `<li><a href="${learnTargetPath(locale, other)}">${escapeHtml(
          t(s.otherLanguageLink, { language: s.languageNames[other] }),
        )}</a></li>`,
    )
    .join('');

  return renderDoc({
    crumbs: targetCrumbs(locale, target),
    locale,
    heading: t(s.hubHeading, { language: s.languageNames[target] }),
    lede: t(s.hubLede, {
      words: totalWords,
      language: s.languageNames[target],
      topics: decks.length,
    }),
    sections: [
      `
      <section class="doc-section">
        <h2>${escapeHtml(t(s.hubTopics, { language: s.languageNamesCap[target] }))}</h2>
        <ul class="doc-cards">
${cards.join('\n')}
        </ul>
      </section>`,
      renderCta(locale, t(s.hubCtaHeading, { language: s.languageNames[target] }), s.hubCtaBody),
      `
      <section class="doc-section doc-related">
        <h2>${escapeHtml(s.hubOthers)}</h2>
        <ul class="doc-links">${others}</ul>
      </section>`,
    ],
  });
}

export function renderLearnIndex(locale: string, decks: Deck[], locales: string[]): string {
  const s = learnStrings(locale);
  const targets = targetsFor(locale, locales);
  const totalWords = decks.reduce((n, deck) => n + deck.entries.length, 0);

  const byLanguage = targets.map(
    (target) => `          <li>
            <a href="${learnTargetPath(locale, target)}"><strong>${escapeHtml(
              t(s.otherLanguageLink, { language: s.languageNamesCap[target] }),
            )}</strong></a>
            <span class="doc-card-meta">${escapeHtml(
              t(s.cardTopicsWords, { topics: decks.length, words: totalWords }),
            )}</span>
          </li>`,
  );

  const byTopic = decks.map(
    (deck) => `          <li>
            <strong>${escapeHtml(deck.name)}</strong>
            <span class="doc-card-meta">${deck.entries.length}</span>
            <span class="doc-topic-langs">${targets
              .map(
                (target) =>
                  `<a href="${learnTopicPath(locale, target, deck.slug)}">${escapeHtml(
                    s.languageNamesCap[target],
                  )}</a>`,
              )
              .join('')}</span>
          </li>`,
  );

  return renderDoc({
    crumbs: learnCrumbs(locale),
    locale,
    heading: s.indexHeading,
    lede: t(s.indexLede, {
      words: totalWords,
      topics: decks.length,
      languages: locales.length,
    }),
    sections: [
      `
      <section class="doc-section">
        <h2>${escapeHtml(s.byLanguage)}</h2>
        <ul class="doc-cards">
${byLanguage.join('\n')}
        </ul>
      </section>`,
      `
      <section class="doc-section">
        <h2>${escapeHtml(s.byTopic)}</h2>
        <ul class="doc-cards doc-cards-wide">
${byTopic.join('\n')}
        </ul>
      </section>`,
      renderCta(locale, s.indexHeading, s.hubCtaBody),
    ],
  });
}
