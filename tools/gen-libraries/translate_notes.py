#!/usr/bin/env python3
"""Translate each curated entry's clarifying note into the app's other UI languages.

A deck note is short English prose glossing the English headword ("Temperature sense, not
fashionable or calm."). The app now shows a note in the user's UI language (backend:
Entry.NotesI18nJson, resolved via Services/Localized), so this pass fills a per-entry
`notesI18n` map alongside the canonical English `notes`.

Unlike deck WORDS, notes are never typed or graded, so — per the tooling's own rule — a
single-model translation is acceptable here (the "no rewrite on one model's say-so" rule exists
because a wrong graded word marks a correct learner wrong; a slightly awkward note does not). There
is therefore no wordfreq gate; a missing/blank translation for a locale just falls back to the
English note, so coverage need not be 100%.

Bills pay-as-you-go ANTHROPIC_API_KEY credit like every generator pass. Canary one deck first:

    python translate_notes.py --deck food
    python translate_notes.py                 # every deck
    python translate_notes.py --model claude-haiku-4-5
    python translate_notes.py --dry-run       # translate but don't write

After a run, re-sync the frontend snapshot and commit:  npm --prefix frontend run content:sync
"""
from __future__ import annotations

import argparse
import json
import sys

from pydantic import BaseModel, Field

import align
import emit
from config import (DEFAULT_EFFORT, DEFAULT_LIBRARIES_DIR, DEFAULT_MODEL, estimate_cost)
from emit import NOTES_I18N_KEY, NOTES_KEY

# The non-English UI locales a note is translated into. English stays the canonical `notes`.
TARGET_LOCALES = ["es", "fr", "de", "it", "pt", "pl"]
LOCALE_NAMES = {"es": "Spanish", "fr": "French", "de": "German", "it": "Italian",
                "pt": "Portuguese", "pl": "Polish"}

# Smaller batches than word alignment: a note is a sentence, not a word, so a batch of 40 notes ×
# six languages is a large structured answer.
BATCH = 20

SYSTEM = """You are translating short usage notes for language-learning flashcards.

Each note is a brief English gloss explaining how to use a word — which sense is meant, a false
friend to avoid, a register warning. You are given the English headword, its translations, and the
English note. Translate the NOTE into each requested language.

Rules:
- Keep it a short, natural note in each language — same meaning and tone as the English, not a
  word-for-word calque.
- The note is ABOUT the word; do not translate it into a different word or add information.
- Keep any word the note quotes (often the English headword or a translation) recognisable.
- Return one translation per requested language. Never leave one blank."""


class NoteRow(BaseModel):
    en: str = Field(description="The English headword, echoed back exactly as given")
    es: str = Field(description="The note in Spanish")
    fr: str = Field(description="The note in French")
    de: str = Field(description="The note in German")
    it: str = Field(description="The note in Italian")
    pt: str = Field(description="The note in Portuguese")
    pl: str = Field(description="The note in Polish")


class NoteBatch(BaseModel):
    rows: list[NoteRow]


def _prompt_row(row: dict[str, str]) -> str:
    others = ", ".join(f"{l}={row[l]}" for l in ("es", "fr", "de", "it", "pt") if row.get(l))
    return f'- {row["en"]} ({others})\n  note: {row[NOTES_KEY]}'


def translate_batch(rows: list[dict[str, str]], model: str, effort: str) -> dict[str, dict[str, str]]:
    """Translate a batch of notes. Returns {english_headword: {locale: note}}. Cached on disk."""
    ens = [r["en"].strip() for r in rows]
    payload = json.dumps(sorted(ens), ensure_ascii=False) + "|notes|" + ",".join(TARGET_LOCALES)
    hit = align._cached("notes-i18n", model, payload)
    if hit is None:
        listing = "\n".join(_prompt_row(r) for r in rows)
        prompt = (
            "Translate each note into Spanish, French, German, Italian, Portuguese and Polish:\n\n"
            + listing
        )
        parsed = align.parse_streamed(
            model=model,
            max_tokens=32000,
            system=SYSTEM,
            user=prompt,
            output_format=NoteBatch,
            effort=effort,
        )
        hit = [r.model_dump() for r in parsed.rows]
        align._store("notes-i18n", model, payload, hit)

    out: dict[str, dict[str, str]] = {}
    for r in hit:
        en = str(r.get("en", "")).strip().lower()
        if not en:
            continue
        out[en] = {loc: str(r.get(loc, "")).strip() for loc in TARGET_LOCALES if str(r.get(loc, "")).strip()}
    return out


def translate_deck(path, model: str, effort: str, dry_run: bool) -> tuple[int, int]:
    """Fill notesI18n on every noted row that lacks a full set. Returns (filled, already_complete)."""
    name, description, rows = emit.read_existing(path)
    if not rows:
        return 0, 0

    noted = [r for r in rows if str(r.get(NOTES_KEY, "")).strip()]

    def complete(r: dict) -> bool:
        have = r.get(NOTES_I18N_KEY) or {}
        return all(have.get(loc) for loc in TARGET_LOCALES)

    todo = [r for r in noted if not complete(r)]
    already = len(noted) - len(todo)
    print(f"\n=== {path.stem} ===")
    print(f"  noted rows: {len(noted)}  already translated: {already}  to translate: {len(todo)}")
    if not todo:
        return 0, already

    by_en = {r["en"].strip().lower(): r for r in todo}
    filled = 0
    for i in range(0, len(todo), BATCH):
        batch = todo[i : i + BATCH]
        print(f"  translating {i + 1}-{i + len(batch)} of {len(todo)}...", flush=True)
        mapping = translate_batch(batch, model, effort)
        for en_key, notes in mapping.items():
            row = by_en.get(en_key)
            if row is None or not notes:
                continue
            row[NOTES_I18N_KEY] = notes
            filled += 1

    if not dry_run:
        # Row count is unchanged; guard against a concurrent gen.py growth like the other passes.
        if emit.write_deck(path, name, description, rows, expect_rows=len(rows)):
            print(f"  wrote notesI18n for {filled} rows -> {path}")
        else:
            print(f"  !! refused to write {path.stem}: row count changed (concurrent gen.py?)")
    else:
        print(f"  dry run — would fill {filled} rows (not written)")

    return filled, already


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--deck", help="slug of a single deck (default: every deck file)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model (default {DEFAULT_MODEL})")
    parser.add_argument("--effort", default=DEFAULT_EFFORT, help=f"thinking effort (default {DEFAULT_EFFORT})")
    parser.add_argument("--dry-run", action="store_true", help="translate but do not write")
    args = parser.parse_args()

    if args.deck:
        files = [DEFAULT_LIBRARIES_DIR / f"{args.deck}.json"]
        if not files[0].exists():
            sys.exit(f"No deck file at {files[0]}")
    else:
        files = sorted(DEFAULT_LIBRARIES_DIR.glob("*.json"))

    total = 0
    for path in files:
        try:
            filled, _ = translate_deck(path, args.model, args.effort, args.dry_run)
            total += filled
        except Exception as exc:  # one bad deck must not abort the run
            print(f"  !! {path.stem} failed: {type(exc).__name__}: {exc}")

    print(f"\nDone: filled notesI18n on {total} rows.")
    usage = align.TOTAL_USAGE
    if usage.get("calls"):
        print(f"Spend: {usage['calls']} API calls ({args.model}) | "
              f"in={usage['input']:,} out={usage['output']:,} tokens | ~${estimate_cost(args.model, usage):.2f}")
    else:
        print("Spend: $0.00 — no billable calls (all cached, or none needed)")


if __name__ == "__main__":
    main()
