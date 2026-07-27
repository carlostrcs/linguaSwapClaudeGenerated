#!/usr/bin/env python3
"""One-off cleanup: move annotations out of answer text and into `notes`.

Three defects, all with the same root cause — disambiguation was written into the
value the learner has to type:

1. Parenthetical qualifiers in the English value ("sweet (person)", "orange (colour)").
   The practice card grades the full string, so the learner had to type "(person)" too.
   The qualifier belongs in `notes`, which the card shows at every difficulty.
2. Slash alternatives ("guy / dude"). The learner had to type the slash exactly.
   `AnswerChecker` already accepts COMMA-separated alternatives, so these become
   "guy, dude" and either answer is now graded correct.
3. Two slang rows both prompting "Come on!" with different answers — indistinguishable
   on the card. Notes separate the two senses.

Dry run by default:  python fix_annotations.py
Apply:               python fix_annotations.py --apply
"""
from __future__ import annotations

import argparse
import re

import emit
from config import DEFAULT_LIBRARIES_DIR
from emit import NOTES_KEY

# (deck, original english) -> (new english, note). Handcrafted: choosing the right
# gloss needs editorial judgement ("orange" the colour vs the fruit), and a note is
# only worth adding when it actually disambiguates.
FIXES: dict[tuple[str, str], tuple[str, str]] = {
    ("dating", "sweet (person)"): ("sweet", "Describing a person: kind and affectionate."),
    ("dating", "boyfriend/girlfriend (partner)"): ("partner", "A romantic partner, of either gender."),
    ("dating", "to text (a message)"): ("to text", "To send a text message."),
    ("dating", "to kiss (verb)"): ("to kiss", ""),
    ("health", "cold (illness)"): ("cold", "The illness, not the temperature."),
    ("shopping", "change (money back)"): ("change", "Money handed back after paying, not a change of plan."),
    ("shopping", "orange (colour)"): ("orange", "The colour, not the fruit."),
    ("shopping", "to save (money)"): ("to save", "To save money, not to rescue."),
    ("slang", "Good luck! (break a leg)"): ("Good luck!", "Said before a performance or challenge."),
    ("slang", "on the dot (exactly)"): ("on the dot", "Exactly on time."),
    ("slang", "awesome! (exclamation)"): ("awesome!", "Exclamation of approval."),
    ("work", "minutes (of a meeting)"): ("minutes", "The written record of a meeting, not units of time."),
    ("work", "mouse (computer)"): ("mouse", "The computer device, not the animal."),
    ("work", "to apply (for a job)"): ("to apply", "To apply for a job or position."),
    ("work", "shift (work)"): ("shift", "A period of work, e.g. the night shift."),
}

# Same English prompt, different senses — notes tell them apart on the card.
COME_ON = {
    "¡Vamos!": "Encouragement: let's go, hurry up.",
    "¡venga ya!": "Disbelief: you can't be serious.",
}

SHIPPED = ["travel", "food", "dating", "work", "smalltalk", "shopping", "health", "slang"]


def split_alternatives(value: str) -> str:
    """'guy / dude' -> 'guy, dude' (comma = accepted alternatives in AnswerChecker)."""
    if "/" not in value:
        return value
    parts = [p.strip() for p in re.split(r"\s*/\s*", value) if p.strip()]
    return ", ".join(parts) if len(parts) > 1 else value


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write changes (default: dry run)")
    args = ap.parse_args()

    total_paren = total_slash = total_sense = 0
    for slug in SHIPPED:
        path = DEFAULT_LIBRARIES_DIR / f"{slug}.json"
        name, desc, rows = emit.read_existing(path)
        changed = False

        for row in rows:
            en = row.get("en", "")

            key = (slug, en)
            if key in FIXES:
                new_en, note = FIXES[key]
                print(f"  [{slug}] {en!r} -> {new_en!r}" + (f"   notes: {note}" if note else "   (note dropped: redundant)"))
                row["en"] = new_en
                if note:
                    row[NOTES_KEY] = note
                total_paren += 1
                changed = True

            if slug == "slang" and row.get("en") == "Come on!" and row.get("es") in COME_ON:
                row[NOTES_KEY] = COME_ON[row["es"]]
                print(f"  [{slug}] 'Come on!' ({row['es']}) -> notes: {COME_ON[row['es']]}")
                total_sense += 1
                changed = True

            for lang in list(row):
                if lang.startswith("_"):
                    continue
                new_value = split_alternatives(row[lang])
                if new_value != row[lang]:
                    print(f"  [{slug}] {lang}: {row[lang]!r} -> {new_value!r}")
                    row[lang] = new_value
                    total_slash += 1
                    changed = True

        if changed and args.apply:
            if not emit.write_deck(path, name, desc, rows, expect_rows=len(rows)):
                # Another pass changed this deck while we worked; writing our
                # stale copy would silently delete whatever it added.
                print(f"  !! {slug}: changed on disk — refusing stale write")
                continue

    print(
        f"\nparenthetical fixes: {total_paren} | slash->comma: {total_slash} | "
        f"sense notes: {total_sense}"
        + ("  — APPLIED" if args.apply else "  — dry run, nothing written")
    )


if __name__ == "__main__":
    main()
