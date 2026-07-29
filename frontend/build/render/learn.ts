// The generated vocabulary pages: an index, one hub per target language, and one page per
// (language, topic) pair.
//
// Each topic page publishes a SAMPLE of its deck — see SAMPLE_ROWS. That is a deliberate product
// decision (the curated libraries are a paid feature) that happens to be good for these pages too:
// a 40-row table plus real prose is a page, whereas dumping 1,000 rows would be a 150 kB data
// dump. The remaining count is the honest reason to sign up.

import { escapeHtml } from '../html';
import type { Deck } from '../decks';
import { analysePair } from '../content/analysis';
import type { PairFacts } from '../content/analysis';
import {
  SAMPLE_ROWS,
  SOURCE,
  TARGETS,
  TOPIC_NOUNS,
  learnIndexPath,
  targetPath,
  topicPath,
} from '../content/topics';
import type { Target } from '../content/topics';
import { renderCta, renderDoc } from './doc';
import type { Crumb } from './doc';

const SOURCE_NAME = 'English';

// Breadcrumb trails are built here and reused for the BreadcrumbList structured data in
// routes.ts, so the visible trail and the markup describing it cannot disagree.
export function learnCrumbs(): Crumb[] {
  return [{ label: 'Home', path: '/' }, { label: 'Vocabulary' }];
}

export function targetCrumbs(target: Target): Crumb[] {
  return [
    { label: 'Home', path: '/' },
    { label: 'Vocabulary', path: learnIndexPath() },
    { label: target.name },
  ];
}

export function topicCrumbs(target: Target, deck: Deck): Crumb[] {
  return [
    { label: 'Home', path: '/' },
    { label: 'Vocabulary', path: learnIndexPath() },
    { label: target.name, path: targetPath(target) },
    { label: deck.name },
  ];
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "Spanish travel vocabulary" — the phrase the page is trying to rank for. */
export function topicHeading(target: Target, deck: Deck): string {
  return `${target.name} ${TOPIC_NOUNS[deck.slug]} vocabulary`;
}

// ---------------------------------------------------------------------------- the word table

function renderTable(target: Target, deck: Deck): string {
  const rows = deck.entries.slice(0, SAMPLE_ROWS).map((entry) => {
    const note = entry.n ? escapeHtml(entry.n) : '';
    return `          <tr><td>${escapeHtml(entry.t[SOURCE])}</td><td lang="${target.id}">${escapeHtml(
      entry.t[target.id],
    )}</td><td class="doc-note">${note}</td></tr>`;
  });

  return `
      <section class="doc-section">
        <h2>${escapeHtml(`${SOURCE_NAME} to ${target.name}: the first ${Math.min(SAMPLE_ROWS, deck.entries.length)} words`)}</h2>
        <div class="doc-table-wrap">
          <table class="doc-table">
            <thead><tr><th>${SOURCE_NAME}</th><th>${escapeHtml(target.name)}</th><th>Notes</th></tr></thead>
            <tbody>
${rows.join('\n')}
            </tbody>
          </table>
        </div>
      </section>`;
}

// ------------------------------------------------------------------------ pair-specific prose

/**
 * The paragraph that makes this page different from the same topic in another language. Every
 * number here is measured from the deck itself, so `es`/`it` and `es`/`de` genuinely read
 * differently rather than being one template with a name swapped in.
 */
function renderFacts(target: Target, facts: PairFacts): string {
  const points: string[] = [];

  if (facts.nearCognatePercent >= 15) {
    const examples = facts.cognateExamples
      .slice(0, 3)
      .map((pair) => `<code>${escapeHtml(pair.target)}</code>`)
      .join(', ');
    points.push(
      `<li><strong>${facts.nearCognates} of these ${facts.total} words</strong> are near-identical in ` +
        `${escapeHtml(SOURCE_NAME)} and ${escapeHtml(target.name)} (${facts.nearCognatePercent}%)` +
        `${examples ? ` — for example ${examples}` : ''}. Those are free; the value of drilling is in the rest.</li>`,
    );
  }

  if (facts.diacritics.length) {
    const chars = facts.diacritics.map((c) => `<code>${escapeHtml(c)}</code>`).join(' ');
    points.push(
      `<li><strong>Accents count.</strong> Answers are graded accent-sensitively, so you need ` +
        `${chars} — LinguaSwap shows a one-tap keypad for them while you type.</li>`,
    );
  }

  if (facts.caseSensitive) {
    points.push(
      '<li><strong>Capitalisation counts.</strong> German nouns are capitalised, and answers in ' +
        'German are graded that way — <code>haus</code> is not <code>Haus</code>.</li>',
    );
  }

  if (facts.withNotes > 0) {
    points.push(
      `<li><strong>${plural(facts.withNotes, 'word carries', 'words carry')} a usage note</strong> in the full ` +
        'library, for the cases where a direct translation would mislead you.</li>',
    );
  }

  if (!points.length) return '';

  return `
      <section class="doc-section">
        <h2>${escapeHtml(`What to watch out for in ${target.name}`)}</h2>
        <ul class="doc-points">
${points.map((p) => `          ${p}`).join('\n')}
        </ul>
      </section>`;
}

function renderRemainder(target: Target, deck: Deck): string {
  const remaining = deck.entries.length - Math.min(SAMPLE_ROWS, deck.entries.length);
  if (remaining <= 0) return '';

  return `
      <section class="doc-section doc-more">
        <p>
          <strong>${plural(remaining, 'more word', 'more words')}</strong> in the full
          &ldquo;${escapeHtml(deck.name)}&rdquo; library, each aligned across six languages and
          scheduled for you by spaced repetition. Add it to your account and start drilling
          ${escapeHtml(SOURCE_NAME)} to ${escapeHtml(target.name)} in one click.
        </p>
      </section>`;
}

// ------------------------------------------------------------------------------ related links

function renderRelated(target: Target, deck: Deck, decks: Deck[]): string {
  const sameTopic = TARGETS.filter((other) => other.id !== target.id).map(
    (other) =>
      `<li><a href="${topicPath(other, deck)}">${escapeHtml(topicHeading(other, deck))}</a></li>`,
  );

  const sameLanguage = decks
    .filter((other) => other.slug !== deck.slug)
    .slice(0, 6)
    .map(
      (other) =>
        `<li><a href="${topicPath(target, other)}">${escapeHtml(topicHeading(target, other))}</a></li>`,
    );

  return `
      <section class="doc-section doc-related">
        <h2>${escapeHtml(`The same topic in other languages`)}</h2>
        <ul class="doc-links">
${sameTopic.map((l) => `          ${l}`).join('\n')}
        </ul>
        <h2>${escapeHtml(`More ${target.name} vocabulary`)}</h2>
        <ul class="doc-links">
${sameLanguage.map((l) => `          ${l}`).join('\n')}
          <li><a href="${targetPath(target)}">All ${escapeHtml(target.name)} vocabulary lists</a></li>
        </ul>
      </section>`;
}

// ------------------------------------------------------------------------------------- pages

export function renderTopicPage(target: Target, deck: Deck, decks: Deck[]): string {
  const facts = analysePair(deck, SOURCE, target.id);
  const shown = Math.min(SAMPLE_ROWS, deck.entries.length);

  return renderDoc({
    crumbs: topicCrumbs(target, deck),
    heading: `${topicHeading(target, deck)}: ${deck.entries.length} words`,
    lede:
      `${deck.description} This page lists ${shown} of them with their ${target.name} translations, ` +
      `then lets you practise the full set in either direction with spaced repetition.`,
    sections: [
      renderTable(target, deck),
      renderRemainder(target, deck),
      renderFacts(target, facts),
      renderCta(
        `Practise ${target.name} ${TOPIC_NOUNS[deck.slug]} vocabulary`,
        'Words come back just before you would forget them, and every language direction is tracked separately.',
      ),
      renderRelated(target, deck, decks),
    ],
  });
}

export function renderTargetHub(target: Target, decks: Deck[]): string {
  const totalWords = decks.reduce((n, deck) => n + deck.entries.length, 0);

  const cards = decks.map((deck) => {
    const facts = analysePair(deck, SOURCE, target.id);
    return `          <li>
            <a href="${topicPath(target, deck)}"><strong>${escapeHtml(topicHeading(target, deck))}</strong></a>
            <span class="doc-card-meta">${deck.entries.length} words · ${facts.nearCognatePercent}% near-cognates</span>
            <span class="muted">${escapeHtml(deck.description)}</span>
          </li>`;
  });

  const others = TARGETS.filter((other) => other.id !== target.id)
    .map((other) => `<li><a href="${targetPath(other)}">${escapeHtml(other.name)} vocabulary</a></li>`)
    .join('');

  return renderDoc({
    crumbs: targetCrumbs(target),
    heading: `Learn ${target.name} vocabulary`,
    lede:
      `${totalWords} curated ${target.name} words across ${decks.length} topics, each one aligned with its ` +
      `English equivalent and scheduled for review by a Leitner spaced-repetition system.`,
    sections: [
      `
      <section class="doc-section">
        <h2>${escapeHtml(`${target.name} vocabulary by topic`)}</h2>
        <ul class="doc-cards">
${cards.join('\n')}
        </ul>
      </section>`,
      renderCta(
        `Start practising ${target.name}`,
        'Pick a topic, choose a direction, and drill. The free plan covers five libraries and 500 words each.',
      ),
      `
      <section class="doc-section doc-related">
        <h2>Other languages</h2>
        <ul class="doc-links">${others}</ul>
      </section>`,
    ],
  });
}

export function renderLearnIndex(decks: Deck[]): string {
  const totalWords = decks.reduce((n, deck) => n + deck.entries.length, 0);

  const byLanguage = TARGETS.map(
    (target) => `          <li>
            <a href="${targetPath(target)}"><strong>${escapeHtml(target.name)} vocabulary</strong></a>
            <span class="doc-card-meta">${decks.length} topics · ${totalWords} words</span>
          </li>`,
  );

  const byTopic = decks.map(
    (deck) => `          <li>
            <strong>${escapeHtml(deck.name)}</strong>
            <span class="doc-card-meta">${deck.entries.length} words</span>
            <span class="doc-topic-langs">${TARGETS.map(
              (target) =>
                `<a href="${topicPath(target, deck)}">${escapeHtml(target.name)}</a>`,
            ).join('')}</span>
          </li>`,
  );

  return renderDoc({
    crumbs: learnCrumbs(),
    heading: 'Vocabulary lists for English speakers',
    lede:
      `${totalWords} curated words across ${decks.length} topics, each aligned across ` +
      `${TARGETS.map((t) => t.name).join(', ')} — with spaced repetition to make them stick.`,
    sections: [
      `
      <section class="doc-section">
        <h2>By language</h2>
        <ul class="doc-cards">
${byLanguage.join('\n')}
        </ul>
      </section>`,
      `
      <section class="doc-section">
        <h2>By topic</h2>
        <ul class="doc-cards doc-cards-wide">
${byTopic.join('\n')}
        </ul>
      </section>`,
      renderCta(
        'Practise any of these free',
        'Create an account to save your progress, or open the demo and start drilling straight away.',
      ),
    ],
  });
}
