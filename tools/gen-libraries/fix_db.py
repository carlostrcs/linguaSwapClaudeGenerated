#!/usr/bin/env python3
"""Repair annotated entries in a seeded database.

Why this is needed at all: DbSeeder is APPEND-ONLY. Fixing a word in
Data/DefaultLibraries/*.json corrects the file and adds the corrected row to the
master, but it never touches the row that is already there. So a database seeded
before the fix keeps "change (money back)" AND gains "change" — the learner sees the
broken one and is forced to type "(money back)" to be graded correct.

This reconciles what is already in the database with the JSON:

  - every entry whose text carries an annotation — "(...)", "[...]" or a "/"
    alternative — is either deleted (when the corrected entry already exists in the
    same library) or rewritten in place (when it does not);
  - notes from the JSON are copied onto the matching entries.

It fixes the curated masters AND the user copies made from them, because a copy is a
snapshot: correcting the master alone leaves every already-added library broken.

    python fix_db.py                 # dry run, prints every change
    python fix_db.py --apply         # execute

Target the database with --container (local Docker) or DATABASE_URL.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys

from config import DEFAULT_LIBRARIES_DIR
from fix_annotations import FIXES, split_alternatives

ANNOTATION = re.compile(r"[(\[/]")

# Library display name -> deck slug, so a DB row can be matched against the
# handcrafted FIXES table (which is keyed by slug).
SLUG_BY_NAME: dict[str, str] = {}


def psql(container: str, sql: str, database: str = "linguaswap", dsn: str | None = None) -> str:
    """Run SQL and return raw stdout.

    The script is piped on stdin rather than passed with -c: a full repair is over a
    thousand statements, which overruns the Windows command-line length limit.

    With `dsn` the query runs against that connection string instead of the local
    database — still through the container's psql, so no local client is needed. This
    is how a hosted database (Supabase) gets repaired: its masters self-heal from the
    reconciling seeder on the next deploy, but user copies are snapshots and only this
    reaches them.
    """
    target = ["psql", dsn] if dsn else ["psql", "-U", "postgres", "-d", database]
    proc = subprocess.run(
        ["docker", "exec", "-i", container, *target,
         "-v", "ON_ERROR_STOP=1", "-t", "-A", "-F", "\t"],
        input=sql, capture_output=True, text=True, encoding="utf-8",
    )
    if proc.returncode != 0:
        sys.exit(f"psql failed:\n{proc.stderr}")
    return proc.stdout


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def corrected_text(lib_name: str, en: str) -> str:
    """The English text this annotated entry should have become, lower-cased.

    Guessing from the annotated string is not safe — splitting
    "boyfriend/girlfriend (partner)" on its punctuation yields "boyfriend", a
    different word, and deleting the row against that match would lose real content.
    The handcrafted FIXES table in fix_annotations is authoritative; the slash rule
    (which turns "guy / dude" into the comma form AnswerChecker accepts) covers the
    rest, and stripping a trailing parenthetical is the last resort.
    """
    slug = SLUG_BY_NAME.get(lib_name)
    if slug:
        fix = FIXES.get((slug, en))
        if fix:
            return fix[0].strip().lower()
    if "/" in en:
        return split_alternatives(en).strip().lower()
    return re.sub(r"\s*[(\[][^)\]]*[)\]]", "", en).strip().lower()


def load_json_decks() -> dict[str, dict[str, dict]]:
    """{library name: {english text: {'translations':…, 'notes':…}}} from the JSON."""
    decks: dict[str, dict[str, dict]] = {}
    for path in sorted(DEFAULT_LIBRARIES_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        SLUG_BY_NAME[data["name"]] = path.stem
        by_en: dict[str, dict] = {}
        for entry in data.get("entries", []):
            en = str(entry["translations"].get("en", "")).strip()
            if en:
                by_en[en.lower()] = {
                    "translations": entry["translations"],
                    "notes": (entry.get("notes") or "").strip(),
                }
        decks[data["name"]] = by_en
    return decks


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="execute (default: dry run)")
    ap.add_argument("--container", default="linguaswap-claude-db")
    ap.add_argument("--database", default="linguaswap")
    ap.add_argument("--dsn", default=os.environ.get("DATABASE_URL"),
                    help="postgres:// connection string for a hosted DB (or set DATABASE_URL). "
                         "Repairs user copies there; masters self-heal from the seeder on deploy.")
    args = ap.parse_args()

    decks = load_json_decks()

    # Every entry in a library whose name matches a curated deck — masters and the
    # user copies made from them.
    rows = psql(args.container, """
        SELECT e."Id", l."Id", l."Name", l."IsDefault",
               COALESCE(e."Notes",''),
               (SELECT t."Text" FROM "Translations" t
                 WHERE t."EntryId"=e."Id" AND t."LanguageCode"='en' LIMIT 1)
        FROM "Entries" e
        JOIN "Libraries" l ON l."Id"=e."LibraryId"
        ORDER BY l."Id", e."Id";
    """, args.database, args.dsn)

    # library id -> {english lower: entry id}
    per_library: dict[str, dict[str, str]] = {}
    entries: list[tuple[str, str, str, str, str, str]] = []
    for line in rows.strip().splitlines():
        parts = line.split("\t")
        if len(parts) < 6:
            continue
        entry_id, lib_id, lib_name, is_default, notes, en = parts[:6]
        entries.append((entry_id, lib_id, lib_name, is_default, notes, en))
        per_library.setdefault(lib_id, {})[en.strip().lower()] = entry_id

    statements: list[str] = []
    deleted = rewritten = noted = 0

    for entry_id, lib_id, lib_name, _is_default, notes, en in entries:
        deck = decks.get(lib_name)
        if deck is None:
            continue  # not a curated library

        if ANNOTATION.search(en):
            base = corrected_text(lib_name, en)
            replacement = deck.get(base)
            if replacement and per_library[lib_id].get(base):
                # The corrected entry is already in this library — drop the old one.
                statements.append(f'DELETE FROM "Entries" WHERE "Id"={entry_id};')
                print(f"  DELETE  [{lib_name}] {en!r}  (superseded by {base!r})")
                deleted += 1
            elif replacement:
                # No corrected counterpart here — rewrite this entry in place.
                for lang, text in replacement["translations"].items():
                    statements.append(
                        f'UPDATE "Translations" SET "Text"={sql_str(str(text))} '
                        f'WHERE "EntryId"={entry_id} AND "LanguageCode"={sql_str(lang)};'
                    )
                note = replacement["notes"]
                statements.append(
                    f'UPDATE "Entries" SET "Notes"={sql_str(note) if note else "NULL"} '
                    f'WHERE "Id"={entry_id};'
                )
                print(f"  REWRITE [{lib_name}] {en!r} -> {replacement['translations']['en']!r}")
                rewritten += 1
            else:
                print(f"  SKIP    [{lib_name}] {en!r} — no corrected version in JSON")
            continue

        # Sync notes on entries that are already correct — in BOTH directions. Only
        # setting them would strand a note the JSON has since dropped or rewritten,
        # which is how language-specific notes survived a rewrite in the user copies.
        wanted = deck.get(en.strip().lower())
        if wanted is None:
            continue
        target = wanted["notes"]
        if target != notes:
            statements.append(
                f'UPDATE "Entries" SET "Notes"={sql_str(target) if target else "NULL"} '
                f'WHERE "Id"={entry_id};'
            )
            noted += 1

    print(f"\ndelete {deleted} | rewrite {rewritten} | notes {noted} "
          f"| {len(statements)} statements")

    if not statements:
        print("nothing to do")
        return
    if not args.apply:
        print("dry run — nothing executed (pass --apply)")
        return

    # One transaction: a partial repair is worse than none.
    psql(args.container, "BEGIN;\n" + "\n".join(statements) + "\nCOMMIT;", args.database)
    print("APPLIED")


if __name__ == "__main__":
    main()
