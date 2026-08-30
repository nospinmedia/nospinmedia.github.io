# No Spin Media Voting Center

A standalone, nonpartisan static site for voter information and education — registration, ways to vote, polling places, ID requirements, and state-by-state guides. Visually designed to feel like a section of [nospin.media](https://nospin.media), but built and deployed as its own repository/site.

**Status: Phase 1 — architecture, design, and templates.** No real per-state voting rules have been populated yet; every state's content is explicit placeholder data (see `data/states.json`). This site is not yet linked from the main NSM site or Knowledge Base.

## What this is

Strictly nonpartisan voter information and education. It explains how voting works and points to official government resources. It never recommends candidates, parties, positions, or how someone should vote, and it does not collect voter registration information, addresses, birth dates, party affiliation, or ID details.

## Structure

- `index.html` — homepage (hero, 8 action cards, state selector, upcoming election preview, FAQ preview, news placeholder, trust banner)
- `get-ready-to-vote.html` — eligibility, registration, checking registration, moving, first-time voters, deadlines
- `ways-to-vote.html` — Election Day, early voting, absentee/mail, accessible voting, military/overseas
- `polling-place.html`, `voter-id.html`, `ballot.html`, `problems.html` — dedicated pages for the remaining top-level actions
- `faq.html` — searchable/filterable FAQ, driven by `data/faq.json`
- `elections.html` — upcoming elections, driven by `data/elections.json`
- `news.html` — reserved placeholder for a future NSM news feed integration
- `about.html` — nonpartisan commitment, verification process, corrections
- `states/index.html` — **one reusable template** for all 50 states + D.C., rendered client-side from `data/states.json` via `?state=XX` in the URL. Not 51 separate pages.

## Data files (`data/`)

- `states.json` — all 51 states/D.C., each with the 15 required fields (register, check registration, deadlines, polling place, Election Day, polling hours, early voting, absentee/mail, voter ID, accessible voting, military/overseas, student voting, sample ballot, contact, official resources). Every field currently carries `status: "placeholder"` and a placeholder notice — **not real voting information yet**.
- `faq.json` — general, nonpartisan FAQ content (safe generic civic education, not state-specific claims)
- `elections.json` — one verified federal date (2026 general election, Nov 3, 2026) plus placeholder architecture for state/local dates
- `resources.json` — verified national official resources (Vote.gov, USA.gov, EAC.gov, FVAP.gov)

Every changeable data item supports `source_url`, `source_name`, `last_verified`, and `status` fields so a future automated process can flag stale information for human re-verification.

## Design

Shared visual language with nospin.media: black fixed header, Arial, `#f4f4f4` body background, white rounded cards with soft shadows, same mobile hamburger nav pattern. A small teal "🗳️ Voting Center" badge next to the logo and a `#0e6e6a` accent color distinguish this section without breaking the shared identity. Header/footer are rendered from `js/layout.js` (one JS template, not copy-pasted per page) so nav changes happen in one place.

## Not yet done (by design — see the project brief)

- Real per-state voting rules (currently all placeholder)
- Real state/local election dates
- Live NSM news feed into `news.html`
- Any link from the main NSM site, Knowledge Base, or promotional house-ad units
