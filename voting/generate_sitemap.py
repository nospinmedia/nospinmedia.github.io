#!/usr/bin/env python3
"""
Regenerates sitemap.xml for the No Spin Media Voting Center.

Includes every static page unconditionally, plus one state-guide URL per
jurisdiction -- but ONLY for jurisdictions whose status is "verified".
Placeholder, in_review, and needs_review jurisdictions are deliberately
left out of the sitemap (they also carry a noindex robots tag via
js/states.js, so this is belt-and-suspenders, not the only thing keeping
them out of search).

Reads directly from the individual jurisdiction files in data/states/ and
data/territories/ -- not a separate index -- so this can never drift out
of sync with what's actually published for each jurisdiction.

Re-run this any time a jurisdiction file is added, removed, or its status
changes:

    python3 generate_sitemap.py
"""

import json
from pathlib import Path

BASE_URL = "https://nospin.media/voting"
ROOT = Path(__file__).resolve().parent
JURISDICTION_DIRS = [ROOT / "data" / "states", ROOT / "data" / "territories"]

STATIC_PAGES = [
    "index.html",
    "get-ready-to-vote.html",
    "ways-to-vote.html",
    "polling-place.html",
    "voter-id.html",
    "ballot.html",
    "problems.html",
    "faq.html",
    "elections.html",
    "news.html",
    "about.html",
    "states/index.html",
]

def main():
    verified_ids = []
    for d in JURISDICTION_DIRS:
        if not d.exists():
            continue
        for path in sorted(d.glob("*.json")):
            data = json.loads(path.read_text())
            if data.get("status") == "verified":
                verified_ids.append(data["id"])

    urls = [f"{BASE_URL}/{page}" for page in STATIC_PAGES]
    urls += [f"{BASE_URL}/states/index.html?state={sid}" for sid in verified_ids]

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        lines.append(f"  <url><loc>{url}</loc></url>")
    lines.append("</urlset>")

    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n")
    print(f"Wrote sitemap.xml: {len(STATIC_PAGES)} static pages + {len(verified_ids)} verified jurisdiction(s) {verified_ids}")

if __name__ == "__main__":
    main()
