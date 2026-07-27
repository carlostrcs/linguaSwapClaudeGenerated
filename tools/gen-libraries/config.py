"""Shared constants for the library generator.

This tool is dev-only: it produces the curated JSON that DbSeeder loads at startup.
It is not part of the app build or deploy (like `sample-imports/`).
"""
from __future__ import annotations

import os
from pathlib import Path

# The six concept-aligned languages. English is both the concept anchor and a
# target; the model fills in TARGET_LANGS for each English concept. Matches the
# languages used by the existing Data/DefaultLibraries/*.json files.
LANGS: list[str] = ["en", "es", "fr", "de", "it", "pt"]
TARGET_LANGS: list[str] = ["es", "fr", "de", "it", "pt"]

# Mandated default per the claude-api skill (never downgrade for cost silently —
# that is the user's call). Override with --model / GENLIB_MODEL for cheaper runs;
# the wordfreq correctness gate backs quality regardless of model.
#
# NOTE: on Opus 5 adaptive thinking is ON by default and thinking tokens count
# against `max_tokens`, unlike Opus 4.8 where omitting `thinking` meant none. Every
# call site here is sized with that headroom — do not lower them back to the values
# that were adequate on 4.8, or responses will truncate mid-JSON.
DEFAULT_MODEL: str = os.environ.get("GENLIB_MODEL", "claude-opus-5")

# Thinking tokens bill at OUTPUT rates, so on these prompts — small inputs, a short
# JSON answer — `effort` is the dominant cost lever, not the model choice. The default
# `high` spent roughly an order of magnitude more on deliberation than on the reply.
# `medium` is the balanced setting for work that CREATES content (alignment); the
# scan-and-filter passes drop to `low` explicitly at their call sites.
DEFAULT_EFFORT: str = os.environ.get("GENLIB_EFFORT", "medium")

# Per-MTok (input, output) list prices, for the spend report the runners print.
# Purely informational — a wrong entry misreports cost, it cannot change behaviour.
PRICING: dict[str, tuple[float, float]] = {
    "claude-opus-5": (5.0, 25.0),
    "claude-opus-4-8": (5.0, 25.0),
    "claude-sonnet-5": (3.0, 15.0),
    "claude-haiku-4-5": (1.0, 5.0),
}


def estimate_cost(model: str, usage: dict) -> float:
    """Rough USD for a run. Unknown models price as 0 rather than guessing."""
    rate_in, rate_out = PRICING.get(model, (0.0, 0.0))
    return usage.get("input", 0) / 1e6 * rate_in + usage.get("output", 0) / 1e6 * rate_out

# How many concepts to align per Claude call.
BATCH_SIZE: int = 40

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent.parent
DEFAULT_LIBRARIES_DIR = REPO_ROOT / "backend" / "LinguaSwap.Api" / "Data" / "DefaultLibraries"
CACHE_DIR = HERE / ".cache"
ENV_FILE = HERE / ".env"


def load_env_file() -> None:
    """Load KEY=VALUE lines from a gitignored .env into the environment.

    Lets the API key live in a local file instead of being pasted into a shell or
    a chat transcript. Existing environment variables always win, so an exported
    ANTHROPIC_API_KEY overrides the file.
    """
    if not ENV_FILE.exists():
        return
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value
