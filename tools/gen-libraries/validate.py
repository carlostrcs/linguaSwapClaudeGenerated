"""Automated validation gates — this is what removes the human from the loop.

Two checks:
  - structural: all six languages present and non-empty; the English concept is a
    single token (translations may legitimately be multi-word, e.g. 'pomme de terre',
    so multi-word is only rejected on the English side).
  - correctness: every target word must actually exist in wordfreq's data for its
    language, and clear a configurable commonness floor. A word Claude hallucinates
    or gets wrong almost always scores 0 here, so it is caught without a human.
"""
from __future__ import annotations

from wordfreq import zipf_frequency

from config import LANGS, TARGET_LANGS


def structural_problem(row: dict[str, str]) -> str | None:
    """Return a human-readable reason the row is structurally invalid, else None."""
    for lang in LANGS:
        if not row.get(lang, "").strip():
            return f"missing/empty '{lang}'"
    if len(row["en"].split()) != 1:
        return f"English concept is not a single word: {row['en']!r}"
    # Annotations must never reach the answer text: the practice card grades the
    # whole string, so "sweet (person)" forces the learner to type "(person)" and
    # "guy / dude" to type the slash. Disambiguation belongs in the notes field.
    for lang in LANGS:
        value = row[lang]
        if "(" in value or "[" in value:
            return f"'{lang}' contains a parenthetical annotation: {value!r}"
        if "/" in value:
            return f"'{lang}' contains a slash alternative: {value!r}"
    return None


def frequency_problems(row: dict[str, str], zipf_floor: float) -> list[tuple[str, str, float]]:
    """Target words that fail the correctness gate.

    A token scoring 0 (absent from wordfreq entirely) is always rejected — that is
    the hallucination signal. A real word scores >0; the floor additionally drops
    words too rare to be worth teaching. For multi-word translations we score the
    rarest token, so a nonsense token anywhere fails the row.
    """
    bad: list[tuple[str, str, float]] = []
    for lang in TARGET_LANGS:
        word = row[lang].strip()
        tokens = word.split()
        z = min((zipf_frequency(tok, lang) for tok in tokens), default=0.0)
        if z <= 0.0 or z < zipf_floor:
            bad.append((lang, word, round(z, 2)))
    return bad
