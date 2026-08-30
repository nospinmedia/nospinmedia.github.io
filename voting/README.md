# No Spin Media Voting Center

A standalone, nonpartisan static site for voter information and education — registration, ways to vote, polling places, ID requirements, and state-by-state guides. Visually designed to feel like a section of [nospin.media](https://nospin.media).

**Deployed at [https://nospin.media/voting/](https://nospin.media/voting/)** as a self-contained `voting/` directory inside the `nospinmedia.github.io` repo — not linked from the main NSM site's navigation, homepage, or Knowledge Base yet; that happens deliberately at formal launch.

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
- `states/index.html` — **one reusable template** for all 50 states + D.C. (territories to follow), rendered client-side via `?state=XX` in the URL. Not 51+ separate pages, and each page load fetches only that one jurisdiction's own file — never the full collection.

## Jurisdiction data (`data/states/`, `data/territories/`)

Each state/D.C. is its own file: `data/states/AL.json`, `data/states/CA.json`, ... `data/states/WY.json`, `data/states/DC.json`. Territories (AS, GU, MP, PR, VI) will land in `data/territories/` the same way as they're added — that directory exists now but is empty. **This is the only authoritative copy of each jurisdiction's voting information** — there is no separate consolidated file duplicating this content.

Each jurisdiction file has the same shape:

```
{
  "id", "name", "status", "last_verified",
  "next_state_election": {...} | null,
  "glance_notes": [...],
  "sections": {
    "register", "check_registration", "deadlines", "polling_place",
    "election_day", "polling_hours", "early_voting", "absentee_mail",
    "voter_id", "accessible_voting", "military_overseas", "student_voting",
    "sample_ballot", "contact", "official_resources"
  }
}
```

Each section carries: `label`, `status`, `content`, `glance_value`, `source_url`, `source_name`, `last_verified`, `flagged_reason`, `flagged_at`, `internal_note`, `reverify_after_days`.

**`status`** (both top-level and per-section) is one of `placeholder` / `in_review` / `needs_review` / `verified`. Only `verified` jurisdictions are indexable (search-engine crawlable) and appear in `sitemap.xml` — see js/states.js's SEO handling and `generate_sitemap.py`. A checker can flag a section `needs_review` (with `flagged_reason`/`flagged_at`) without touching its published `content`/`source_url`/`last_verified` — those represent the last human-verified instruction and are never auto-cleared.

New Hampshire (`NH`) is the reference implementation and the only currently-`verified` jurisdiction. Every other jurisdiction is `in_review` or `placeholder` — real content, but not yet independently re-verified against primary sources the way NH was.

### Two generated files — never hand-edit these

- **`data/jurisdictions.json`** — a `{id, name, status}` index built from every file in `data/states/` and `data/territories/`. This is what the state picker (`js/main.js`) and the feedback form's state dropdown (`js/layout.js`) actually read — neither hardcodes a state list. Regenerate after adding/removing a jurisdiction file: `python3 generate_jurisdictions_index.py`
- **`sitemap.xml`** — built from the same per-jurisdiction files, including only `verified` ones (plus all static pages, unconditionally). Regenerate whenever a jurisdiction's status changes: `python3 generate_sitemap.py`

### Validate before every deploy

`python3 validate_jurisdictions.py` checks every file in `data/states/` and `data/territories/` against the schema above (exact field sets, valid status enum, non-empty content unless placeholder, no stray Markdown-link syntax in URLs) and exits non-zero if anything is malformed. Deploys should not proceed past a failing validation run.

## Other data files (`data/`)

- `faq.json` — general, nonpartisan FAQ content (safe generic civic education, not state-specific claims)
- `elections.json` — one verified federal date (2026 general election, Nov 3, 2026) plus placeholder architecture for state/local dates
- `resources.json` — verified national official resources (Vote.gov, USA.gov, EAC.gov, FVAP.gov)

## Knowledge Base integration

The homepage's "📚 Understand Voting & Elections" section and several contextual in-page links point to existing, canonical NSM Knowledge Base explainers (`https://nospin.media/knowledge.html?id=<url>`, opened in a new tab) — the Voting Center never copies or duplicates KB article content, it only links out. Styled with the third link tier, `.vc-kb-link`/`.vc-kb-note`/`.vc-kb-card`/`.vc-kb-explore` (muted plum, `css/style.css`), deliberately lower-emphasis than `.vc-official-link` — wherever a KB link and an official-government-action link appear together (e.g. `elections.html`'s EAC entry), the government link stays visually primary.

Current KB links (all verified against the live Supabase-backed KB data, not guessed):
- Homepage cards: Mail-In Voting, Voting Machines, Primary Election, Caucus, EAC, 270 Electoral Votes
- `ways-to-vote.html#election-day` → Voting Machines explainer; `#absentee-mail` → Mail-In Voting explainer
- `faq.html` (`faq-15`, primary vs. general) → Primary Election explainer
- `elections.html` federal entry (via `data/elections.json`'s optional `kb_link`/`kb_label` fields, rendered by `js/elections.js` only when present) → EAC explainer
- `states/index.html?state=NH` → New Hampshire's First-in-the-Nation Presidential Primary explainer (hardcoded to `state.id === "NH"` in `js/states.js` — a genuine one-off special case, not a new jurisdiction-schema field, so `validate_jurisdictions.py` and the other 50 jurisdiction files are untouched)

The KB's topic/category system is tag-based (`daily_posts.tags`, a free-form array unique to each article — there is no fixed category enum), so a "Voting & Elections" grouping would mean adding that tag string to the qualifying articles' `tags` arrays directly in the KB's live data — not a Voting Center change. Not yet done; proposed article set reported to the site owner for confirmation before any such change.

## Feedback / report form

Every page includes a "Have a Voting Question or Found an Update?" form (injected by `js/layout.js`, not duplicated per-page HTML). It reuses the exact same submission mechanism as the public Knowledge Base "Suggest an article" form on `knowledge.html` — same Google Apps Script endpoint, same `{name, email, subject, message}` payload, same honeypot — with a `source: "Voting Center"` field and a `"Voting Center — <reason> — <state>"` subject prefix so submissions are distinguishable from Games/Knowledge Base ones without any schema change. State auto-preselects from `?state=XX`; the section (if the reader arrived via a `#anchor`) is captured as the actual human-readable heading text, not the raw anchor id; the page URL is captured automatically. **Note:** as of this writing, the shared Apps Script backend still has a hardcoded "Sent from the Games feedback form" footer regardless of source — fixing that requires editing the Apps Script itself (Google-hosted, not in this repo), which needs the `source` field this form already sends to branch the footer correctly per form.

## SEO / crawlability

- `<link rel="canonical">` is static on all 12 non-state pages, hardcoded to `https://nospin.media/voting/...`.
- State pages set `canonical`, `robots`, and `description` **dynamically** per `?state=XX` in `js/states.js`, since it's one template covering every jurisdiction: `verified` → `index, follow`; everything else → `noindex, follow`. This flips automatically the next time a page loads after a status change — no manual step.
- `robots.txt` must live at the true site root (`nospin.media/robots.txt`), not inside `voting/` — a per-directory one isn't honored by crawlers. It points to `voting/sitemap.xml`.

## Design

Shared visual language with nospin.media: black fixed header, Arial, `#f4f4f4` body background, white rounded cards with soft shadows, same mobile hamburger nav pattern. A small teal "🗳️ Voting Center" badge next to the logo and a `#0e6e6a` accent color distinguish this section without breaking the shared identity. Header/footer are rendered from `js/layout.js` (one JS template, not copy-pasted per page) so nav changes happen in one place.

## Not yet done

- Independent primary-source verification for 49 of 51 jurisdictions (only NH is `verified`)
- Territories (AS, GU, MP, PR, VI)
- Real state/local election dates beyond the few captured per-jurisdiction
- Live NSM news feed into `news.html`
- Any link *from* the main NSM site or its Knowledge Base *to* the Voting Center (the reverse direction — Voting Center → Knowledge Base — now exists, see "Knowledge Base integration" above); promotional house-ad units
- The Apps Script backend's per-source footer fix (see Feedback form, above)
