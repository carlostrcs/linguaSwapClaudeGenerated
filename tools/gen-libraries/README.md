# Library generator

Generates the curated **featured library** content in
`backend/LinguaSwap.Api/Data/DefaultLibraries/*.json` — concept-aligned rows across the six
languages the app ships (`en, es, fr, de, it, pt`).

Dev-only. Not part of the app build or deploy (same status as `sample-imports/`). It writes
content; `DbSeeder` is what ships it.

## Why this exists

A featured library row is **one concept aligned across all six languages**, so per-language word
lists don't line up row-by-row — the alignment is the expensive part, not the dedup. Hand-building
that (generate a list, dedup in Excel) doesn't scale. This tool makes producing or growing a deck
one command.

## Install

```
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...        # PowerShell: $env:ANTHROPIC_API_KEY = 'sk-ant-...'
```

The key is read from the environment and never committed — same discipline as the app's Stripe and
email secrets.

## Use

```
python gen.py --list                       # show configured decks
python gen.py --deck food                  # build/grow one deck
python gen.py --all                        # every deck in decks.yaml
python gen.py --deck food --size 300       # override the target size
python gen.py --deck food --model claude-haiku-4-5   # cheaper run
python gen.py --demo food --size 8         # print a DEMO_FEATURED snippet to paste
```

Decks are configured in `decks.yaml`. **`size` is the growth lever**: a run adds
`size - (existing rows)` new words, so re-running an unchanged deck is a no-op. Raise `size` and
re-run to grow. Existing rows are never rewritten or reordered — growth is append-only, which keeps
the git diff readable and matches how `DbSeeder` tops up masters.

> **`size` is a ceiling, not a promise.** A themed topic contains a finite number of genuinely
> useful single words — travel runs out around ~237, and asking for 500 makes the model pad rather
> than refuse (it eventually invents non-words like `capellonidae`). The relevance gate rejects that
> padding, so a themed deck lands at its natural size and the run reports
> `relevance: N/M candidates on-topic`. A low ratio means the topic is exhausted, not that something
> is broken; `no new concepts available` means fully exhausted. **Frequency decks have no such
> ceiling** — `wordfreq` has plenty of real words.

> **Uneven deck sizes are handled in the UI, not by trimming.** Decks land on whatever their topic
> supports (237, 291, 975…). Rather than delete good rows to reach round numbers, the featured shelf
> rounds the *displayed* count down — `frontend/src/lib/wordCount.ts`, so 169 renders as "160+
> words". Never trim curated content just to make a number look tidy.

## Cleaning existing decks

```
python fix_annotations.py            # dry run; --apply to write
python naturalness.py                # modernise stiff/dated words; --apply to write
python audit.py --notes              # add clarifying notes; --apply to write
python audit.py --sentences          # find/remove full sentences
python audit.py --verify             # semantic review (REPORT ONLY — see below)
```

**`fix_annotations.py`** moves disambiguation out of the answer text. The practice card grades the
whole string, so `sweet (person)` forced the learner to type `(person)`, and `guy / dude` forced the
slash. Parentheticals move to `notes`; slash alternatives become the comma form
(`guy, dude`) that `AnswerChecker` already accepts as alternatives.

**`naturalness.py`** answers "is this what a native actually says today?" — the one question
`audit.py --verify` could not safely act on. It is the **only** pass allowed to rewrite a
translation automatically, because it is the only one whose output is checked against something
other than a model's opinion. Three reviewers with deliberately *different* lenses (register,
corpus frequency, currency) each judge every word in an independent, separately-cached call, and a
replacement is written only if it clears all three gates:

1. **Majority** — ≥2 of 3 reviewers flag the current word.
2. **Consensus** — ≥2 of them independently propose the *same* replacement.
3. **Frequency** — `wordfreq` confirms the replacement is genuinely *more common* than the word it
   replaces, in that language.

Gate 3 is what makes auto-apply defensible. "More natural" is an opinion, and opinions are exactly
what produced `zurücktreten`; "more common in real usage" is a measurement, so three reviewers that
talk each other into a rarer word still cannot get it past a corpus. Everything that fails any gate
is left untouched and written to `review/<slug>.naturalness.json`. Typical yield is ~30% of what the
reviewers propose — on `travel`, 31 flagged → 9 applied (`denaro`→`soldi`, `Flugsteig`→`Gate`,
Italian `imbarcare`→`imbarcarsi`).

> **The frequency gate is deliberately biased toward doing nothing, and it has a known blind spot:**
> `wordfreq`'s Portuguese corpus is Brazilian-heavy, so correct *European* Portuguese and
> post-1990-orthography fixes (`bilíngue`→`bilingue`, `pára-choque`→`para-choques`) score as "rarer"
> and are rejected into the review file. That is the intended failure direction — a missed
> improvement costs nothing, a wrong word costs a learner a correct answer.

**`audit.py --notes`** adds a clarifying note only where a translation could genuinely mislead —
false friends (`discuss` → Spanish `discutir`, which suggests arguing), multi-sense words, register
mismatches. It is deliberately conservative (~10% of rows); a note on every card is noise. It never
overwrites an existing note.

### Model and cost

Defaults to `claude-opus-5`. Vocabulary alignment is an easy task, so `--model claude-haiku-4-5`
or `claude-sonnet-5` cuts cost substantially with little quality risk — the correctness gate below
catches bad words regardless of model. Responses are cached in `.cache/`, so re-runs and retries
don't re-pay for words already aligned.

> Two things follow from the model default that are easy to break. **Adaptive thinking is ON by
> default on Opus 5** (unlike 4.8, where omitting `thinking` meant none) and thinking counts against
> `max_tokens`, so every budget here is sized with headroom — lowering one back to a value that was
> fine on 4.8 truncates the response mid-JSON. And because those budgets are large, the SDK **refuses
> non-streaming requests** outright (`ValueError: Streaming is required…`), which is why every
> structured call goes through `align.parse_streamed` rather than `messages.parse`.

**`effort` is the cost dial here, not the model.** Every prompt in this tool has a small input and a
short structured answer, so the bill is dominated by *thinking* tokens — which are billed at output
rates. Running a filter task at the default `high` effort spends roughly an order of magnitude more
on deliberation than on the reply. Hence `config.DEFAULT_EFFORT` = `medium` for passes that CREATE
content (alignment), and `naturalness.EFFORT` = `low` for the scan-and-filter passes, whose weak
judgments are already backstopped by three-way consensus and the `wordfreq` gate. Override per run
with `--effort`; `GENLIB_EFFORT` sets the global default. Reach for `--model claude-sonnet-5` or
`claude-haiku-4-5` only after effort, since it trades quality for a smaller saving.

Effort is part of the **cache key**, so a cheap run is never served results a pricier one paid for —
otherwise any comparison between settings would be meaningless. Changing effort therefore re-pays
for that deck.

Every runner prints what it actually spent (`Spend: N API calls … ~$X`). A `$0.00` line means no
*billable* call completed — which covers both a fully cached run and one where every call errored,
so read it together with any `!` failure lines rather than as proof of a cache hit.

Measured on `claude-opus-5` (2026-07-27), so you can price a run before starting it:

| Work | Rate |
|---|---|
| `gen.py` growth | **~$0.53 per 100 new words** |
| `naturalness.py` at `effort=low` | **~$0.35 per 200 rows** (~$0.0018/row) |
| `naturalness.py` at `effort=high` | ~$0.008/row — **4-5x dearer for no measurable gain here** |

Canary a single deck first (`--decks verbs`); its `Spend:` line prices the full sweep.

> **Growth is append-only, which keeps the cache useful.** New rows go on the end, so the earlier
> `naturalness.py` batches (`rows[0:50]`, `rows[50:100]`, …) keep their boundaries and stay cached —
> growing a deck then re-reviewing it only pays for the *new* batches. Changing `--effort` does not
> have that property: it re-keys every batch and re-pays for the whole deck.

`naturalness.py` fans its calls out over a thread pool (`WORKERS`), since a full sweep is ~285
independent requests — about 15 minutes in parallel versus several hours sequentially.

## Pipeline

1. **Source concepts** (`concepts.py`)
   - `frequency` decks: top-N English content words from `wordfreq`, ranked by real usage.
     Function words are dropped (English *the* is el/la/los/las, der/die/das… — no clean 1:1 card),
     and inflections are reduced to their base form (`things`→`thing`, `called`→`call`,
     `women`→`woman`) so you get concepts, not near-duplicate cards.
   - `themed` decks: the model proposes single English words for the topic in **chunks** (one giant
     request overruns the output limit), then anything absent from real English usage data is
     dropped, then a **topical relevance gate** (`verify.filter_relevant`) removes padding.
     That gate matters: once a topic is exhausted the model pads with alphabetically adjacent
     dictionary words (`density`, `dummy`, `bigot` proposed as *travel* vocabulary) whose
     translations are perfectly correct, so neither the frequency gate nor the sense-verifier can
     catch them. It runs **before** alignment, so padding never costs translation tokens.
2. **Align** (`align.py`) — batches of 40 concepts per Claude call using **structured outputs**, so
   the response is always well-formed. The English anchor is rebuilt from our own list, never the
   model's echo, so the concept can't drift.
3. **Validate** (`validate.py`) — the automated gate that replaces human review:
   - *structural*: all six languages present; the English concept is a single word. Translations
     may be multi-word where the language has no single word (`pomme de terre`) — that's allowed.
   - *correctness*: every target word must exist in `wordfreq` for its language and clear the
     deck's `zipf_floor`. A hallucinated or misspelled word scores **0.0** while a real one scores
     ~5, so bad words are caught mechanically.
   - Flagged rows are **re-queried once** with the specific failures quoted back to the model; any
     still failing are dropped and logged to `rejects/<slug>.rejects.json`.
3b. **Semantic review** (`verify.py`, opt-in via `--verify`) — a second, independent model call
   judges whether all six words really denote the same concept, catching sense drift the frequency
   gate cannot see. It is used **only to reject rows, never to rewrite them**: a dropped candidate
   just means a different word gets used, whereas applying the reviewer's suggested corrections
   introduces confident, well-formed, *wrong* words (it "corrected" German `kündigen`→`zurücktreten`
   for *resign*, and European Portuguese `constipação`→`resfriado` for *cold*). For the same reason
   `audit.py --verify` is a **review shortlist, not an auto-fixer**.
4. **Dedup** (`dedup.py`) — mirrors the backend's `EntryImport.Signature`
   (`backend/LinguaSwap.Api/Services/EntryImport.cs`): order-, case- and whitespace-insensitive.
   The seeder re-dedups on load, so this just keeps the emitted files clean.
5. **Emit** (`emit.py`) — writes the app's exact JSON format and one-entry-per-line layout.

## Shipping the output

No wiring needed. `LinguaSwap.Api.csproj` globs `Data\DefaultLibraries\*.json` to the output
directory, and `DbSeeder.SeedDefaultLibrariesAsync` reads every file on each startup — creating the
master if missing, or appending only new rows.

> **`name` in `decks.yaml` must match the shipped library name exactly.** The seeder matches masters
> **by name**; changing it creates a second master instead of topping up the existing one. Existing
> user copies are snapshots and never change, by design.

## Demo taster

`frontend/src/lib/demo/demoData.ts` (`DEMO_FEATURED`) is intentionally a small taster, not the full
content. `python gen.py --demo <slug> --size 8` prints a ready-to-paste entry sliced from a built
deck.

## Notes

- `rejects/` and `.cache/` are gitignored — diagnostics and regenerable data.
- The generator only emits **single-word English concepts**. Existing multi-word rows in the shipped
  decks (`main course`, `thank you`) are preserved untouched; growth just won't add more of them.
