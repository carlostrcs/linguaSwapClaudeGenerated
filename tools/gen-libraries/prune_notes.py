#!/usr/bin/env python3
"""Drop notes that don't earn their place.

The note pass over-fires on the Slang & Idioms deck: because every row there IS an
idiom, it labels most of them "Idiom: means X, not literal" — which tells the learner
nothing they can't see from the English prompt. When more than half the cards carry a
note the note becomes wallpaper and the genuinely useful ones (false friends, regional
splits) stop being read.

A note is KEPT when it says something about the target languages — names a language,
quotes a foreign word, or flags a false friend. It is DROPPED when it only paraphrases
the English expression. Handcrafted notes are never touched.

Dry run:  python prune_notes.py
Apply:    python prune_notes.py --apply
"""
from __future__ import annotations

import argparse
import re

import emit
from config import DEFAULT_LIBRARIES_DIR
from emit import NOTES_KEY
from fix_annotations import COME_ON, FIXES

ALL_DECKS = [
    "travel", "food", "dating", "work", "smalltalk", "shopping", "health", "slang",
    "common-300", "common-1000", "verbs", "adjectives", "home", "nature",
]

# Notes written by hand in fix_annotations.py (and the verbs 'watch' fix) — authoritative.
HANDCRAFTED = {note for _, note in FIXES.values() if note} | set(COME_ON.values()) | {
    'The verb (to look at), not the noun "a watch".'
}

LANGUAGE_NAMES = ("spanish", "french", "german", "italian", "portuguese", "european")

# "Idiom: ...", "Proverb: ..." — a label, not information about the translation.
IDIOM_LABEL = re.compile(r"^\s*(idiom|proverb|expression|slang)\b\s*[:;-]", re.I)


def is_useful(note: str) -> bool:
    """True when the note says something about the target languages."""
    low = note.lower()
    if any(name in low for name in LANGUAGE_NAMES):
        return True
    # A quoted word is nearly always a foreign form being contrasted.
    if re.search(r"['‘’\"]\w{2,}", note):
        return True
    if "false friend" in low or "literal" in low and "not literal" not in low:
        return True
    return not IDIOM_LABEL.match(note)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--max-share", type=float, default=0.30,
                    help="only prune decks where more than this share of rows carry a note")
    args = ap.parse_args()

    total_dropped = 0
    for slug in ALL_DECKS:
        path = DEFAULT_LIBRARIES_DIR / f"{slug}.json"
        name, desc, rows = emit.read_existing(path)
        noted = [r for r in rows if r.get(NOTES_KEY)]
        if not rows or not noted:
            continue
        share = len(noted) / len(rows)
        if share <= args.max_share:
            print(f"{slug:14} {len(noted):4}/{len(rows):4} ({share:4.0%}) — under threshold, untouched")
            continue

        dropped = 0
        for row in rows:
            note = row.get(NOTES_KEY)
            if not note or note in HANDCRAFTED:
                continue
            if not is_useful(note):
                del row[NOTES_KEY]
                dropped += 1
        kept = len(noted) - dropped
        total_dropped += dropped
        print(f"{slug:14} {len(noted):4}/{len(rows):4} ({share:4.0%}) — drop {dropped}, keep {kept} "
              f"({kept / len(rows):.0%})")
        if args.apply and dropped:
            if not emit.write_deck(path, name, desc, rows, expect_rows=len(rows)):
                # Another pass changed this deck while we worked; writing our
                # stale copy would silently delete whatever it added.
                print(f"  !! {slug}: changed on disk — refusing stale write")
                continue

    print(f"\nTOTAL dropped: {total_dropped}" + (" — APPLIED" if args.apply else " — dry run"))


if __name__ == "__main__":
    main()
