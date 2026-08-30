#!/usr/bin/env python3
"""
Generates data/jurisdictions.json -- a lightweight {id, name, status} index
built automatically from the individual jurisdiction files in data/states/
and data/territories/. This is the single source the state picker (js/
main.js) and the feedback form's state dropdown (js/layout.js) both read,
so the list of jurisdictions and their names only ever live in one place
(the per-jurisdiction files themselves) -- nothing here is hand-maintained.

Re-run this any time a jurisdiction file is added, removed, or its status
changes:

    python3 generate_jurisdictions_index.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JURISDICTION_DIRS = [
    ("states", ROOT / "data" / "states"),
    ("territories", ROOT / "data" / "territories"),
]

def main():
    entries = []
    for kind, d in JURISDICTION_DIRS:
        if not d.exists():
            continue
        for path in sorted(d.glob("*.json")):
            data = json.loads(path.read_text())
            entries.append({
                "id": data["id"],
                "name": data["name"],
                "status": data["status"],
                "kind": kind,
            })

    # States/DC alphabetical by name (matches the existing dropdown order);
    # territories (once present) sort the same way, listed after.
    entries.sort(key=lambda e: (e["kind"] != "states", e["name"]))

    out = {"jurisdictions": entries}
    (ROOT / "data" / "jurisdictions.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote data/jurisdictions.json: {len(entries)} jurisdiction(s)")

if __name__ == "__main__":
    main()
