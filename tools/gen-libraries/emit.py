"""Writing (and re-reading) the app's DefaultLibraries JSON format.

Format matches Data/DefaultLibraries/*.json exactly, including the one-entry-per-line
layout, so regenerating a deck produces a readable diff instead of reflowing the file.
"""
from __future__ import annotations

import json
from pathlib import Path

from config import LANGS

# Reserved row key carrying an entry's clarifying note. Kept out of `translations`
# (which is LANGS-only) so a note can never leak into text the learner must type.
NOTES_KEY = "_notes"


def _translations_literal(row: dict[str, str]) -> str:
    inner = ", ".join(
        f'"{lang}": {json.dumps(row[lang], ensure_ascii=False)}'
        for lang in LANGS
        if row.get(lang)
    )
    return "{ " + inner + " }"


def render(name: str, description: str, rows: list[dict[str, str]]) -> str:
    """Serialize a deck in the exact style of the existing curated files.

    A row's optional clarifying note travels under the reserved `NOTES_KEY` and is
    emitted as the entry's `notes` field, which the practice card shows at every
    difficulty.
    """
    lines = [
        "{",
        f"  {json.dumps('name')}: {json.dumps(name, ensure_ascii=False)},",
        f"  {json.dumps('description')}: {json.dumps(description, ensure_ascii=False)},",
        '  "entries": [',
    ]
    for i, row in enumerate(rows):
        comma = "," if i < len(rows) - 1 else ""
        body = f'"translations": {_translations_literal(row)}'
        note = str(row.get(NOTES_KEY, "")).strip()
        if note:
            body += f", \"notes\": {json.dumps(note, ensure_ascii=False)}"
        lines.append(f"    {{ {body} }}{comma}")
    lines.append("  ]")
    lines.append("}")
    return "\n".join(lines) + "\n"


def read_existing(path: Path) -> tuple[str | None, str | None, list[dict[str, str]]]:
    """Read an existing deck file, returning (name, description, rows).

    Used so a re-run tops up a deck (appending only genuinely new rows) instead of
    overwriting curated content that is already shipping.
    """
    if not path.exists():
        return None, None, []
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = []
    for entry in data.get("entries", []):
        translations = entry.get("translations", {})
        if not translations:
            continue
        row = {k: str(v) for k, v in translations.items()}
        # Round-trip the note, or a re-run of the generator would silently drop
        # every clarifying note already written into the deck.
        note = str(entry.get("notes") or "").strip()
        if note:
            row[NOTES_KEY] = note
        rows.append(row)
    return data.get("name"), data.get("description"), rows


def write_deck(path: Path, name: str, description: str, rows: list[dict[str, str]],
               *, expect_rows: int | None = None) -> bool:
    """Write a deck. Returns True if written, False if refused as stale.

    Every cleaning pass here is a read-modify-write over a whole file, so two of them
    running at once silently lose data: the second reads before the first writes, then
    writes its stale copy over the top. That is not hypothetical — on 2026-07-27 an
    `audit.py --notes --apply` read `common-1000` at 975 rows, a `gen.py` run grew the
    file to 1000, and the notes pass then wrote its 975 back, destroying 25 words with
    no error from either tool.

    `expect_rows` is the row count the caller read at the start. Passes that only EDIT
    rows in place should pass it; write_deck re-reads the file and refuses if the count
    no longer matches. Passes that legitimately change the count (gen.py growth) leave
    it None.
    """
    if expect_rows is not None and path.exists():
        _, _, current = read_existing(path)
        if len(current) != expect_rows:
            return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render(name, description, rows), encoding="utf-8")
    return True


def write_rejects(path: Path, rejects: list[dict]) -> None:
    """Write the rejected-rows report (optional glance; never a required step)."""
    if not rejects:
        if path.exists():
            path.unlink()
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rejects, ensure_ascii=False, indent=2), encoding="utf-8")
