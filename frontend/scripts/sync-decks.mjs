// Regenerates `frontend/content/decks.json` from the backend's curated deck files.
//
// Run this after growing a deck with `tools/gen-libraries`, then commit the result:
//   npm --prefix frontend run content:sync
//
// The build never reads `../backend` — see scripts/lib/decks.mjs for why.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { SNAPSHOT_PATH, buildSnapshot, serialise } from './lib/decks.mjs';

// Reuse the existing `generatedAt` when the content is unchanged, so re-running the script on a
// different day does not churn every `lastmod` in the sitemap for no reason.
function previousSnapshot() {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

const previous = previousSnapshot();
const fresh = buildSnapshot();
const generatedAt =
  previous && previous.sourceHash === fresh.sourceHash ? previous.generatedAt : fresh.generatedAt;

const snapshot = { ...fresh, generatedAt };

mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
writeFileSync(SNAPSHOT_PATH, serialise(snapshot), 'utf8');

const entries = snapshot.decks.reduce((n, d) => n + d.entries.length, 0);
const notes = snapshot.decks.reduce((n, d) => n + d.entries.filter((e) => e.n).length, 0);
const unchanged = previous?.sourceHash === snapshot.sourceHash;

console.log(
  `${SNAPSHOT_PATH}\n` +
    `  ${snapshot.decks.length} decks · ${entries} entries · ${notes} with notes\n` +
    `  ${snapshot.sourceHash}\n` +
    `  generatedAt ${snapshot.generatedAt}${unchanged ? ' (content unchanged)' : ''}`,
);
