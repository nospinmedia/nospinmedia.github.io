#!/usr/bin/env python3
"""
Regenerates sitemap.xml for the No Spin Media Voting Center.

Includes every static page unconditionally, plus one state-guide URL per
state -- but ONLY for states whose status is "verified". Placeholder and
in_review states are deliberately left out of the sitemap (they also
carry a noindex robots tag via js/states.js, so this is belt-and-suspenders,
not the only thing keeping them out of search).

Re-run this any time a state's status in data/states.json changes:

    python3 generate_sitemap.py
"""

import json
from pathlib import Path

BASE_URL = "https://nospin.media/voting"
ROOT = Path(__file__).resolve().parent

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
    states_data = json.loads((ROOT / "data" / "states.json").read_text())
    verified_ids = [s["id"] for s in states_data["states"] if s.get("status") == "verified"]

    urls = [f"{BASE_URL}/{page}" for page in STATIC_PAGES]
    urls += [f"{BASE_URL}/states/index.html?state={sid}" for sid in verified_ids]

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        lines.append(f"  <url><loc>{url}</loc></url>")
    lines.append("</urlset>")

    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n")
    print(f"Wrote sitemap.xml: {len(STATIC_PAGES)} static pages + {len(verified_ids)} verified state(s) {verified_ids}")

if __name__ == "__main__":
    main()
