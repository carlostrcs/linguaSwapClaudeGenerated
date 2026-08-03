// Asserts every locale dictionary has exactly the same keys as English.
//
// A missing key falls back to English at runtime, which is the right behaviour for a UI but makes
// gaps invisible — this is what surfaces them. Run with `npm run i18n:check`.
//
// Keys are read with a regex rather than by importing the modules: these are `.ts` files and this
// script has to run under plain node with no build step.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'dictionaries');

/** Every top-level key in a dictionary module, in file order. */
function keysOf(file) {
  const text = readFileSync(join(DIR, file), 'utf8');
  return [...text.matchAll(/^ {2}'([^']+)':/gm)].map((m) => m[1]);
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.ts')).sort();
const enKeys = keysOf('en.ts');
const enSet = new Set(enKeys);

if (enKeys.length !== enSet.size) {
  const seen = new Set();
  const dupes = enKeys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
  console.error(`en.ts has duplicate keys: ${[...new Set(dupes)].join(', ')}`);
  process.exit(1);
}

let failed = false;

for (const file of files) {
  if (file === 'en.ts') continue;
  const keys = keysOf(file);
  const set = new Set(keys);

  const missing = enKeys.filter((k) => !set.has(k));
  const extra = keys.filter((k) => !enSet.has(k));
  const dupes = keys.length !== set.size ? keys.filter((k, i) => keys.indexOf(k) !== i) : [];

  if (missing.length || extra.length || dupes.length) {
    failed = true;
    console.error(`\n${file}:`);
    if (missing.length) console.error(`  missing ${missing.length}: ${missing.join(', ')}`);
    if (extra.length) console.error(`  not in en ${extra.length}: ${extra.join(', ')}`);
    if (dupes.length) console.error(`  duplicated: ${[...new Set(dupes)].join(', ')}`);
  } else {
    console.log(`${file} — ${keys.length} keys, matches en`);
  }
}

if (failed) {
  console.error('\ni18n check failed.');
  process.exit(1);
}

console.log(`\nAll ${files.length} locales match en (${enKeys.length} keys).`);
