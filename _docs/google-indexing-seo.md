# Google indexing / SEO setup — nospin.media

> Site-repo copy. The master is `claude/google-indexing-seo.md` on the NSM server. Doc links below (story-sitemap.md, github-pages.md, supabase-publishing-reliability-proposal.md) refer to the NSM server's `claude/` folder.

**Status:** ✅ **CLOSED 2026-10-03.** The setup is complete and verified live. **Next checkpoint: Search Console review** (see the end). **No further SEO changes** until Search Console data gives a reason.

Copies of this doc: `claude/google-indexing-seo.md` on the NSM server, and `_docs/google-indexing-seo.md` in the site repo. `_docs/` isn't published, because Jekyll skips `_` folders.

## 1. Problems found (2026-10-03)

| # | Problem | Effect |
|---|---|---|
| 1 | **No story sitemap.** `robots.txt` pointed only at `voting/sitemap.xml` (13 URLs, no stories). `/sitemap.xml` was a 404. | Google had no list of the ~4,800 permanent story URLs. |
| 2 | **Stories not reachable through static links.** Home, `news.html` (the Archive), `new-england.html` and `knowledge.html` contained **zero** story links before JavaScript ran. After rendering they showed only the ~18–30 newest stories, and the archive was a JS search form with no crawlable pagination. | Older stories were effectively undiscoverable. |
| 3 | **Accidental `noindex` on `story.html` since 2026-08-06.** `<meta name="robots" content="noindex">` came over from the `story2.html` prototype when it was promoted to `story.html` (site commit `1d52b1bc`). | Google was told not to index **any** National story for about 2 months. `ne_story.html` never had it. |
| 4 | **Generic story titles.** Every story was `Story \| No Spin Media` (National) or `No Spin Media – New England`. | Every story looked the same in search. |
| 5 | **No meta description, canonical URL, publication metadata or NewsArticle schema** on either story page, even after rendering. | No date or publisher signals; weak story-to-story distinction. |
| 6 | **Broken related-story links.** `story.html`'s "Related stories" and side-rail links went to `story2.html?story=…`, a **404**, also left over from the 08-06 promotion. | Dead internal links for readers and crawlers. |
| 7 | (Minor) `og:description`/`twitter:description` carried raw markdown (`**bold**` etc.). | Messy social share previews. |

Story content itself was rendered by JavaScript from Supabase. That was judged acceptable, since Google renders JS, so pre-rendering was **not** done.

## 2. What was built and changed

### Sitemap + static archive (site commit `cb63b41`)

- **Sitemaps:**
  - `https://nospin.media/sitemap.xml` is a **sitemap index** pointing to `voting/sitemap.xml` (unchanged), `sitemap-stories-national.xml`, `sitemap-stories-new-england.xml` and `sitemap-archive.xml`.
  - `robots.txt` lists both `/sitemap.xml` and `voting/sitemap.xml`.
- **Static archive:**
  - `/archive/` is a hub page linking to month pages at `/archive/national/YYYY-MM.html` and `/archive/new-england/YYYY-MM.html`.
  - Each month page is a plain `<a href>` list of every story, with no JavaScript.
  - From `/archive/`, Google can reach every story in two clicks.
- **Generator:** `~/nsm_sitemap/generate_story_sitemap.py`, NSM cron **`7,37 * * * *`** (flock), log `~/nsm_sitemap/cron.log`.
  - It reads published stories from Supabase, read-only (`used=true`, the same tables the story pages read).
  - It commits **only when something changed**.
  - It refuses to publish if either feed drops more than 2%, and sends a Discord alert on failure.
  - Full detail: [story-sitemap.md](story-sitemap.md).

### Story-page metadata + noindex removal (site commit `38efbb1`)

- `story.html`: the accidental `noindex` line was **removed**.
- At the same time, a check for other blocks found none. There is no other noindex, nofollow, `X-Robots-Tag` or injected robots tag on either story page, and `robots.txt` is `Allow: /`. The only `nofollow` is on outbound affiliate links, which is correct.
- **`setStorySearchMetadata()`**, in both `story.html` and `ne_story.html`, runs once the story loads from Supabase:
  - **`document.title`:** headline (emoji stripped) + ` | No Spin Media`.
  - **`meta description`:** plain-text summary, up to 160 characters, falling back to the subhead and then the headline.
  - **`link rel=canonical`:** the page's own permanent URL, `https://nospin.media/story.html?story=<id>` or `/ne_story.html?story=<id>`.
  - **NewsArticle JSON-LD:**
    - headline, description, url/`mainEntityOfPage`;
    - **`datePublished` = Supabase `posted_at`**, never the displayed "1h ago" text;
    - publisher and author = No Spin Media, with the logo `images/NSM-Logo.png`;
    - `articleSection` (the displayed topic label), the hero `image` when there is one, and `keywords` (National tags).
  - Each element is found-or-created and overwritten, so there are never duplicates or stale values when another story loads.

### Related links + share descriptions (site commit `0905bde`)

- The related-story links now go to `story.html?story=…`.
- A full search of the site repo and the Flask app found **no other public `story2.html` links**. Only code comments and `.bak` files mention it.
- `ne_story.html` has no related-story links.
- `markdownToPlain()` now cleans the summary for `og:description`, `twitter:description` and the meta description, so no markdown markup appears. The visible article rendering is unchanged.

### Site commits in the final state

| Commit | What |
|---|---|
| `cb63b41` | sitemap index + story sitemaps + `/archive/` + robots.txt |
| `8c7df48` | automatic regeneration after the 38-story backfill (3,792 national / 1,066 NE) |
| `38efbb1` | story-page metadata + JSON-LD; National `noindex` removed |
| `0905bde` | related links fixed; plain-text OG/Twitter descriptions |
| `d865a33` | latest automatic regeneration at checkpoint time (09:07, two newly published stories) |

Later sitemap commits are automatic. Each new published story produces one at the next :07/:37 run.

### Current sitemap counts (2026-10-03 10:06 ET, live)

| | Story URLs |
|---|---|
| National (`sitemap-stories-national.xml`) | **3,793** |
| New England (`sitemap-stories-new-england.xml`) | **1,067** |
| Total | **4,860** |

The 3,954 National rows map to 3,793 URLs: 18 legacy rows have no ID, and 143 legacy rows share an ID with another row. New England: 1,068 rows → 1,067 URLs, because one ID is shared. These are legacy data facts. See [story-sitemap.md](story-sitemap.md).

## 3. Found along the way: Supabase publishing reliability

The public site reads **only Supabase**. Local Postgres is the source, and each story is copied to Supabase once at publish time, insert-only. Investigation found **45 locally-published stories missing from the website**. Three causes:

1. **New England website-only bug.** It always wrote to Supabase `news_posts`, the national table, and an id collision there was silently dropped while the endpoint still reported success.
2. **National n8n workflow.** The step that marks a story posted runs about 30 nodes before `SupaBase Dump`, so a failure in between leaves the story on Reddit/social but never on the website.
3. **New England n8n workflow.** Its `SupaBase Dump` step itself failed for 3 stories.

**Fixes, live 2026-10-03:**
- `mirror_story_to_supabase()` in `~/dropoff/app.py`:
  - writes to the correct table, with each table's own columns;
  - is insert-only and refuses id/url conflicts, so no new shared IDs can be created;
  - requires an explicit `posted_at`;
  - only reports success once the story is **readable through the same public API the site uses**, and returns 502 otherwise.
- `~/dropoff/supabase_reconcile.py`, cron **`2,17,32,47 * * * *`**:
  - re-publishes any story with evidence of publication that is still missing after a **45-min grace**;
  - looks back 7 days, with a hard floor of 2026-10-03, so it never touches history;
  - sends a Discord alert on any repair, conflict or stuck story.
- n8n was **not** modified.

**Historical backfill (owner-approved):** **38 stories added, 0 failures** (14 National + 24 New England). This includes New England 911/943, which had only existed in the national table; those national copies were left untouched.
- **Dates:** original publish times. Exact for 29 stories. For 9, the time was estimated from the Reddit post ID (see the proposal doc).
- **Backup:** taken first, in `~/db-backups/supabase-pre-backfill-20261003/`.
- **Checks afterward:** every story was verified through the public API, and every pre-existing row is byte-identical to the backup.

**Deliberately left untouched (7):**
- **NE 847:** the same story is already live as National 3528, so adding it would duplicate it.
- **NE 649, 650, 652, 857, 861, 862:** marked used locally, but there is **no evidence they were ever published** (no Reddit/queue/Blogger/social IDs, not website-only). They were most likely skipped or consumed by hand, so they were not put on the website.

Full record: [supabase-publishing-reliability-proposal.md](supabase-publishing-reliability-proposal.md). Still optional and not done: an n8n `RETURNING`+IF alert, and Supabase partial unique indexes on url.

## 4. Google Search Console (2026-10-03)

- **Property:** domain property `nospin.media`, **ownership verified by DNS TXT record on 2026-10-03.** **Leave that TXT record in place.** Removing it un-verifies the property.
- **Sitemap submitted:** `https://nospin.media/sitemap.xml` (the index; Search Console expands the children).
- **Live URL Inspection** on `https://nospin.media/story.html?story=20261003052741863`: **"URL is available to Google"** and **"Page can be indexed."** This confirms the noindex removal and the rendered page.
- Search Console is **still processing** the new property and sitemap. Discovered/indexed counts and performance data aren't available yet.

## 5. Next checkpoint (open)

After Search Console has had time to process (allow roughly 1–2 weeks):
- **Sitemaps report:** status of `sitemap.xml` and its children, and discovered URL counts versus the ~4,860 stories (plus archive pages).
- **Page indexing report:** monitor **discovered, crawled and indexed** story counts for `story.html?story=` and `ne_story.html?story=`, and note the top "not indexed" reasons.
- Spot-check a few older National stories with URL Inspection; they were the ones behind `noindex` from 08-06 to 10-03.

**Rule: do not make additional SEO changes until Search Console data gives a specific reason.** Pre-rendering, an archive link in the site nav, and canonical handling for the 2 New England stories that also exist in the national table are all possible later, *if* the data points there.
