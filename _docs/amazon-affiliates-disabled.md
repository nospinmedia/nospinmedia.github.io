# Amazon Associates — disabled (dormant), how to re-enable

**Status:** ⚪ DISABLED, dormant and reversible. Task closed 2026-10-03.

| | |
|---|---|
| Disabled on | **2026-10-03** |
| Why | Amazon closed the No Spin Media Associates account because it didn't get **3 qualifying purchases within 180 days**. Amazon affiliate content can't appear on any public NSM page while the account is closed. |
| Disabling commit | **`7dc7ebd`** in `nospinmedia/nospinmedia.github.io` ("Disable Amazon Associates site-wide behind one master switch") |
| Master flag | `window.AMAZON_AFFILIATES_ENABLED = false;` in **`affiliate/config.js`** (site repo root → `affiliate/config.js`, served at `https://nospin.media/affiliate/config.js`) |
| Tracking ID in dormant data | `nospinmedia-20` (may need replacing before re-enabling, see below) |

Copies of this doc: `_docs/amazon-affiliates-disabled.md` in the site repo, and `claude/amazon-affiliates-disabled.md` on the NSM server. The `_` prefix keeps the copy out of the published site because GitHub Pages/Jekyll doesn't publish it. It's only visible in the GitHub repo.

## How the switch works

Every page that used the affiliate system loads `/affiliate/config.js` first in `<head>` and has one CSS rule: `html:not(.amazon-aff-on) .amazon-aff{display:none!important}`. `config.js` adds the `amazon-aff-on` class to `<html>` only when the flag is `true`.

When the flag is off:
- The data loaders (`getAff`, `getKw`, `loadAffData`, `loadAffiliateData`, `loadKeywordAffiliateData`) skip their fetch (`if(window.AMAZON_AFFILIATES_ENABLED===true)try{…fetch…}`) and fall through to their existing empty defaults.
- Functions that would otherwise build an empty mobile "NSM Picks" box return early (`loadAffiliateTiles` / `loadAllAffiliateTiles`).
- Static containers tagged `class="amazon-aff"` are hidden.

It's fail-safe: pages test `=== true`, so if `config.js` fails to load, Amazon content stays off.

## Everything currently disabled

On all of these pages: index, index2, news, new-england, story, ne_story, story-old, knowledge, daily, sponsor, privacy, utilities/index, utilities/tip, unpublished, unpublished_ne, test.

- Left/right "NSM Picks" / "NSM Reading List" / "NSM Field Gear" sidebars with Amazon image tiles (index, news, new-england, ne_story, story-old, daily, utilities/index).
- In-feed keyword-matched book/gear tiles and their "NSM Picks — Supports independent journalism" captions (index, index2, news, new-england).
- Mobile "NSM Picks" insert boxes (index, news, new-england, ne_story, story-old, daily, utilities/index, utilities/tip, unpublished, unpublished_ne).
- story.html "Curated Pick" / "Stay Informed" / "Affiliate Pick" recommendation cards (desktop right rail and mobile inline).
- knowledge.html "Recommended Reading" card ("Shop this pick →").
- unpublished/unpublished_ne "Affiliate match" badges (they get no rules, so they don't render).
- The footer disclosure "Some links are affiliate links. As an Amazon Associate we earn from qualifying purchases." on every page above.
- sponsor.html "🛒 Support Through Our Recommendations" section and its Amazon link.
- privacy.html "Affiliate Links" section (Amazon Associates Program wording) and the "Amazon" bullet under Third-Party Services.
- test.html "Amazon Widget Test": the `z-na.amazon-adsystem.com` script isn't loaded, the heading is hidden, and the tab title shows "Test".
- Network: `affiliate/affiliate.json` and `affiliate/keyword-affiliates.json` are never requested.

## Deliberately preserved (dormant, not rendered)

- `affiliate/affiliate.json` (39 links) and `affiliate/keyword-affiliates.json` (46 links, 23 keyword rules), all tagged `nospinmedia-20`.
- Images: `affiliate/books/`, `affiliate/gear/`, `affiliate/amazon/` (includes the Amazon / Prime Day banner art).
- All rendering functions, `must_show` logic, keyword matching and CSS in every page.
- The disclosure text, Sponsor link and Privacy wording stay in the HTML source, hidden with `display:none`.
- The `*.bak-*` snapshot files in the repo root, which still contain old Amazon footers. They're served as `application/octet-stream`, aren't rendered, and nothing links to them.
- Nothing was deleted or moved. **Leave these where they are.**

These files can still be fetched by anyone who types the exact URL or uses "view source", but normal visitors never see them.

## Not part of this (left alone on purpose)

- `utilities/shopping-list.html` "Import from Amazon List" is the Alexa shopping-list import, not affiliate code.
- Google AdSense (`ads.txt`, `adsbygoogle`), Google Analytics, Venmo/donation sections.
- `nospinmedia/funfeed-images`, the Flask server (`data.nospin.media`), n8n and Reddit posting had no Amazon affiliate code (grep, 2026-10-03).

## Affiliate tag check

All 86 links in the two JSON files plus `sponsor.html` use exactly `tag=nospinmedia-20`, and so does `test.html` (`amzn_assoc_tracking_id`). An earlier report said two links were malformed: Science Fiction and Emergency Radios. **That was wrong.** The links were cut off in a truncated terminal display, not in the data. Re-checked in full on 2026-10-03, and no malformed tags exist.

## Procedure to re-enable Amazon Associates

1. **Rejoin the Amazon Associates program** and note the tracking ID Amazon assigns.
2. **If the tracking ID isn't `nospinmedia-20`, replace it everywhere** (`grep -rn nospinmedia-20` in the site repo, excluding `*.bak-*`):
   - `affiliate/affiliate.json`
   - `affiliate/keyword-affiliates.json`
   - `sponsor.html` (one link)
   - `test.html` (`window.amzn_assoc_tracking_id`)
3. **Flip the flag:** in `affiliate/config.js`, set `window.AMAZON_AFFILIATES_ENABLED = true;`.
4. **Review the disclosure wording** in the page footers, `sponsor.html` and `privacy.html` against Amazon's current Operating Agreement before pushing.
5. **Push to `main`** and wait for the GitHub Pages build.
6. **Verify:** sidebars, in-feed tiles, mobile picks, story Curated Picks, the KB Recommended Reading card, footer disclosures, the Sponsor section and the Privacy section all render on desktop and mobile, the links carry the right tag, and the console shows no JS errors. (On 2026-10-03 this was confirmed by forcing the flag on in a headless browser, and everything returned.)

No other code changes are needed.
