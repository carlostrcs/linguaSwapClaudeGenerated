// Fails if `frontend/content/decks.json` has drifted from the backend's curated deck files.
//
// There is no CI in this repo yet, so this is a manual gate rather than a pipeline step: run it
// (or `npm run content:sync`) whenever the decks change. It is deliberately NOT part of
// `npm run build` — the build must depend only on the committed snapshot, so that a Vercel build
// and a local build of the same commit produce identical output.

import { existsSync, readFileSync } from 'node:fs';
import { SNAPSHOT_PATH, buildSnapshot } from './lib/decks.mjs';

if (!existsSync(SNAPSHOT_PATH)) {
  console.error(`Missing ${SNAPSHOT_PATH}. Run: npm --prefix frontend run content:sync`);
  process.exit(1);
}

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
const fresh = buildSnapshot();

if (snapshot.sourceHash !== fresh.sourceHash) {
  console.error(
    'content/decks.json is out of date with backend/LinguaSwap.Api/Data/DefaultLibraries.\n' +
      `  snapshot: ${snapshot.sourceHash}\n` +
      `  backend:  ${fresh.sourceHash}\n` +
      'Run: npm --prefix frontend run content:sync  (then commit the result)',
  );
  process.exit(1);
}

const entries = snapshot.decks.reduce((n, d) => n + d.entries.length, 0);
console.log(`content/decks.json is in sync — ${snapshot.decks.length} decks · ${entries} entries.`);
