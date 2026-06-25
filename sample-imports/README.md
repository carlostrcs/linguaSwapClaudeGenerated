# Sample import files

Test data for the **Import** feature. In the app: **Libraries → Import from a file** panel (or the
**Import** button on a library card) → choose one of these files → pick a target (an existing
library or *New library from file*) → **Import**.

## Format

Each entry is `{ "translations": { "<lang>": "<word>", ... }, "notes": "<optional>" }`. The
importer accepts a **bare array** or a `{ "entries": [ ... ] }` wrapper.

## Files

| File | What it is |
|------|------------|
| `spanish-basics-en-es.json` | 25 everyday English/Spanish words (a few with notes). |
| `travel-en-es-fr.json` | 20 travel words in **three** languages (en/es/fr) — practise any direction pair. |
| `wrapped-example.json` | 6 colours using the `{ "entries": [...] }` **wrapper** form. |
| `large-3000.json` | 3000 generated en/es entries — verifies large imports (no word limit). |
| `invalid-duplicate-language.json` | **Intentionally broken** — has an empty entry and a duplicate language. Import is all-or-nothing, so this one is rejected with an error and **nothing** is imported. |

## Tip

Import is *additive* (it appends words). To re-test from a clean slate, create a new library or use
*New library from file*.
