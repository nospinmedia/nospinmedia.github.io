#!/usr/bin/env python3
"""
Validates every jurisdiction JSON file (data/states/*.json, plus
data/territories/*.json once populated) against the canonical Voting
Center schema. Exits non-zero -- intended to fail a deploy/build -- if
any file is malformed or missing a required section/field.

The schema below is hardcoded, not derived from any one jurisdiction
file, so validation doesn't depend on any single file (e.g. NH) staying
correct. This is the same schema established for New Hampshire, the
reference implementation, and every jurisdiction migrated since.

Run before every deploy:

    python3 validate_jurisdictions.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JURISDICTION_DIRS = [ROOT / "data" / "states", ROOT / "data" / "territories"]

TOP_LEVEL_KEYS = {
    "id", "name", "status", "last_verified",
    "next_state_election", "glance_notes", "sections",
}

SECTION_ORDER = [
    "register", "check_registration", "deadlines", "polling_place",
    "election_day", "polling_hours", "early_voting", "absentee_mail",
    "voter_id", "accessible_voting", "military_overseas", "student_voting",
    "sample_ballot", "contact", "official_resources",
]

SECTION_FIELD_KEYS = {
    "label", "status", "content", "glance_value", "source_url",
    "source_name", "last_verified", "flagged_reason", "flagged_at",
    "internal_note", "reverify_after_days",
}

NEXT_STATE_ELECTION_KEYS = {
    "name", "date", "display_date", "status",
    "source_url", "source_name", "last_verified",
}

GLANCE_NOTE_KEYS = {"text", "status", "source_url", "source_name", "last_verified"}

VALID_STATUSES = {"verified", "in_review", "needs_review", "placeholder"}


def validate_file(path):
    errors = []
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return [f"invalid JSON: {e}"]

    if not isinstance(data, dict):
        return ["top-level value is not a JSON object"]

    expected_id = path.stem
    if data.get("id") != expected_id:
        errors.append(f"id {data.get('id')!r} does not match filename {expected_id}.json")

    keys = set(data.keys())
    if keys != TOP_LEVEL_KEYS:
        errors.append(f"top-level keys differ from schema: extra={keys - TOP_LEVEL_KEYS} missing={TOP_LEVEL_KEYS - keys}")

    if data.get("status") not in VALID_STATUSES:
        errors.append(f"invalid top-level status: {data.get('status')!r}")

    ne = data.get("next_state_election")
    if ne is not None:
        if not isinstance(ne, dict):
            errors.append("next_state_election is present but not an object")
        else:
            ne_keys = set(ne.keys())
            if ne_keys != NEXT_STATE_ELECTION_KEYS:
                errors.append(f"next_state_election keys differ: extra={ne_keys - NEXT_STATE_ELECTION_KEYS} missing={NEXT_STATE_ELECTION_KEYS - ne_keys}")

    gn = data.get("glance_notes")
    if not isinstance(gn, list):
        errors.append("glance_notes is missing or not a list")
    else:
        for i, note in enumerate(gn):
            if not isinstance(note, dict):
                errors.append(f"glance_notes[{i}] is not an object")
                continue
            note_keys = set(note.keys())
            if note_keys != GLANCE_NOTE_KEYS:
                errors.append(f"glance_notes[{i}] keys differ: extra={note_keys - GLANCE_NOTE_KEYS} missing={GLANCE_NOTE_KEYS - note_keys}")

    sections = data.get("sections")
    if not isinstance(sections, dict):
        errors.append("sections is missing or not an object")
    else:
        if list(sections.keys()) != SECTION_ORDER:
            errors.append(f"section keys/order differ from schema: got {list(sections.keys())}")
        for key in SECTION_ORDER:
            sec = sections.get(key)
            if sec is None:
                errors.append(f"section '{key}' is missing")
                continue
            if not isinstance(sec, dict):
                errors.append(f"section '{key}' is not an object")
                continue
            sec_keys = set(sec.keys())
            if sec_keys != SECTION_FIELD_KEYS:
                errors.append(f"section '{key}' fields differ: extra={sec_keys - SECTION_FIELD_KEYS} missing={SECTION_FIELD_KEYS - sec_keys}")
            if sec.get("status") not in VALID_STATUSES:
                errors.append(f"section '{key}' has invalid status: {sec.get('status')!r}")
            content = sec.get("content")
            status = sec.get("status")
            if status != "placeholder" and not (isinstance(content, str) and content.strip()):
                errors.append(f"section '{key}' has status '{status}' but empty/missing content")
            if content is not None and not isinstance(content, str):
                errors.append(f"section '{key}' content is not a string or null")
            source_url = sec.get("source_url")
            if source_url is not None:
                if not isinstance(source_url, str) or "](" in source_url or source_url.startswith("["):
                    errors.append(f"section '{key}' source_url looks malformed (Markdown-link residue or non-string): {source_url!r}")

    return errors


def main():
    total_files = 0
    total_errors = 0
    for d in JURISDICTION_DIRS:
        if not d.exists():
            continue
        for path in sorted(d.glob("*.json")):
            total_files += 1
            errors = validate_file(path)
            if errors:
                total_errors += len(errors)
                print(f"FAIL  {path.relative_to(ROOT)}")
                for e in errors:
                    print(f"        - {e}")

    if total_errors:
        print(f"\n{total_errors} error(s) across {total_files} jurisdiction file(s). BUILD FAILED.")
        sys.exit(1)

    print(f"All {total_files} jurisdiction file(s) passed validation.")
    sys.exit(0)


if __name__ == "__main__":
    main()
