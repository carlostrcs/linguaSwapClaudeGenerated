#!/usr/bin/env python3
"""Backfill one more language onto every existing curated deck row.

`gen.py` aligns NEW concepts across `config.LANGS`; it does NOT add a language to
rows that already shipped. Adding Polish as a 7th deck language to the ~5,260 rows
that shipped with six is this separate, one-time pass:

  for each row missing the target language, translate the English concept into it —
  giving the row's EXISTING translations to the model as sense context so the new
  word denotes the same concept — then gate the result against `wordfreq` exactly as
  `gen.py` gates alignment, and write it back into the row's translations.

Idempotent: a row that already has the language is skipped, so a re-run only fills
gaps (e.g. rows a previous run's frequency gate rejected). Row COUNT never changes,
so `emit.write_deck(expect_rows=...)` guards against a concurrent `gen.py` growth.

Like every generator pass this bills pay-as-you-go ANTHROPIC_API_KEY credit (separate
from the Claude Code subscription). Canary one deck first to price the full run:

    python add_language.py --lang pl --deck verbs
    python add_language.py --lang pl                 # every deck
    python add_language.py --lang pl --model claude-haiku-4-5
    python add_language.py --lang pl --dry-run       # translate + validate, don't write

After a clean run, re-sync the frontend snapshot and commit:

    npm --prefix frontend run content:sync
"""
from __future__ import annotations

import argparse
import json
import sys

from pydantic import BaseModel, Field
from wordfreq import zipf_frequency

import align
import emit
from config import (BATCH_SIZE, DEFAULT_EFFORT, DEFAULT_LIBRARIES_DIR, DEFAULT_MODEL,
                    HERE, LANGS, estimate_cost)
from emit import NOTES_KEY

# Human-readable name + citation-form guidance per target language, so the prompt is
# specific rather than "translate to pl". Extend this to add another language later.
LANG_NAMES: dict[str, str] = {
    "pl": "Polish",
    "nl": "Dutch",
    "ru": "Russian",
    "uk": "Ukrainian",
    "cs": "Czech",
    "sv": "Swedish",
}

LANG_NOTES: dict[str, str] = {
    "pl": (
        "Polish nouns are lower-case unless they are proper nouns. Use the correct Polish "
        "diacritics (ą ć ę ł ń ó ś ź ż). Nouns in the nominative singular, verbs in the infinitive, "
        "adjectives in the masculine nominative singular."
    ),
}

# The languages already present on a shipped row, used as sense anchors in the prompt.
# (Everything except English, which is the concept itself, and the language being added.)
CONTEXT_LANGS = ["en", "es", "fr", "de", "it", "pt"]


def system_prompt(lang: str) -> str:
    name = LANG_NAMES.get(lang, lang)
    notes = LANG_NOTES.get(lang, "Use the standard dictionary citation form a learner would use.")
    return f"""You are a lexicographer adding {name} translations to existing vocabulary flashcards.

Each row gives an English concept and its translations in several other languages. Those existing \
translations FIX the exact sense being taught — your job is to translate that SAME sense into {name}.

Rules:
- Match the sense shown by the other translations. If they mean "bank = financial institution", \
give the {name} word for that sense, never a different one.
- Give ONE translation. No alternatives, no slashes, no parentheses, no annotations of any kind — \
the learner types the value exactly as written, so anything extra becomes text they must type.
- {notes}
- A multi-word translation is acceptable ONLY where {name} genuinely has no single word.
- Prefer the everyday word a native speaker uses most, not a formal or literary synonym.
- Echo the English word back exactly as it was given.
- Every word must be a real, current, commonly used {name} word. Never invent a word."""


class Translated(BaseModel):
    en: str = Field(description="The English concept, echoed back exactly as given")
    word: str = Field(description="The translation in the target language")


class TranslatedBatch(BaseModel):
    rows: list[Translated]


def _context(row: dict[str, str]) -> str:
    """`en (es=…, fr=…, de=…, it=…, pt=…)  [note: …]` — the sense anchors for one row."""
    others = ", ".join(f"{lang}={row[lang]}" for lang in CONTEXT_LANGS if lang != "en" and row.get(lang))
    line = f"- {row['en']} ({others})"
    note = str(row.get(NOTES_KEY, "")).strip()
    if note:
        line += f"  [note: {note}]"
    return line


def translate_batch(
    rows: list[dict[str, str]], lang: str, model: str, effort: str, fix_note: str | None = None
) -> dict[str, str]:
    """Translate a batch of rows into `lang`. Returns {english_word: translation}. Cached on disk."""
    ens = [r["en"].strip() for r in rows]
    payload = json.dumps(sorted(ens), ensure_ascii=False) + f"|{lang}|{fix_note or ''}"
    hit = align._cached(f"backfill-{lang}", model, payload)
    if hit is None:
        listing = "\n".join(_context(r) for r in rows)
        name = LANG_NAMES.get(lang, lang)
        prompt = f"Add the {name} translation for each of these concepts:\n{listing}"
        if fix_note:
            prompt += (
                f"\n\nA previous attempt produced {name} words that failed a frequency check "
                f"(not common real words):\n{fix_note}\n"
                f"Correct those, using the most common real {name} word for the sense shown."
            )
        parsed = align.parse_streamed(
            model=model,
            max_tokens=32000,
            system=system_prompt(lang),
            user=prompt,
            output_format=TranslatedBatch,
            effort=effort,
        )
        hit = [{"en": r.en, "word": r.word} for r in parsed.rows]
        align._store(f"backfill-{lang}", model, payload, hit)

    return {r["en"].strip().lower(): str(r["word"]).strip() for r in hit if r.get("en")}


def word_problem(word: str, lang: str, zipf_floor: float) -> str | None:
    """Reject a translation the same way gen.py's gate does: no annotations, and every token must
    be a real word in `lang` clearing the commonness floor. Returns a reason, or None if it passes."""
    w = word.strip()
    if not w:
        return "empty"
    if "(" in w or "[" in w:
        return f"parenthetical annotation: {w!r}"
    if "/" in w:
        return f"slash alternative: {w!r}"
    z = min((zipf_frequency(tok, lang) for tok in w.split()), default=0.0)
    if z <= 0.0 or z < zipf_floor:
        return f"failed frequency gate (zipf {z:.2f} < {zipf_floor})"
    return None


def deck_floors() -> dict[str, float]:
    """slug -> zipf_floor from decks.yaml, so the new language is gated as strictly as the deck."""
    import yaml

    path = HERE / "decks.yaml"
    decks = yaml.safe_load(path.read_text(encoding="utf-8")).get("decks", {}) if path.exists() else {}
    return {slug: float(cfg.get("zipf_floor", 1.5)) for slug, cfg in decks.items()}


def backfill_deck(
    path, lang: str, model: str, effort: str, zipf_floor: float, dry_run: bool
) -> tuple[int, int, int]:
    """Fill `lang` on every row that lacks it. Returns (filled, still_missing, already_had)."""
    name, description, rows = emit.read_existing(path)
    if not rows:
        return 0, 0, 0

    already = sum(1 for r in rows if r.get(lang))
    todo = [r for r in rows if not r.get(lang)]
    print(f"\n=== {path.stem} ===")
    print(f"  rows: {len(rows)}  already have {lang}: {already}  to translate: {len(todo)}")
    if not todo:
        return 0, 0, already

    # by_en points at the actual row objects so we can write translations straight in.
    by_en = {r["en"].strip().lower(): r for r in todo}

    def apply(mapping: dict[str, str]) -> tuple[list[dict], list[dict]]:
        """Validate a {en: word} mapping; set passing words on their rows. Returns (passed, flagged)."""
        passed, flagged = [], []
        for en_key, word in mapping.items():
            row = by_en.get(en_key)
            if row is None or row.get(lang):
                continue
            problem = word_problem(word, lang, zipf_floor)
            if problem:
                flagged.append({"en": row["en"], "word": word, "reason": problem})
            else:
                row[lang] = word.strip()
                passed.append({"en": row["en"], "word": word})
        return passed, flagged

    flagged: list[dict] = []
    for i in range(0, len(todo), BATCH_SIZE):
        batch = todo[i : i + BATCH_SIZE]
        print(f"  translating {i + 1}-{i + len(batch)} of {len(todo)}...", flush=True)
        mapping = translate_batch(batch, lang, model, effort)
        _, bad = apply(mapping)
        flagged.extend(bad)

    # One automated re-query for the flagged rows — same shape as gen.py's retry.
    if flagged:
        retry_rows = [by_en[f["en"].strip().lower()] for f in flagged if f["en"].strip().lower() in by_en]
        note = "\n".join(f"- {f['en']}: {f['word']!r} ({f['reason']})" for f in flagged)
        print(f"  re-querying {len(retry_rows)} flagged rows...", flush=True)
        recovered = 0
        for i in range(0, len(retry_rows), BATCH_SIZE):
            batch = retry_rows[i : i + BATCH_SIZE]
            mapping = translate_batch(batch, lang, model, effort, fix_note=note)
            ok, _ = apply(mapping)
            recovered += len(ok)
        print(f"  after retry: {recovered} recovered")

    filled = sum(1 for r in todo if r.get(lang))
    still_missing = len(todo) - filled
    if still_missing:
        rejects = [{"en": r["en"], "context": _context(r)} for r in todo if not r.get(lang)]
        (HERE / "rejects").mkdir(exist_ok=True)
        (HERE / "rejects" / f"{path.stem}.{lang}-missing.json").write_text(
            json.dumps(rejects, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"  !! {still_missing} rows still without {lang} — logged to rejects/{path.stem}.{lang}-missing.json")

    if not dry_run:
        # Row count is unchanged, so guard against a concurrent gen.py growth (which would make
        # this write stale) exactly as the cleaning passes do.
        if emit.write_deck(path, name, description, rows, expect_rows=len(rows)):
            print(f"  wrote {filled} new {lang} translations -> {path}")
        else:
            print(f"  !! refused to write {path.stem}: row count changed under us (concurrent gen.py?)")
    else:
        print(f"  dry run — would fill {filled} rows (not written)")

    return filled, still_missing, already


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--lang", required=True, help="language code to add (e.g. pl)")
    parser.add_argument("--deck", help="slug of a single deck (default: every deck file)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model (default {DEFAULT_MODEL})")
    parser.add_argument("--effort", default=DEFAULT_EFFORT, help=f"thinking effort (default {DEFAULT_EFFORT})")
    parser.add_argument("--zipf-floor", type=float, help="override the per-deck commonness gate")
    parser.add_argument("--dry-run", action="store_true", help="translate + validate but do not write")
    args = parser.parse_args()

    lang = args.lang.strip().lower()
    if lang not in LANGS:
        sys.exit(f"'{lang}' is not in config.LANGS {LANGS}. Add it there first so emit/validate know it.")

    floors = deck_floors()
    if args.deck:
        files = [DEFAULT_LIBRARIES_DIR / f"{args.deck}.json"]
        if not files[0].exists():
            sys.exit(f"No deck file at {files[0]}")
    else:
        files = sorted(DEFAULT_LIBRARIES_DIR.glob("*.json"))

    total_filled = total_missing = 0
    for path in files:
        floor = args.zipf_floor if args.zipf_floor is not None else floors.get(path.stem, 1.3)
        try:
            filled, missing, _ = backfill_deck(path, lang, args.model, args.effort, floor, args.dry_run)
            total_filled += filled
            total_missing += missing
        except Exception as exc:  # one bad deck must not abort the run
            print(f"  !! {path.stem} failed: {type(exc).__name__}: {exc}")

    print(f"\nDone: filled {total_filled} rows with {lang}; {total_missing} still missing (see rejects/).")
    usage = align.TOTAL_USAGE
    if usage.get("calls"):
        print(f"Spend: {usage['calls']} API calls ({args.model}) | "
              f"in={usage['input']:,} out={usage['output']:,} tokens | ~${estimate_cost(args.model, usage):.2f}")
    else:
        print("Spend: $0.00 — no billable calls (all cached, or none needed)")
    if total_missing:
        print(f"\n{total_missing} rows still lack {lang}. Re-run to retry them, lower --zipf-floor, or "
              f"fill them by hand — every row needs {lang} before the locale is activated "
              "(the SEO build calls .normalize() on the missing value).")


if __name__ == "__main__":
    main()
