#!/usr/bin/env python3
"""Generate concept-aligned word libraries for LinguaSwap's featured decks.

Pipeline: source concepts -> align across 6 languages (Claude API) -> validate
(structural + wordfreq correctness gate) -> re-query failures once -> dedup
(mirrors EntryImport.Signature) -> emit the app's DefaultLibraries JSON.

Usage:
    python gen.py --list
    python gen.py --deck food
    python gen.py --all
    python gen.py --deck food --size 300 --model claude-haiku-4-5
    python gen.py --demo food --size 8
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

import align
import concepts
import emit
import verify
from align import TOTAL_USAGE
from config import (BATCH_SIZE, DEFAULT_LIBRARIES_DIR, DEFAULT_MODEL, HERE, LANGS,
                    estimate_cost)
from dedup import deduplicate, signature
from validate import frequency_problems, structural_problem


def load_decks() -> dict:
    path = HERE / "decks.yaml"
    if not path.exists():
        sys.exit(f"No deck config at {path}")
    return yaml.safe_load(path.read_text(encoding="utf-8")).get("decks", {})


def source_concepts(deck: dict, want: int, exclude: set[str], model: str) -> list[str]:
    """Get `want` new English concepts for a deck, skipping ones already present."""
    kind = deck.get("type", "themed")
    if kind == "frequency":
        # Over-source: exclusions and filtering thin the raw frequency list.
        pool = concepts.frequency_concepts(want * 3 + len(exclude) + 200)
    elif kind == "themed":
        theme = deck.get("theme") or deck.get("name")
        # Ask only for what's still missing, and pass the existing words as exclusions
        # so the model doesn't spend the request re-proposing what the deck already has.
        raw = align.theme_concepts(theme, int(want * 2.0) + 40, model=model, exclude=exclude)
        pool = concepts.filter_real_words(raw)
        # Topical relevance gate: once a topic is exhausted the generator pads with
        # alphabetically adjacent dictionary words whose translations are perfectly
        # correct, so only a relevance check catches them. Runs before alignment.
        before = len(pool)
        pool = verify.filter_relevant(theme, pool, model=model)
        print(f"  relevance: {len(pool)}/{before} candidates on-topic")
    else:
        sys.exit(f"Unknown deck type {kind!r} (expected 'themed' or 'frequency')")

    out: list[str] = []
    seen = set(exclude)
    for word in pool:
        w = word.strip().lower()
        if not w or w in seen:
            continue
        seen.add(w)
        out.append(w)
        if len(out) >= want:
            break
    return out


def validate_rows(
    rows: list[dict[str, str]], zipf_floor: float
) -> tuple[list[dict[str, str]], list[dict]]:
    """Split rows into (passing, failing-with-reason)."""
    good: list[dict[str, str]] = []
    bad: list[dict] = []
    for row in rows:
        problem = structural_problem(row)
        if problem:
            bad.append({"row": row, "reason": problem, "flagged": []})
            continue
        flagged = frequency_problems(row, zipf_floor)
        if flagged:
            bad.append(
                {
                    "row": row,
                    "reason": "failed frequency gate",
                    "flagged": [
                        {"lang": lang, "word": word, "zipf": z} for lang, word, z in flagged
                    ],
                }
            )
            continue
        good.append(row)
    return good, bad


def build_deck(
    slug: str, deck: dict, model: str, size_override: int | None, use_verify: bool = False
) -> None:
    name = deck["name"]
    description = deck["description"]
    size = size_override or int(deck.get("size", 100))
    zipf_floor = float(deck.get("zipf_floor", 1.5))
    path = DEFAULT_LIBRARIES_DIR / f"{slug}.json"

    existing_name, existing_desc, existing_rows = emit.read_existing(path)
    existing_sigs = {signature(r) for r in existing_rows}
    existing_en = {r.get("en", "").strip().lower() for r in existing_rows}

    want = size - len(existing_rows)
    print(f"\n=== {slug} ({deck.get('type', 'themed')}) ===")
    print(f"  existing rows: {len(existing_rows)}  target: {size}  new needed: {max(want, 0)}")
    if want <= 0:
        print("  already at target size — nothing to do (raise `size` to grow it)")
        return

    words = source_concepts(deck, want, existing_en, model)
    print(f"  sourced {len(words)} new concepts")
    if not words:
        print("  no new concepts available")
        return

    aligned: list[dict[str, str]] = []
    for i in range(0, len(words), BATCH_SIZE):
        batch = words[i : i + BATCH_SIZE]
        print(f"  aligning {i + 1}-{i + len(batch)} of {len(words)}...", flush=True)
        aligned.extend(align.align_batch(batch, model=model))

    good, bad = validate_rows(aligned, zipf_floor)
    print(f"  gate: {len(good)} passed, {len(bad)} flagged")

    # One automated re-query pass for the flagged rows — no human in the loop.
    if bad:
        retry_words = [b["row"]["en"] for b in bad if b["row"].get("en")]
        notes = "\n".join(
            f"- {b['row'].get('en')}: "
            + ", ".join(f"{f['lang']}={f['word']!r} (zipf {f['zipf']})" for f in b["flagged"])
            for b in bad
            if b["flagged"]
        )
        if retry_words:
            print(f"  re-querying {len(retry_words)} flagged rows...", flush=True)
            retried: list[dict[str, str]] = []
            for i in range(0, len(retry_words), BATCH_SIZE):
                batch = retry_words[i : i + BATCH_SIZE]
                retried.extend(align.align_batch(batch, model=model, fix_note=notes))
            fixed, still_bad = validate_rows(retried, zipf_floor)
            print(f"  after retry: {len(fixed)} recovered, {len(still_bad)} dropped")
            good.extend(fixed)
            bad = still_bad

    # Optional semantic pass. Used only to REJECT rows, never to rewrite them: a
    # dropped candidate just means a different word gets used, whereas applying the
    # reviewer's suggested "fixes" can confidently introduce a wrong word.
    if use_verify and good:
        verdicts: dict = {}
        for i in range(0, len(good), 60):
            verdicts.update(verify.verify_rows(good[i : i + 60], model=model))
        surviving = []
        for row in good:
            verdict = verdicts.get(row["en"].strip().lower())
            if verdict is not None and not verdict.ok:
                bad.append(
                    {
                        "row": row,
                        "reason": "semantic review: " + ", ".join(verdict.bad_langs),
                        "flagged": [],
                    }
                )
            else:
                surviving.append(row)
        print(f"  semantic review: {len(surviving)} kept, {len(good) - len(surviving)} dropped")
        good = surviving

    kept, skipped = deduplicate(good, existing_sigs)
    print(f"  dedup: {len(kept)} kept, {skipped} duplicates skipped")

    all_rows = existing_rows + kept
    emit.write_deck(path, existing_name or name, existing_desc or description, all_rows)
    emit.write_rejects(HERE / "rejects" / f"{slug}.rejects.json", bad)
    print(f"  wrote {len(all_rows)} rows -> {path}")
    if bad:
        print(f"  {len(bad)} dropped rows logged to rejects/{slug}.rejects.json (optional glance)")


def emit_demo(slug: str, size: int) -> None:
    """Print a ready-to-paste DEMO_FEATURED entry sliced from a generated deck."""
    path = DEFAULT_LIBRARIES_DIR / f"{slug}.json"
    name, description, rows = emit.read_existing(path)
    if not rows:
        sys.exit(f"No generated deck at {path} — run `python gen.py --deck {slug}` first")
    print(f"  {{\n    name: {name!r},\n    description: {description!r},\n    entries: [")
    for row in rows[:size]:
        inner = ", ".join(f"{lang}: {row[lang]!r}" for lang in LANGS if row.get(lang))
        print(f"      {{ translations: {{ {inner} }} }},")
    print("    ],\n  },")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--deck", help="slug of a single deck to build")
    parser.add_argument("--all", action="store_true", help="build every deck in decks.yaml")
    parser.add_argument("--list", action="store_true", help="list configured decks")
    parser.add_argument("--demo", help="print a DEMO_FEATURED snippet from a built deck")
    parser.add_argument("--size", type=int, help="override the deck's target size")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model (default {DEFAULT_MODEL})")
    parser.add_argument("--verify", action="store_true",
                        help="second-pass semantic review; drops rows whose senses disagree")
    args = parser.parse_args()

    decks = load_decks()

    if args.list:
        for slug, deck in decks.items():
            print(f"{slug:16} {deck.get('type', 'themed'):10} size={deck.get('size')} {deck['name']}")
        return

    if args.demo:
        emit_demo(args.demo, args.size or 8)
        return

    if args.all:
        targets = list(decks)
    elif args.deck:
        if args.deck not in decks:
            sys.exit(f"Unknown deck {args.deck!r}. Known: {', '.join(decks)}")
        targets = [args.deck]
    else:
        parser.print_help()
        return

    failures: list[str] = []
    for slug in targets:
        try:
            build_deck(slug, decks[slug], args.model, args.size, args.verify)
        except Exception as exc:  # one bad deck must not abort the whole run
            print(f"  !! {slug} failed: {type(exc).__name__}: {exc}")
            failures.append(slug)
    if failures:
        print(f"\nFailed decks: {', '.join(failures)}")

    # Cached batches never reach the API, so this is what the run actually bought.
    if TOTAL_USAGE.get("calls"):
        print(f"Spend: {TOTAL_USAGE['calls']} API calls ({args.model}) | "
              f"in={TOTAL_USAGE['input']:,} out={TOTAL_USAGE['output']:,} tokens | "
              f"~${estimate_cost(args.model, TOTAL_USAGE):.2f}")
    else:
        print("Spend: $0.00 — no billable calls (all cached, or none needed)")


if __name__ == "__main__":
    main()
