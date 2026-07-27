"""Second-pass LLM checks that the wordfreq gate structurally cannot do.

`wordfreq` proves a word is real and common; it says nothing about whether it is the
RIGHT word. Two judgments live here, both automated:

  - verify_rows:      do all six words denote the same concept? (catches sense drift,
                      e.g. English "way" -> German "Weg" (path) while Spanish says
                      "manera" (manner))
  - classify_entries: is an English entry a true SENTENCE, or a phrase/compound/idiom
                      worth keeping as a lexical unit?

Both run as independent calls with their own context, so the judge is not just agreeing
with itself inside one generation.
"""
from __future__ import annotations

import json
import re

from pydantic import BaseModel, Field

from align import _cached, _store, parse_streamed
from config import DEFAULT_MODEL, TARGET_LANGS

VERIFY_SYSTEM = """You are a strict bilingual reviewer checking vocabulary flashcards.

Each card gives an English word and its translations in Spanish, French, German, Italian \
and European Portuguese.

Mark a card INCONSISTENT when any translation denotes a DIFFERENT concept from the English \
word and the other translations. Typical faults:
- sense drift: English "way" (manner) translated to German "Weg" (path)
- wrong register or a rare/literary synonym where a common everyday word exists
- a bare adjective stem instead of the usable form (German "letzt" instead of "letzte")
- an inflected or plural form where the citation form is expected

Do NOT mark a card inconsistent merely because:
- a language legitimately needs several words ("pomme de terre")
- two different English words share one translation in a language (French "aimer" for both \
"like" and "love") — that is a real property of the language

For each card set `ok` true or false. When false, list the offending language codes in \
`bad_langs` and give the corrected word for each in `fixes` as "lang=word" strings."""

CLASSIFY_SYSTEM = """You classify English flashcard entries as SENTENCE or PHRASE.

SENTENCE = a complete utterance with a subject and a finite verb, used as a whole statement \
or question. Examples: "Where is the bathroom?", "I am lost", "You look great tonight", \
"I would like to order", "Can I buy you a drink?".

PHRASE = anything worth learning as a single lexical unit, including:
- compound nouns: "boarding pass", "credit card", "exchange rate"
- noun phrases: "soup of the day", "reservation for two"
- infinitive/verb phrases: "to fall in love", "to hang out"
- fixed idioms and set expressions, EVEN IF grammatically a clause: "It's a piece of cake", \
"It's raining cats and dogs", "not my cup of tea"
- greetings and social formulas: "good morning", "thank you", "you're welcome", \
"nice to meet you", "see you soon"

When in doubt, classify as PHRASE — these are curated learning materials and removing a \
useful entry is worse than keeping a borderline one.

Set `is_sentence` true ONLY for genuine sentences as defined above."""


RELEVANCE_SYSTEM = """You curate vocabulary decks for language learners.

Given a topic and candidate English words, decide for each whether it genuinely belongs in a \
well-made phrasebook chapter on THAT topic — a word a learner studying this topic would \
actually expect and need.

Be strict. Reject a word when it is:
- only loosely or metaphorically associated with the topic
- generic vocabulary that belongs to no topic in particular (e.g. "density", "display", \
"dummy" are not travel words)
- technical, literary or rare where the topic calls for everyday language
- clearly dictionary filler produced to pad a list

A generator that has exhausted a topic tends to pad with alphabetically adjacent words. \
Reject that padding: it is far better to return a short, genuinely on-topic deck than a \
long one padded with words that do not belong.

Set `relevant` true only for words that clearly belong to the topic."""


class RelevanceItem(BaseModel):
    word: str
    relevant: bool


class RelevanceBatch(BaseModel):
    items: list[RelevanceItem]


def filter_relevant(
    theme: str, words: list[str], model: str = DEFAULT_MODEL, batch: int = 100
) -> list[str]:
    """Keep only candidate words that genuinely belong to the topic.

    Runs BEFORE alignment so off-topic candidates never cost translation tokens, and
    catches the failure the sense-verifier structurally cannot: a correctly translated
    word that simply is not part of the topic.
    """
    kept: list[str] = []
    for i in range(0, len(words), batch):
        chunk = words[i : i + batch]
        payload = json.dumps([theme, sorted(chunk)], ensure_ascii=False)
        hit = _cached("relevance", model, payload)
        if hit is None:
            listing = "\n".join(f"- {w}" for w in chunk)
            parsed = parse_streamed(
                model=model,
                max_tokens=32000,
                system=RELEVANCE_SYSTEM,
                user=f"Topic: {theme}\n\nCandidates:\n{listing}",
                output_format=RelevanceBatch,
            )
            hit = [it.model_dump() for it in parsed.items]
            _store("relevance", model, payload, hit)
        verdicts = {it["word"].strip().lower(): it["relevant"] for it in hit}
        kept.extend(w for w in chunk if verdicts.get(w.strip().lower(), False))
    return kept


NOTES_SYSTEM = """You write short clarifying notes for vocabulary flashcards.

THE CRITICAL CONSTRAINT — the note must be LANGUAGE-NEUTRAL.

One note is stored per card and shown to EVERY learner, whichever language pair they practise. \
A learner going English->German sees the same note as one going English->Spanish. So a note that \
names a language or quotes a foreign word is useless to most of the people who read it:

  BAD:  "Chemise (French) is a formal shirt; 'camisa' can be casual or formal."
  BAD:  "Spanish 'discutir' often implies arguing."
  BAD:  "'Pez' is a living fish; 'pescado' is fish as food."

Instead, describe the MEANING of the concept itself, in plain English, so it makes sense to \
anyone regardless of which language they are learning:

  GOOD: "The colour, not the fruit."
  GOOD: "Money handed back after paying, not a change of plan."
  GOOD: "To talk something over calmly — not to argue."
  GOOD: "The written record of a meeting, not units of time."
  GOOD: "A living fish in water, not fish as food."

Rules for the note text:
- NEVER name a language (Spanish, French, German, Italian, Portuguese).
- NEVER quote or include a word from another language.
- Say which SENSE of the word is being taught, and what it is NOT, when confusable.
- Under 90 characters, plain English, addressed to the learner.
- Do not restate the translation or explain what an idiom obviously means.

Add a note ONLY when it genuinely helps:
- the word has several common senses and the card teaches only one;
- the word is easily confused with a similar-looking or related word;
- the register matters (very informal, or only used in a specific situation).

Most straightforward words (water, book, table) need NO note. Set `needs_note` false for those \
and leave `note` empty."""


class NoteSuggestion(BaseModel):
    en: str
    needs_note: bool
    note: str = ""


class NoteBatch(BaseModel):
    suggestions: list[NoteSuggestion]


def suggest_notes(
    rows: list[dict[str, str]], model: str = DEFAULT_MODEL
) -> dict[str, str]:
    """Return {english: note} for rows that genuinely need clarification."""
    if not rows:
        return {}
    payload = json.dumps(
        [{k: r[k] for k in ("en", *TARGET_LANGS) if k in r} for r in rows],
        ensure_ascii=False,
        sort_keys=True,
    )
    hit = _cached("notes", model, payload)
    if hit is None:
        listing = "\n".join(
            f"- en={r['en']} | " + " | ".join(f"{l}={r.get(l, '')}" for l in TARGET_LANGS)
            for r in rows
        )
        parsed = parse_streamed(
                model=model,
                max_tokens=32000,
                system=NOTES_SYSTEM,
                user=f"Review these cards:\n{listing}",
                output_format=NoteBatch,
            )
        hit = [s.model_dump() for s in parsed.suggestions]
        _store("notes", model, payload, hit)
    out: dict[str, str] = {}
    for s in hit:
        note = (s.get("note") or "").strip()
        if s.get("needs_note") and note and is_language_neutral(note):
            out[s["en"].strip().lower()] = note
    return out


# One note is shown to every learner whatever pair they practise, so a note naming a
# language or quoting a foreign word is noise for most readers. Enforced in code, not
# just asked for in the prompt.
_LANGUAGE_NAMES = (
    "spanish", "french", "german", "italian", "portuguese", "english",
    "castilian", "catalan", "brazilian", "iberian",
)


def is_language_neutral(note: str) -> bool:
    """False when the note names a language or quotes a foreign word."""
    low = note.lower()
    if any(name in low for name in _LANGUAGE_NAMES):
        return False
    # A quoted token is nearly always a foreign form being contrasted. Apostrophes
    # inside a word (don't, it's) are fine, so only flag a quote that OPENS a word.
    if re.search(r"(?<![A-Za-z])['‘’\"]\w{2,}", note):
        return False
    return True


class RowVerdict(BaseModel):
    en: str
    ok: bool
    bad_langs: list[str] = Field(default_factory=list)
    fixes: list[str] = Field(default_factory=list)


class VerdictBatch(BaseModel):
    verdicts: list[RowVerdict]


class EntryClass(BaseModel):
    en: str
    is_sentence: bool


class ClassBatch(BaseModel):
    entries: list[EntryClass]


def verify_rows(
    rows: list[dict[str, str]], model: str = DEFAULT_MODEL
) -> dict[str, RowVerdict]:
    """Judge semantic consistency of a batch of rows. Keyed by English word."""
    if not rows:
        return {}
    payload = json.dumps(
        [{k: r[k] for k in ("en", *TARGET_LANGS) if k in r} for r in rows],
        ensure_ascii=False,
        sort_keys=True,
    )
    hit = _cached("verify", model, payload)
    if hit is None:
        listing = "\n".join(
            f"- en={r['en']} | " + " | ".join(f"{l}={r.get(l, '')}" for l in TARGET_LANGS)
            for r in rows
        )
        parsed = parse_streamed(
                model=model,
                max_tokens=32000,
                system=VERIFY_SYSTEM,
                user=f"Review these cards:\n{listing}",
                output_format=VerdictBatch,
            )
        hit = [v.model_dump() for v in parsed.verdicts]
        _store("verify", model, payload, hit)
    return {v["en"].strip().lower(): RowVerdict(**v) for v in hit}


def classify_entries(entries: list[str], model: str = DEFAULT_MODEL) -> dict[str, bool]:
    """Classify English entries as sentence (True) or phrase (False)."""
    if not entries:
        return {}
    payload = json.dumps(sorted(entries), ensure_ascii=False)
    hit = _cached("classify", model, payload)
    if hit is None:
        listing = "\n".join(f"- {e}" for e in entries)
        parsed = parse_streamed(
                model=model,
                max_tokens=32000,
                system=CLASSIFY_SYSTEM,
                user=f"Classify these entries:\n{listing}",
                output_format=ClassBatch,
            )
        hit = [e.model_dump() for e in parsed.entries]
        _store("classify", model, payload, hit)
    return {e["en"].strip().lower(): e["is_sentence"] for e in hit}
