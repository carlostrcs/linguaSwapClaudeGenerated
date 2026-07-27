"""Deduplication that mirrors the backend's EntryImport.Signature.

Keep this in sync with backend/LinguaSwap.Api/Services/EntryImport.cs — the seeder
re-dedups on load, so a divergence here only produces noisier files, never wrong
data, but matching it keeps the emitted files clean and re-runs idempotent.
"""
from __future__ import annotations

from typing import Iterable


def signature(translations: dict[str, str]) -> str:
    """Order-, case- and whitespace-insensitive key for a row's translations.

    Mirrors EntryImport.Signature: join of `lang=text` pairs, each side trimmed
    and lower-cased, sorted by ordinal (Python's default sort is by code point,
    which matches StringComparer.Ordinal for these Latin-script strings).
    """
    parts = [
        f"{lang.strip().lower()}={text.strip().lower()}"
        for lang, text in translations.items()
        # Reserved keys (e.g. the note) are not translations and must not affect
        # identity — the backend signature is computed over translations only.
        if lang.strip() and text.strip() and not lang.startswith("_")
    ]
    return "|".join(sorted(parts))


def deduplicate(
    rows: list[dict[str, str]], existing_signatures: Iterable[str]
) -> tuple[list[dict[str, str]], int]:
    """Drop rows duplicating an existing signature or an earlier row in the batch."""
    seen = set(existing_signatures)
    kept: list[dict[str, str]] = []
    skipped = 0
    for row in rows:
        sig = signature(row)
        if sig in seen:
            skipped += 1
            continue
        seen.add(sig)
        kept.append(row)
    return kept, skipped
