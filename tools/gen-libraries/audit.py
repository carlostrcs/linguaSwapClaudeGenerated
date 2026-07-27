#!/usr/bin/env python3
"""Audit (and optionally clean) the shipped DefaultLibraries decks.

Two independent checks, both automated:

    python audit.py --sentences              # dry run: which entries are true sentences
    python audit.py --sentences --apply      # remove them from the JSON files
    python audit.py --verify                 # semantic review of every row
    python audit.py --verify --apply         # apply the reviewer's corrections

Dry run is the default — nothing is written without --apply.

DbSeeder reconciles masters to these files on every startup, so removing a row here
removes it from the master on the next run. User copies are snapshots and keep theirs —
repair those with fix_db.py.
"""
from __future__ import annotations

import argparse
import json
import sys

import emit
import verify
from prune_notes import HANDCRAFTED
from config import DEFAULT_LIBRARIES_DIR, DEFAULT_MODEL, LANGS

SHIPPED = ["travel", "food", "dating", "work", "smalltalk", "shopping", "health", "slang"]
ALL_DECKS = SHIPPED + ["common-300", "common-1000", "verbs", "adjectives", "home", "nature"]
BATCH = 60


# The reviewer often answers with prose ("pt=experimentar_wrong: should be 'provar'…")
# or self-contradicting commentary rather than a word. Writing that into a file would
# corrupt the content, so only a clean, short, single-word-ish value is ever accepted.
_PROSE_MARKERS = (":", ";", "/", "(", ")", "_", "'", '"', " or ", " but ", " is ",
                  "should", "wrong", "better", "however", "actually", "recommend")


def _clean_fix(fix: str) -> str | None:
    """Extract a usable replacement word from a reviewer 'lang=word' string, or None."""
    _, sep, word = fix.partition("=")
    if not sep:
        return None
    word = word.strip()
    low = word.lower()
    if not word or len(word) > 30 or len(word.split()) > 3:
        return None
    if any(marker in low for marker in _PROSE_MARKERS):
        return None
    return word


def load(slug: str):
    """Read a deck via emit.read_existing so rows carry their notes.

    Reading only `translations` here would drop every existing note on the next
    write — the handcrafted disambiguations would be silently destroyed.
    """
    path = DEFAULT_LIBRARIES_DIR / f"{slug}.json"
    name, description, rows = emit.read_existing(path)
    return path, name, description, rows


def run_sentences(slugs: list[str], model: str, apply: bool) -> None:
    grand_removed = 0
    grand_total = 0
    for slug in slugs:
        path, name, desc, rows = load(slug)
        grand_total += len(rows)
        multi = [r for r in rows if len(r.get("en", "").split()) > 1]
        if not multi:
            print(f"\n=== {slug}: no multi-word entries ===")
            continue

        verdicts: dict[str, bool] = {}
        for i in range(0, len(multi), BATCH):
            chunk = [r["en"] for r in multi[i : i + BATCH]]
            verdicts.update(verify.classify_entries(chunk, model=model))

        sentences = [r for r in multi if verdicts.get(r["en"].strip().lower(), False)]
        keep = [r for r in rows if not verdicts.get(r["en"].strip().lower(), False)]
        grand_removed += len(sentences)

        print(f"\n=== {slug} ({name}) ===")
        print(f"  rows {len(rows)} | multi-word {len(multi)} | classified SENTENCE {len(sentences)}")
        for r in sentences:
            print(f"    - {r['en']}")
        if apply and sentences:
            if not emit.write_deck(path, name, desc, keep, expect_rows=len(rows)):
                # Another pass changed this deck while we worked; writing our
                # stale copy would silently delete whatever it added.
                print(f"  !! {slug}: changed on disk — refusing stale write")
                continue
            print(f"  -> wrote {len(keep)} rows (removed {len(sentences)})")
        elif sentences:
            print(f"  (dry run — would leave {len(keep)} rows)")

    print(f"\nTOTAL: {grand_removed} sentences across {grand_total} rows"
          f"{' — REMOVED' if apply else ' — dry run, nothing written'}")


def run_verify(slugs: list[str], model: str, apply: bool) -> None:
    grand_bad = 0
    for slug in slugs:
        path, name, desc, rows = load(slug)
        verdicts: dict[str, verify.RowVerdict] = {}
        for i in range(0, len(rows), BATCH):
            verdicts.update(verify.verify_rows(rows[i : i + BATCH], model=model))

        bad = []
        for r in rows:
            v = verdicts.get(r.get("en", "").strip().lower())
            if v and not v.ok:
                bad.append((r, v))
        grand_bad += len(bad)

        print(f"\n=== {slug} ({name}) ===")
        print(f"  rows {len(rows)} | flagged {len(bad)}")
        for r, v in bad[:40]:
            current = ", ".join(f"{l}={r.get(l)}" for l in v.bad_langs if r.get(l))
            print(f"    - {r['en']:24} bad: {current}")
            if v.fixes:
                print(f"      fix: {', '.join(v.fixes)}")

        if apply and bad:
            applied = skipped = 0
            for r, v in bad:
                for fix in v.fixes:
                    word = _clean_fix(fix)
                    lang = fix.partition("=")[0].strip().lower()
                    if word and lang in LANGS and lang != "en":
                        r[lang] = word
                        applied += 1
                    else:
                        skipped += 1
            if not emit.write_deck(path, name, desc, rows, expect_rows=len(rows)):
                # Another pass changed this deck while we worked; writing our
                # stale copy would silently delete whatever it added.
                print(f"  !! {slug}: changed on disk — refusing stale write")
                continue
            print(f"  -> applied {applied} corrections, skipped {skipped} unusable")

    print(f"\nTOTAL flagged: {grand_bad}{' — corrections applied' if apply else ' — dry run'}")


def run_notes(slugs: list[str], model: str, apply: bool, rewrite: bool = False) -> None:
    """Add clarifying notes where a translation could mislead (false friends, senses)."""
    grand = 0
    for slug in slugs:
        path, name, desc, rows = load(slug)
        suggestions: dict[str, str] = {}
        for i in range(0, len(rows), BATCH):
            suggestions.update(verify.suggest_notes(rows[i : i + BATCH], model=model))

        added = cleared = 0
        for row in rows:
            note = suggestions.get(row.get("en", "").strip().lower())
            existing = row.get(emit.NOTES_KEY)
            if rewrite:
                # Replace every generated note. Handcrafted ones are already
                # language-neutral and stay as the reference style.
                if existing and existing not in HANDCRAFTED:
                    del row[emit.NOTES_KEY]
                    cleared += 1
                    existing = None
            # Never overwrite a handcrafted note already on the row.
            if note and not existing:
                row[emit.NOTES_KEY] = note
                added += 1
                if added <= 8:
                    print(f"    {row['en']:22} -> {note}")
        grand += added
        print(f"=== {slug} ({name}) — {added} notes of {len(rows)} rows"
              + (f" (cleared {cleared} old)" if rewrite else ""))
        # `cleared` matters as much as `added`: a rewrite pass that only removes
        # language-dependent notes still has to be written out.
        if apply and (added or cleared):
            if not emit.write_deck(path, name, desc, rows, expect_rows=len(rows)):
                # Another pass changed this deck while we worked; writing our
                # stale copy would silently delete whatever it added.
                print(f"  !! {slug}: changed on disk — refusing stale write")
                continue

    print(f"\nTOTAL notes added: {grand}{' — APPLIED' if apply else ' — dry run'}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--sentences", action="store_true", help="classify/remove true sentences")
    p.add_argument("--verify", action="store_true", help="semantic review of translations")
    p.add_argument("--notes", action="store_true", help="add clarifying notes where misleading")
    p.add_argument("--rewrite", action="store_true",
                   help="with --notes: replace existing generated notes instead of keeping them")
    p.add_argument("--apply", action="store_true", help="write changes (default is dry run)")
    p.add_argument("--decks", default="all", help="comma-separated slugs, or 'all'")
    p.add_argument("--model", default=DEFAULT_MODEL)
    args = p.parse_args()

    slugs = ALL_DECKS if args.decks == "all" else [s.strip() for s in args.decks.split(",")]
    if not (args.sentences or args.verify or args.notes):
        p.print_help()
        sys.exit(0)
    if args.sentences:
        run_sentences(slugs, args.model, args.apply)
    if args.verify:
        run_verify(slugs, args.model, args.apply)
    if args.notes:
        run_notes(slugs, args.model, args.apply, args.rewrite)


if __name__ == "__main__":
    main()
