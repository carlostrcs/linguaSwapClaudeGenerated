#!/usr/bin/env python3
"""Backfill the localized-content columns onto a seeded database from the JSON.

The curated masters get `NameI18nJson` / `DescriptionI18nJson` (and each entry's
`NotesI18nJson`) from `DbSeeder` on every deploy — it reconciles them. But **user copies
of a featured library are snapshots**: a copy made before these columns were populated (or
before `translate_notes.py` ran) keeps English titles/notes forever, exactly like the
annotation problem `fix_db.py` exists for. This reaches those copies.

  python fix_db_i18n.py                 # dry run, prints every change
  python fix_db_i18n.py --apply         # execute

Target the database with --container (local Docker) or --dsn / DATABASE_URL (hosted). It
touches masters too (harmless — it writes the same value the seeder would), so it is safe
to run against any environment. Idempotent: it compares maps by VALUE, not by exact JSON
text, so a second run is a no-op even though C# and Python serialize a map differently.

Run it after `set_headers.py` (titles — available now) and again after `translate_notes.py`
(notes). Reads the same `Data/DefaultLibraries/*.json` as the seeder.
"""
from __future__ import annotations

import argparse
import json
import os

from config import DEFAULT_LIBRARIES_DIR
from fix_db import psql, sql_str


def normalize(mapping: dict | None) -> dict[str, str]:
    """Lower-cased, trimmed, non-empty entries — mirrors Services/Localized.Serialize's shape so a
    value the seeder wrote and a value we write compare EQUAL as dicts."""
    out: dict[str, str] = {}
    if isinstance(mapping, dict):
        for key, value in mapping.items():
            k = str(key).strip().lower()
            v = str(value).strip() if value is not None else ""
            if k and v:
                out[k] = v
    return out


def to_json(mapping: dict[str, str]) -> str | None:
    """Canonical JSON for a normalized map (sorted keys), or None when empty — matches the column's
    'null when empty' convention. Escaping/spacing need not match C#; we only ever compare by value."""
    return json.dumps(mapping, ensure_ascii=False, sort_keys=True, separators=(",", ":")) if mapping else None


def parse(text: str) -> dict[str, str]:
    """A stored column value (or '') back to a normalized dict for value comparison."""
    if not text:
        return {}
    try:
        return normalize(json.loads(text))
    except ValueError:
        return {}


def load_json_decks() -> dict[str, dict]:
    """{library name: {'name': {..}, 'desc': {..}, 'notes': {en_lower: {..}}}} from the JSON."""
    decks: dict[str, dict] = {}
    for path in sorted(DEFAULT_LIBRARIES_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        notes: dict[str, dict] = {}
        for entry in data.get("entries", []):
            en = str(entry["translations"].get("en", "")).strip().lower()
            if en:
                notes[en] = normalize(entry.get("notesI18n"))
        decks[data["name"]] = {
            "name": normalize(data.get("nameI18n")),
            "desc": normalize(data.get("descriptionI18n")),
            "notes": notes,
        }
    return decks


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="execute (default: dry run)")
    ap.add_argument("--container", default="linguaswap-claude-db")
    ap.add_argument("--database", default="linguaswap")
    ap.add_argument("--dsn", default=os.environ.get("DATABASE_URL"),
                    help="postgres:// connection string for a hosted DB (or set DATABASE_URL).")
    args = ap.parse_args()

    decks = load_json_decks()
    statements: list[str] = []
    lib_updates = note_updates = 0

    # --- library titles/descriptions -------------------------------------------------------------
    lib_rows = psql(args.container, """
        SELECT l."Id", l."Name", COALESCE(l."NameI18nJson",''), COALESCE(l."DescriptionI18nJson",'')
        FROM "Libraries" l ORDER BY l."Id";
    """, args.database, args.dsn)
    for line in lib_rows.strip().splitlines():
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        lib_id, name, name_json, desc_json = parts[:4]
        deck = decks.get(name)
        if deck is None:
            continue  # not a curated library
        sets = []
        if parse(name_json) != deck["name"]:
            sets.append(f'"NameI18nJson"={_val(to_json(deck["name"]))}')
        if parse(desc_json) != deck["desc"]:
            sets.append(f'"DescriptionI18nJson"={_val(to_json(deck["desc"]))}')
        if sets:
            statements.append(f'UPDATE "Libraries" SET {", ".join(sets)} WHERE "Id"={lib_id};')
            print(f"  LIB   [{name}] set {', '.join(s.split('=')[0] for s in sets)}")
            lib_updates += 1

    # --- entry notes -----------------------------------------------------------------------------
    entry_rows = psql(args.container, """
        SELECT e."Id", l."Name", COALESCE(e."NotesI18nJson",''),
               (SELECT t."Text" FROM "Translations" t
                 WHERE t."EntryId"=e."Id" AND t."LanguageCode"='en' LIMIT 1)
        FROM "Entries" e JOIN "Libraries" l ON l."Id"=e."LibraryId" ORDER BY e."Id";
    """, args.database, args.dsn)
    for line in entry_rows.strip().splitlines():
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        entry_id, name, notes_json, en = parts[:4]
        deck = decks.get(name)
        if deck is None or not en:
            continue
        wanted = deck["notes"].get(en.strip().lower())
        if wanted is None:
            continue  # entry not in the JSON (user-added, or annotation-fixed) — leave it
        if parse(notes_json) != wanted:
            statements.append(
                f'UPDATE "Entries" SET "NotesI18nJson"={_val(to_json(wanted))} WHERE "Id"={entry_id};')
            note_updates += 1

    print(f"\nlibraries {lib_updates} | entry notes {note_updates} | {len(statements)} statements")
    if not statements:
        print("nothing to do")
        return
    if not args.apply:
        print("dry run — nothing executed (pass --apply)")
        return

    psql(args.container, "BEGIN;\n" + "\n".join(statements) + "\nCOMMIT;", args.database, args.dsn)
    print("APPLIED")


def _val(json_text: str | None) -> str:
    """A JSON string literal for SQL, or NULL for an empty map (matches the column convention)."""
    return sql_str(json_text) if json_text else "NULL"


if __name__ == "__main__":
    main()
