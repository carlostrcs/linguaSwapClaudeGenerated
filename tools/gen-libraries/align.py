"""Claude API stage: turn English concepts into concept-aligned six-language rows.

Uses structured outputs (a JSON schema derived from the pydantic models below) so
the response is always well-formed and needs no parsing heuristics. Responses are
cached on disk keyed by (model, prompt inputs), so re-runs are cheap and stable —
growing a deck only pays for the genuinely new words.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading

import anthropic
from pydantic import BaseModel, Field

from config import CACHE_DIR, DEFAULT_EFFORT, DEFAULT_MODEL, LANGS, load_env_file

_client: anthropic.Anthropic | None = None
_usage_lock = threading.Lock()

# Every completed call lands here as well as in any caller-supplied dict, so a script
# can report what a run actually cost without threading a usage object through each
# layer. Cached responses never reach parse_streamed, so this counts only real spend.
TOTAL_USAGE: dict = {}


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        load_env_file()  # picks up ANTHROPIC_API_KEY from the gitignored .env
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise SystemExit(
                "ANTHROPIC_API_KEY is not set.\n"
                "Create tools/gen-libraries/.env containing:\n"
                "    ANTHROPIC_API_KEY=sk-ant-...\n"
                "(that file is gitignored), or export the variable in your shell."
            )
        _client = anthropic.Anthropic()
    return _client


class Row(BaseModel):
    """One concept aligned across the six languages.

    `sense` comes before the translations deliberately: committing to a single
    sense first is what stops one language drifting to a different meaning. It is
    a working field only — it is never written into the app's JSON.
    """

    en: str = Field(description="The English concept, echoed back exactly as given")
    sense: str = Field(description="Short English gloss of the ONE sense being translated")
    es: str = Field(description="Spanish translation")
    fr: str = Field(description="French translation")
    de: str = Field(description="German translation (nouns capitalized)")
    it: str = Field(description="Italian translation")
    pt: str = Field(description="European Portuguese translation")


class Batch(BaseModel):
    rows: list[Row]


class ConceptList(BaseModel):
    words: list[str]


ALIGN_SYSTEM = """You are a lexicographer building vocabulary flashcards for language learners.

For each English word given, FIRST decide which single sense of that word you are teaching, then \
translate THAT SAME SENSE into Spanish, French, German, Italian and European Portuguese.

Sense consistency (most important rule):
- All five translations MUST denote the SAME concept as each other and as the English word. \
Never let one language drift to a different sense. For example for "way" meaning manner, German \
must be "Art" (manner), NOT "Weg" (path) — mixing the two makes the card wrong.
- State that chosen sense in the `sense` field as a short English gloss (e.g. "manner, method").
- For an ambiguous English word pick the sense a learner meets first and apply it everywhere \
(e.g. "bank" = financial institution, not river bank).

Word form (citation form a learner would actually use):
- Verbs: infinitive (hablar, parler, sprechen).
- Nouns: singular, no article — write "Wasser", not "das Wasser"; "agua", not "el agua".
- Adjectives: the standalone form a learner would say, NOT a bare stem. German "letzte" and \
"erste" are correct; "letzt" and "erst" are WRONG (bare stems, and "erst" means "not until").
- Capitalize German nouns (Wasser, Haus); everything else lowercase unless a proper noun.

General:
- Give ONE translation per language. No alternatives, no slashes, no parentheses.
- NEVER add a qualifier or annotation to a value: write "sweet", not "sweet (person)"; "orange", not "orange (colour)"; "guy", not "guy / dude". The learner types the value exactly as written, so any annotation becomes text they must type. Disambiguation is carried separately by the `sense` field, never inside a translation.
- A multi-word translation is acceptable ONLY where the language genuinely has no single word \
(e.g. French "pomme de terre" for potato).
- Prefer the everyday word a native speaker uses most, not a formal or literary synonym.
- Echo the English word back exactly as it was given.
- Every word must be a real, current, commonly used word in that language. Never invent a word."""

# Bumped whenever a prompt or schema above changes, so cached responses from an
# older prompt are not silently reused.
PROMPT_VERSION = "4"

CONCEPTS_SYSTEM = """You propose vocabulary for language-learning flashcard decks.

Return the most useful single English words for the requested topic, ordered most useful first.

Rules:
- SINGLE English words only — no phrases, no multi-word expressions.
- Concrete, commonly used, teachable words that a learner of this topic actually needs.
- No proper nouns, no brand names.
- No duplicates, and no different forms of the same word (pick "travel" or "travelling", not both).
- Words must translate cleanly into other European languages as a single concept — avoid \
function words (articles, pronouns, prepositions)."""


def _cache_path(kind: str, model: str, payload: str) -> "object":
    # PROMPT_VERSION is part of the key: a prompt/schema change must invalidate
    # cached responses rather than silently serving results from the old prompt.
    digest = hashlib.sha256(
        f"{kind}|v{PROMPT_VERSION}|{model}|{payload}".encode("utf-8")
    ).hexdigest()[:32]
    return CACHE_DIR / f"{kind}-{digest}.json"


def _cached(kind: str, model: str, payload: str):
    path = _cache_path(kind, model, payload)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def _store(kind: str, model: str, payload: str, value) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    _cache_path(kind, model, payload).write_text(
        json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8"
    )


# Models discovered at runtime to reject `output_config.effort`, so the fallback is
# paid for once rather than on every call.
_EFFORT_UNSUPPORTED: set[str] = set()


def _supports_effort(model: str) -> bool:
    """Models that accept `output_config.effort`; earlier ones 400 on it.

    Matching by name rather than a "-5" substring test on purpose: effort is GA on
    the whole Opus 4.6+ family and Sonnet 4.6 too, and a substring test drops those.
    Guessing "unsupported" is not a safe default here — it silently discards a
    `--effort low` request and bills the run at the model's default instead.
    """
    if model in _EFFORT_UNSUPPORTED:
        return False
    base = model.removeprefix("anthropic.")  # Bedrock ids carry a provider prefix
    return base.startswith((
        "claude-opus-5", "claude-fable-5", "claude-mythos-5", "claude-sonnet-5",
        "claude-opus-4-6", "claude-opus-4-7", "claude-opus-4-8", "claude-sonnet-4-6",
    ))


def parse_streamed(
    *, model: str, max_tokens: int, system: str, user: str, output_format,
    effort: str | None = None, usage: dict | None = None,
):
    """`messages.parse` equivalent that streams. Returns the validated object.

    Every structured call in this tool goes through here. The SDK refuses a
    NON-streaming request whose `max_tokens` implies a worst case over 10 minutes
    (`ValueError: Streaming is required...`), and since adaptive thinking on Opus 5
    counts against `max_tokens`, the budgets these prompts need all sit past that
    line. Streaming lifts the ceiling; `get_final_message()` still carries
    `parsed_output`, so callers are unchanged.

    `effort` is the cost dial and the one worth reaching for first. Thinking tokens
    bill at OUTPUT rates, so on a task whose actual answer is a short JSON list, the
    default `high` spends far more on deliberation than on the reply. Pass `low` for
    scan-and-filter work. `usage`, if given, accumulates token counts so a run can
    report what it actually spent.
    """
    # `effort` only exists on models with adaptive thinking (the Claude 5 family).
    # Older ones — notably claude-haiku-4-5, the cheap workhorse for these scan-and-
    # filter passes — reject the parameter outright, so degrade instead of failing.
    kwargs = {}
    if _supports_effort(model):
        kwargs["output_config"] = {"effort": effort or DEFAULT_EFFORT}

    def _stream(extra: dict):
        with client().messages.stream(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_format=output_format,
            **extra,
        ) as stream:
            return stream.get_final_message()

    try:
        message = _stream(kwargs)
    except anthropic.BadRequestError as exc:
        if not kwargs or "effort" not in str(exc):
            raise
        _EFFORT_UNSUPPORTED.add(model)  # remember, so we ask once per model
        message = _stream({})
    # Callers fan these calls out over a thread pool, and read-modify-write on a
    # plain dict drops counts under contention — an under-reported bill.
    with _usage_lock:
        for sink in (TOTAL_USAGE, usage):
            if sink is None:
                continue
            sink["input"] = sink.get("input", 0) + message.usage.input_tokens
            sink["output"] = sink.get("output", 0) + message.usage.output_tokens
            sink["calls"] = sink.get("calls", 0) + 1
    return message.parsed_output


def _theme_chunk(theme: str, n: int, exclude: list[str], model: str, round_no: int) -> list[str]:
    """One chunked request for theme concepts, excluding words already taken."""
    payload = f"{theme}|{n}|r{round_no}|{len(exclude)}"
    hit = _cached("concepts", model, payload)
    if hit is None:
        prompt = f"Topic: {theme}\n\nReturn up to {n} single English words for this topic."
        if exclude:
            listing = ", ".join(exclude)
            prompt += (
                f"\n\nThese are already used — do NOT repeat any of them:\n{listing}\n\n"
                "Return only words not in that list. If the topic is genuinely exhausted and you "
                "cannot find more words that a learner of THIS topic would need, return fewer "
                "words (or none) rather than padding with unrelated vocabulary."
            )
        try:
            parsed = parse_streamed(
                model=model,
                # Proportional to what we asked for. A generous ceiling invites the
                # model to keep emitting once the topic runs dry, which is how a
                # request for 120 words ran to 40k characters of invented words.
                max_tokens=min(32000, 16000 + n * 25),
                system=CONCEPTS_SYSTEM,
                user=prompt,
                output_format=ConceptList,
            )
            hit = [w.strip().lower() for w in parsed.words if w.strip()]
        except Exception as exc:  # truncated/invalid JSON, API error
            # An exhausted topic makes the model ramble until it is cut off mid-JSON.
            # Treat that as "no more words" rather than killing the whole run, but do
            # NOT cache it — a transient API error would otherwise be remembered
            # forever as "this topic has no more words".
            print(f"    (concept request failed, treating topic as exhausted: {type(exc).__name__})")
            return []
        _store("concepts", model, payload, hit)
    return hit


def theme_concepts(
    theme: str,
    n: int,
    model: str = DEFAULT_MODEL,
    exclude: set[str] | None = None,
    chunk: int = 120,
) -> list[str]:
    """Ask the model for up to `n` single English words for a theme.

    Requested in chunks rather than one giant call: a single request for many
    hundreds of words overruns the output limit and, worse, makes the model pad
    with vocabulary unrelated to the topic once it runs out of real ones. Stops
    early when a round returns nothing new — that means the topic is exhausted,
    and a short honest deck beats a padded one.
    """
    seen = {w.strip().lower() for w in (exclude or set())}
    out: list[str] = []
    for round_no in range(20):
        if len(out) >= n:
            break
        batch = _theme_chunk(theme, min(chunk, n - len(out)), sorted(seen), model, round_no)
        fresh = [w for w in batch if w and w not in seen]
        if not fresh:
            break
        for word in fresh:
            seen.add(word)
            out.append(word)
    return out[:n]


def align_batch(
    words: list[str], model: str = DEFAULT_MODEL, fix_note: str | None = None
) -> list[dict[str, str]]:
    """Align a batch of English concepts across the six languages.

    `fix_note` is used on the re-query pass to tell the model which words the
    correctness gate rejected, so it can correct them.
    """
    payload = json.dumps(sorted(words), ensure_ascii=False) + f"|{fix_note or ''}"
    hit = _cached("align", model, payload)
    if hit is None:
        listing = "\n".join(f"- {w}" for w in words)
        prompt = f"Align these English words:\n{listing}"
        if fix_note:
            prompt += (
                "\n\nA previous attempt produced words that failed a frequency check "
                f"(they are not common real words in that language):\n{fix_note}\n"
                "Correct those, using the most common real word in each language."
            )
        parsed = parse_streamed(
            model=model,
            max_tokens=32000,
            system=ALIGN_SYSTEM,
            user=prompt,
            output_format=Batch,
        )
        hit = [r.model_dump() for r in parsed.rows]
        _store("align", model, payload, hit)

    # Key by English so a row is matched to the concept we asked for, and rebuild
    # with our own English text — never the model's, so the anchor can't drift.
    by_en = {r.get("en", "").strip().lower(): r for r in hit}
    rows: list[dict[str, str]] = []
    for word in words:
        row = by_en.get(word.strip().lower())
        if not row:
            continue
        built = {"en": word.strip()}
        built.update({lang: str(row.get(lang, "")).strip() for lang in LANGS if lang != "en"})
        rows.append({lang: built.get(lang, "") for lang in LANGS})
    return rows
