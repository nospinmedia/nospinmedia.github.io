/* ══════════════════════════════════════════════════════════════
   AMAZON ASSOCIATES — MASTER SWITCH
   ══════════════════════════════════════════════════════════════
   This is the only place the Amazon affiliate system is turned on or off.

   false (current, since 2026-10-03): the Associates account was closed by
   Amazon (no 3 qualifying sales within 180 days). Every page skips loading
   affiliate.json / keyword-affiliates.json, renders no picks/tiles/rails,
   and hides every element tagged class="amazon-aff" (sidebars, mobile
   inserts, Amazon disclosures, the Sponsor page section, the Privacy page
   Amazon paragraph). The site behaves as if the integration did not exist.

   true: everything comes back exactly as it was. All data, images, and
   rendering code are untouched under /affiliate/ and in each page.

   Safe default: pages treat a missing/failed load of this file as "off"
   (they check === true), and their own CSS hides .amazon-aff unless this
   file adds the "amazon-aff-on" class to <html>.

   To re-enable: set the flag below to true, and replace the tag value
   nospinmedia-20 in affiliate.json / keyword-affiliates.json / sponsor.html
   if Amazon issues a new tracking ID. Full checklist:
   claude/amazon-affiliates-disabled.md on the NSM server. */
window.AMAZON_AFFILIATES_ENABLED = false;

if (window.AMAZON_AFFILIATES_ENABLED === true) {
  document.documentElement.classList.add('amazon-aff-on');
}
