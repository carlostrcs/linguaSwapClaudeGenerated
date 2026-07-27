#!/usr/bin/env python3
"""Replace stiff, dated or bookish translations with what a native actually says today.

    python naturalness.py                    # dry run over every deck
    python naturalness.py --decks food,work  # a subset
    python naturalness.py --apply            # write the corroborated fixes

This is the pass `audit.py --verify` could not safely be. That reviewer judges
*sense consistency* (do all six words denote the same concept?), and applying its
corrections was tried and abandoned — a single confident reviewer produced
well-formed, plausible, WRONG words: German `kündigen`->`zurücktreten` for
*resign*, European Portuguese `constipação`->`resfriado` for *cold*. See README.

So the question here is different — "is this the word a native reaches for in
2026?" — and, more importantly, no single judgment can change a file. A
replacement is written only when it survives all three gates:

  1. MAJORITY  — at least 2 of 3 independent reviewers flag the current word.
  2. CONSENSUS — at least 2 of them independently propose the SAME replacement.
  3. FREQUENCY — `wordfreq` confirms the replacement is genuinely *more common*
                 than the word it replaces, in that language.

Gate 3 is the one that makes auto-apply defensible. "More natural" is an opinion
and opinions are what produced `zurücktreten`; "more common in real usage" is a
measurement. A reviewer that talks three of its peers into a rarer word still
cannot get it past a corpus. Anything that fails any gate is left alone and
written to `review/<slug>.naturalness.json` for an optional human glance.

The three reviewers are given deliberately DIFFERENT lenses rather than the same
prompt three times — redundancy catches noise, diversity catches blind spots.
Each is a separate API call with its own cache key, so none sees the others.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed

from pydantic import BaseModel, Field
from wordfreq import zipf_frequency

import emit
from align import _cached, _store, parse_streamed
from config import DEFAULT_LIBRARIES_DIR, DEFAULT_MODEL, HERE, TARGET_LANGS, estimate_cost

ALL_DECKS = [
    "travel", "food", "dating", "work", "smalltalk", "shopping", "health", "slang",
    "common-300", "common-1000", "verbs", "adjectives", "home", "nature",
]

BATCH = 50
WORKERS = 8
REVIEW_DIR = HERE / "review"

# This pass READS and filters; it never writes prose. The answer is a short JSON list,
# and the three-way consensus plus the wordfreq gate already backstop a weak judgment —
# so paying for deep deliberation here buys almost nothing. `low` is the right default;
# raise it with --effort only if the review shortlist looks like it is missing things.
EFFORT = "low"

# Reviewers must AGREE, not merely be numerous: 2 of 3 for both gates.
MIN_FLAGS = 2
MIN_AGREE = 2


# --------------------------------------------------------------------------
# The three lenses
# --------------------------------------------------------------------------

_SHARED_RULES = """
Only report a translation you would actually change. Most cards are fine — a deck \
where you flag everything is useless, and every false flag costs a learner a correct answer.

NEVER flag a word merely because:
- a synonym also exists (nearly every word has synonyms)
- you personally prefer a different register
- the language legitimately needs several words ("pomme de terre")
- it is regional but standard in a major variety of the language

Portuguese is EUROPEAN Portuguese, not Brazilian. Do not "correct" a correct European \
form to its Brazilian counterpart — `constipação` (cold/congestion) is correct European \
Portuguese and must not become `resfriado`.

The replacement must be:
- a single word, or the shortest natural phrase where the language has no single word
- the citation form a learner would use: verbs in the infinitive, nouns singular with \
no article, German nouns capitalized
- plain text ONLY — no parentheses, no slashes, no alternatives, no commentary. The \
learner types this string exactly, so anything you add becomes text they must type.
"""

LENSES: dict[str, str] = {
    # Lens 1 — register. Catches formal/literary/textbook words.
    "register": """You are a native speaker of Spanish, French, German, Italian and European \
Portuguese reviewing vocabulary flashcards for learners.

For each card you see an English concept and its translation in one of those languages. Ask \
one question: would an ordinary native speaker use THIS word in everyday speech today, or is \
it formal, literary, bureaucratic, textbook-stiff, or dated?

Flag a translation when a learner saying it aloud would sound like a textbook rather than a \
person, and a plainer everyday word exists for the same concept.
"""
    + _SHARED_RULES,

    # Lens 2 — corpus frequency. Catches technically-correct-but-rare choices.
    "frequency": """You estimate real-world word frequency for vocabulary flashcards.

For each card you see an English concept and one translation. Imagine 100 naturally occurring \
uses of that concept in contemporary spoken and written language. Ask one question: is THIS \
word the one that would dominate those 100 uses, or is there a clearly more common word for \
the same concept?

Flag a translation only when a different word would plainly be more frequent in real use — \
not merely equally common, and not a near-tie.
"""
    + _SHARED_RULES,

    # Lens 3 — currency. Catches words that have aged out.
    "currency": """You track how language changes over time, reviewing vocabulary flashcards.

For each card you see an English concept and one translation. Ask one question: is THIS word \
still current, or has it aged — something a grandparent says, something from an older \
textbook, or a word younger native speakers have largely replaced?

Flag a translation only when the word is genuinely dated or receding in real use. A word being \
old is not a problem; a word sounding old to a native speaker today is.
"""
    + _SHARED_RULES,
}


class Suggestion(BaseModel):
    en: str = Field(description="The English concept, echoed back exactly as given")
    lang: str = Field(description="Language code of the flagged translation: es, fr, de, it or pt")
    current: str = Field(description="The current translation, echoed back exactly")
    better: str = Field(description="The word a native speaker would actually use")
    why: str = Field(description="Under 80 characters: why the current word is wrong for a learner")


class SuggestionBatch(BaseModel):
    suggestions: list[Suggestion] = Field(
        description="ONLY translations you would genuinely change. Empty list if all are fine."
    )


def _review(lens: str, rows: list[dict[str, str]], model: str,
            effort: str = EFFORT, usage: dict | None = None) -> list[dict]:
    """Run one lens over one batch of rows. Cached per (lens, effort, model, rows)."""
    if not rows:
        return []
    payload = json.dumps(
        [{k: r[k] for k in ("en", *TARGET_LANGS) if k in r} for r in rows],
        ensure_ascii=False,
        sort_keys=True,
    )
    # Both the lens AND the effort are part of the cache KIND. The lens so the three
    # reviewers can never collide and silently become one opinion counted three times;
    # the effort so a cheap run can't be served results a pricier one paid for, which
    # would make any cost comparison between settings meaningless.
    hit = _cached(f"natural-{lens}-e{effort}", model, payload)
    if hit is None:
        listing = "\n".join(
            f"- en={r['en']} | " + " | ".join(f"{lg}={r.get(lg, '')}" for lg in TARGET_LANGS)
            for r in rows
        )
        parsed = parse_streamed(
            model=model,
            # Thinking is on by default on Opus 5 and counts against max_tokens,
            # so this is sized well above the JSON the schema can produce.
            max_tokens=32000,
            system=LENSES[lens],
            user=f"Review these cards:\n{listing}",
            output_format=SuggestionBatch,
            effort=effort,
            usage=usage,
        )
        hit = [s.model_dump() for s in parsed.suggestions]
        _store(f"natural-{lens}-e{effort}", model, payload, hit)
    return hit


# --------------------------------------------------------------------------
# Gates
# --------------------------------------------------------------------------

def _usable(word: str) -> bool:
    """Reject anything that would become text the learner has to type."""
    word = word.strip()
    if not word or len(word) > 40 or len(word.split()) > 3:
        return False
    return not any(ch in word for ch in "()[]/;:,\"")


def _zipf(word: str, lang: str) -> float:
    """Commonness of a translation — the rarest token, matching validate.py."""
    tokens = word.strip().split()
    return min((zipf_frequency(tok, lang) for tok in tokens), default=0.0)


def _decide(current: str, lang: str, proposals: list[str], flags: int) -> tuple[bool, str, dict]:
    """Apply the three gates to one flagged (row, language). Returns (apply, word, detail)."""
    detail: dict = {"flags": flags, "proposals": proposals}

    if flags < MIN_FLAGS:
        detail["verdict"] = f"only {flags}/3 reviewers flagged it"
        return False, "", detail

    usable = [p.strip() for p in proposals if _usable(p)]
    if not usable:
        detail["verdict"] = "no usable replacement proposed"
        return False, "", detail

    # Consensus is on the WORD, compared case-insensitively so German capitalisation
    # doesn't split a real agreement — but the winner keeps its original casing,
    # because `haus` vs `Haus` is a wrong answer for German in AnswerChecker.
    counts = Counter(p.casefold() for p in usable)
    winner_fold, agree = counts.most_common(1)[0]
    detail["agree"] = agree
    if agree < MIN_AGREE:
        detail["verdict"] = f"reviewers disagreed on the replacement ({agree}/3 for any one word)"
        return False, "", detail

    winner = next(p for p in usable if p.casefold() == winner_fold)
    if winner.casefold() == current.strip().casefold():
        detail["verdict"] = "proposed replacement is the current word"
        return False, "", detail

    z_new, z_old = _zipf(winner, lang), _zipf(current, lang)
    detail.update(winner=winner, zipf_new=round(z_new, 2), zipf_old=round(z_old, 2))
    if z_new <= 0.0:
        detail["verdict"] = f"{winner!r} does not exist in wordfreq — likely invented"
        return False, "", detail
    if z_new < z_old:
        detail["verdict"] = f"{winner!r} ({z_new:.2f}) is RARER than {current!r} ({z_old:.2f})"
        return False, "", detail

    detail["verdict"] = "applied"
    return True, winner, detail


# --------------------------------------------------------------------------
# Driver
# --------------------------------------------------------------------------

def run_deck(slug: str, model: str, apply: bool,
             effort: str = EFFORT, usage: dict | None = None) -> tuple[int, int]:
    path = DEFAULT_LIBRARIES_DIR / f"{slug}.json"
    if not path.exists():
        print(f"=== {slug}: no such deck, skipped ===")
        return 0, 0
    name, description, rows = emit.read_existing(path)

    # Gather all three lenses' opinions, keyed by (english, language).
    #
    # Every (batch, lens) call is independent, and a deck is ~20 of them at a minute
    # or more each — sequential, the full sweep runs for hours. They fan out over a
    # thread pool; the SDK client is safe to share, and each call caches under its own
    # key so concurrent writes cannot collide.
    work = [
        (rows[i : i + BATCH], lens)
        for i in range(0, len(rows), BATCH)
        for lens in LENSES
    ]
    votes: dict[tuple[str, str], list[str]] = {}
    failures = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(_review, lens, chunk, model, effort, usage): lens
            for chunk, lens in work
        }
        for future in as_completed(futures):
            try:
                suggestions = future.result()
            except Exception as exc:  # one lens/batch dying must not lose the deck
                failures += 1
                print(f"    ! {futures[future]} batch failed: {type(exc).__name__}: {exc}")
                continue
            for s in suggestions:
                lang = (s.get("lang") or "").strip().lower()
                better = (s.get("better") or "").strip()
                if lang not in TARGET_LANGS or not better:
                    continue
                votes.setdefault((s["en"].strip().lower(), lang), []).append(better)

    # A dropped call silently weakens the majority gate — a word only two reviewers
    # ever saw can never reach 2/3 honestly. Say so rather than reporting a clean run.
    if failures:
        print(f"    ! {failures}/{len(work)} calls failed — some rows saw fewer than 3 reviewers")

    by_en = {r["en"].strip().lower(): r for r in rows}
    applied, review = 0, []
    for (en, lang), proposals in sorted(votes.items()):
        row = by_en.get(en)
        if row is None or not row.get(lang):
            continue
        current = row[lang]
        ok, winner, detail = _decide(current, lang, proposals, len(proposals))
        record = {"en": row["en"], "lang": lang, "current": current, **detail}
        if ok:
            row[lang] = winner
            applied += 1
            if applied <= 10:
                print(f"    {row['en']:20} {lang}  {current!r} -> {winner!r}"
                      f"  (zipf {detail['zipf_old']} -> {detail['zipf_new']})")
        else:
            review.append(record)

    print(f"=== {slug} ({name}) — {len(rows)} rows | "
          f"{len(votes)} flagged | {applied} applied | {len(review)} left for review")

    if review:
        REVIEW_DIR.mkdir(parents=True, exist_ok=True)
        (REVIEW_DIR / f"{slug}.naturalness.json").write_text(
            json.dumps(review, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    if apply and applied:
        # This pass only ever REPLACES a translation in place, so the row count it
        # writes must equal the count it read; `expect_rows` makes write_deck verify
        # that against the file and refuse a stale overwrite.
        if not emit.write_deck(path, name, description, rows, expect_rows=len(rows)):
            print(f"    !! {slug}: deck changed on disk while this pass ran — "
                  f"REFUSING to write, so nothing is lost. Re-run this deck.")
            return 0, len(review)
    return applied, len(review)


def main() -> None:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    p.add_argument("--decks", default="all", help="comma-separated slugs, or 'all'")
    p.add_argument("--apply", action="store_true", help="write changes (default is dry run)")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--effort", default=EFFORT, choices=["low", "medium", "high", "xhigh", "max"],
                   help=f"thinking depth, the main cost dial (default {EFFORT})")
    args = p.parse_args()

    slugs = ALL_DECKS if args.decks == "all" else [s.strip() for s in args.decks.split(",")]
    usage: dict = {}
    total_applied = total_review = 0
    for slug in slugs:
        a, r = run_deck(slug, args.model, args.apply, args.effort, usage)
        total_applied += a
        total_review += r

    print(f"\nTOTAL: {total_applied} translations replaced, {total_review} left for review"
          f"{' — APPLIED' if args.apply else ' — dry run, nothing written'}")
    # Cached batches cost nothing, so this reports what this run actually bought.
    if usage.get("calls"):
        print(f"Spend: {usage['calls']} API calls ({args.model}, effort={args.effort}) | "
              f"in={usage['input']:,} out={usage['output']:,} tokens | "
              f"~${estimate_cost(args.model, usage):.2f}")
    else:
        # Don't claim the cache served this — a run where every call ERRORED also
        # records no usage, and reporting that as a clean cache hit hides an outage.
        print("Spend: $0.00 — no billable calls completed "
              "(served from .cache/, and/or failed; check any '!' lines above)")
    if total_review:
        print(f"Review shortlist: {REVIEW_DIR}{chr(92)}<slug>.naturalness.json")
    if not args.apply:
        print("Re-run with --apply to write the corroborated replacements.")


if __name__ == "__main__":
    main()
