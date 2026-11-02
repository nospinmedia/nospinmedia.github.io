/* ── NSM SOURCES SECTION (2026-11-02) ──────────────────────────────────────
   Shared by story.html (National) and ne_story.html (New England).

   Input: the story's stored `original_url` field, as written by the
   publishing pipeline: "<source URL> [| <more URLs>] | Verified: Outlet A, Outlet B".

   Rules (never invent anything):
   - A URL is linked only if it is an article-specific http(s) URL AND the
     static-page generator confirmed it loads (HTTP 200, not a "not found"
     page, not redirected to a homepage). About a quarter of the stored URLs
     that could be checked in Nov 2026 were dead, and AP/Reuters block
     automated checks, so unconfirmed URLs are never linked: their outlet is
     shown by name, as plain text. Homepages, section pages, placeholders
     (example.com), our own site and social sites are never linked.
   - Outlets listed after "Verified:" are shown verbatim as plain text, with
     no links (no URL is stored for them).
   - Outlet display names come only from NSM_SOURCE_NAMES (hand-maintained,
     keyed by hostname). Unknown hosts show the bare hostname.
   - Nothing stored -> no Sources section at all.

   Static pages (/news/, /new-england/) get the parsed result embedded by the
   generator as `_sources`, with links for confirmed URLs. Historical pages
   parse `original_url` here in the browser, where nothing can be confirmed,
   so they list outlets as plain text only.
   The generator (~/nsm_sitemap/static_pages.py) ports nsmParseSources() and
   nsmSourcesHTML() line for line and reads NSM_SOURCE_NAMES and
   NSM_SOURCE_BLOCKED from this file, so the two cannot drift. */
const NSM_SOURCE_NAMES={"reuters.com":"Reuters","apnews.com":"AP News","cbsnews.com":"CBS News","bostonglobe.com":"The Boston Globe","bbc.com":"BBC News","bbc.co.uk":"BBC News","pressherald.com":"Portland Press Herald","theguardian.com":"The Guardian","pbs.org":"PBS","vtdigger.org":"VTDigger","wbur.org":"WBUR","aljazeera.com":"Al Jazeera","cnn.com":"CNN","wmur.com":"WMUR","ctmirror.org":"CT Mirror","nhpr.org":"NHPR","boston.com":"Boston.com","axios.com":"Axios","mass.gov":"Mass.gov","washingtonpost.com":"The Washington Post","boston25news.com":"Boston 25 News","bangordailynews.com":"Bangor Daily News","nbcnews.com":"NBC News","npr.org":"NPR","ctinsider.com":"CT Insider","mainepublic.org":"Maine Public","nbcboston.com":"NBC Boston","indepthnh.org":"InDepthNH","abcnews.com":"ABC News","abcnews.go.com":"ABC News","justice.gov":"U.S. Department of Justice","newhampshirebulletin.com":"New Hampshire Bulletin","portal.ct.gov":"CT.gov","wgbh.org":"GBH News","space.com":"Space.com","cnbc.com":"CNBC","foxnews.com":"Fox News","nasa.gov":"NASA","newscentermaine.com":"News Center Maine","doj.nh.gov":"New Hampshire Department of Justice","whdh.com":"WHDH 7News","ctpublic.org":"Connecticut Public","wcax.com":"WCAX","wcvb.com":"WCVB","maine.gov":"Maine.gov","wpri.com":"WPRI","bloomberg.com":"Bloomberg","fda.gov":"U.S. Food and Drug Administration","unionleader.com":"New Hampshire Union Leader","malegislature.gov":"Massachusetts Legislature","cdc.gov":"CDC","thehindu.com":"The Hindu","newsfromthestates.com":"News From The States","concordmonitor.com":"Concord Monitor","providencejournal.com":"Providence Journal","nytimes.com":"The New York Times","ksat.com":"KSAT","aa.com.tr":"Anadolu Agency","boston.gov":"City of Boston","police.boston.gov":"Boston Police Department","bostonherald.com":"Boston Herald","masslive.com":"MassLive","jpost.com":"The Jerusalem Post","latimes.com":"Los Angeles Times","foxbusiness.com":"Fox Business","ft.com":"Financial Times","vermontpublic.org":"Vermont Public","patch.com":"Patch","fox61.com":"FOX61","variety.com":"Variety","whitehouse.gov":"The White House","wsj.com":"The Wall Street Journal","thehill.com":"The Hill","politico.com":"Politico","texastribune.org":"The Texas Tribune","globalnews.ca":"Global News","courant.com":"Hartford Courant","riag.ri.gov":"Rhode Island Attorney General","golocalprov.com":"GoLocalProv","mainebiz.biz":"Mainebiz","wfsb.com":"WFSB","news.un.org":"UN News","local10.com":"Local 10 News","gov.uk":"GOV.UK","sciencedaily.com":"ScienceDaily","euronews.com":"Euronews","al-monitor.com":"Al-Monitor","nhregister.com":"New Haven Register","timesofisrael.com":"The Times of Israel","clickorlando.com":"News 6 (ClickOrlando)","japantimes.co.jp":"The Japan Times","the-independent.com":"The Independent","independent.co.uk":"The Independent","news.bloomberglaw.com":"Bloomberg Law","morningstar.com":"Morningstar","energy.gov":"U.S. Department of Energy","weather.gov":"National Weather Service","straitstimes.com":"The Straits Times","nhc.noaa.gov":"National Hurricane Center","houstonchronicle.com":"Houston Chronicle","turnto10.com":"NBC 10 WJAR","legiscan.com":"LegiScan","iso-ne.com":"ISO New England","centralmaine.com":"Central Maine","commonwealthbeacon.org":"CommonWealth Beacon","statehousenews.com":"State House News Service","mainemorningstar.com":"Maine Morning Star","nepm.org":"New England Public Media","governor.nh.gov":"Office of the New Hampshire Governor","vermontbiz.com":"Vermont Business Magazine","nhjournal.com":"NH Journal","gao.gov":"U.S. Government Accountability Office","statnews.com":"STAT","kffhealthnews.org":"KFF Health News","upi.com":"UPI","usnews.com":"U.S. News & World Report","time.com":"TIME","who.int":"World Health Organization","spacenews.com":"SpaceNews","newyorkfed.org":"Federal Reserve Bank of New York","dawn.com":"Dawn","thestar.com":"Toronto Star","defense.gov":"U.S. Department of Defense","militarytimes.com":"Military Times","cbc.ca":"CBC News","epa.gov":"U.S. Environmental Protection Agency","dw.com":"DW","indianexpress.com":"The Indian Express","canada.ca":"Government of Canada","ftc.gov":"Federal Trade Commission","hindustantimes.com":"Hindustan Times","dhs.gov":"U.S. Department of Homeland Security","nps.gov":"National Park Service","thenationalnews.com":"The National","aclu.org":"ACLU","defensenews.com":"Defense News","hhs.gov":"U.S. Department of Health and Human Services","foxweather.com":"FOX Weather","bls.gov":"U.S. Bureau of Labor Statistics","kyivindependent.com":"The Kyiv Independent","courthousenews.com":"Courthouse News Service","stateline.org":"Stateline","fbi.gov":"FBI","ctpost.com":"Connecticut Post","wgme.com":"WGME","seacoastonline.com":"Seacoastonline","espn.com":"ESPN","gazettenet.com":"Daily Hampshire Gazette","sentinelsource.com":"The Keene Sentinel","ctnewsjunkie.com":"CT News Junkie","sevendaysvt.com":"Seven Days","themainemonitor.org":"The Maine Monitor","nhbr.com":"New Hampshire Business Review","news.uscg.mil":"U.S. Coast Guard","newsweek.com":"Newsweek","forbes.com":"Forbes","businessinsider.com":"Business Insider","theverge.com":"The Verge","techcrunch.com":"TechCrunch","usatoday.com":"USA Today","nypost.com":"New York Post","semafor.com":"Semafor","scotusblog.com":"SCOTUSblog","supremecourt.gov":"Supreme Court of the United States","congress.gov":"Congress.gov","federalregister.gov":"Federal Register","state.gov":"U.S. Department of State","treasury.gov":"U.S. Department of the Treasury","noaa.gov":"NOAA","usgs.gov":"U.S. Geological Survey","nbcconnecticut.com":"NBC Connecticut","wmtw.com":"WMTW","wabi.tv":"WABI","vnews.com":"Valley News","ri.gov":"Rhode Island Government","governor.ri.gov":"Office of the Rhode Island Governor","wbznewsradio.iheart.com":"WBZ NewsRadio"};
const NSM_SOURCE_BLOCKED=["example.com","example.org","example.net","nospin.media","localhost","facebook.com","fb.com","instagram.com","x.com","twitter.com","t.co","bit.ly","reddit.com","threads.net","threads.com","bsky.app","google.com","news.google.com","bing.com","youtube.com","youtu.be","tiktok.com"];
const NSM_SOURCE_NAME_JUNK=["n/a","na","none","unknown","null","undefined","tbd","various","multiple","other","others"];
const NSM_SOURCE_MAX_LINKS=4;
const NSM_SOURCE_MAX_OUTLETS=8;
function nsmSrcEsc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
/* Hostname of an http(s) URL without "www.", or '' if it isn't a usable one. */
function nsmSrcHost(u){
  if(!/^https?:\/\/[^\s<>"'`]+$/i.test(u)||u.length>600)return'';
  const m=u.match(/^https?:\/\/([^\/?#:@]+)(?::\d+)?(?:[\/?#]|$)/i);if(!m)return'';
  let h=m[1].toLowerCase().replace(/\.$/,'');if(h.indexOf('www.')===0)h=h.slice(4);
  if(h.indexOf('.')<0||/^[\d.]+$/.test(h))return'';
  return h;
}
function nsmSrcBlocked(h){return NSM_SOURCE_BLOCKED.some(b=>h===b||h.slice(-(b.length+1))==='.'+b)}
/* True for an article-specific page: its last meaningful path segment has a
   digit or is a 3+ word slug ("index"/"story"/"amp" fall back to the segment
   before), or the query names an article/story id. */
function nsmSrcIsArticle(u){
  const m=u.match(/^https?:\/\/[^\/?#]+([^?#]*)(\?[^#]*)?/i);if(!m)return false;
  let segs=m[1].split('/').filter(Boolean);
  while(segs.length&&/^(index|story|amp|default)(\.[a-z]+)?$/i.test(segs[segs.length-1]))segs.pop();
  if(segs.length){
    let last;try{last=decodeURIComponent(segs[segs.length-1])}catch(e){last=segs[segs.length-1]}
    last=last.replace(/\.(html?|php|aspx?|shtml)$/i,'');
    if(/\d/.test(last))return true;
    if(last.split(/[-_]+/).filter(Boolean).length>=3)return true;
  }
  return !!(m[2]&&/[?&](id|story|article|articleid|p)=/i.test(m[2]));
}
function nsmSrcOutletName(h){
  let k=h;
  while(k.indexOf('.')>=0){if(Object.prototype.hasOwnProperty.call(NSM_SOURCE_NAMES,k))return NSM_SOURCE_NAMES[k];k=k.slice(k.indexOf('.')+1)}
  return h;
}
function nsmSrcCleanName(n){
  n=String(n).replace(/\s+/g,' ').trim().replace(/^["'“”‘’]+|["'“”‘’.;:]+$/g,'').trim();
  if(n.length<2||n.length>60||!/[A-Za-z]/.test(n))return'';
  if(/:\/\/|^www\.|[<>{}]/i.test(n))return'';
  if(/-style\b|\breporting (on|by)\b/i.test(n))return'';  /* descriptions, not outlet names */
  if(NSM_SOURCE_NAME_JUNK.indexOf(n.toLowerCase())>=0)return'';
  return n;
}
/* linkable: URLs confirmed to load (generator only); anything else is shown
   by outlet name without a link. */
function nsmParseSources(raw,linkable){
  const out={links:[],outlets:[]};
  if(typeof raw!=='string'||!raw.trim())return out;
  const okSet=new Set(linkable||[]);const seenUrl=new Set(),seenName=new Set();
  const addOutlet=n=>{n=nsmSrcCleanName(n);if(!n)return;const k=n.toLowerCase();if(seenName.has(k))return;seenName.add(k);out.outlets.push(n)};
  const names=[];
  for(const part of raw.split('|')){
    const seg=part.trim();if(!seg)continue;
    const v=seg.match(/^verified\s*:\s*(.*)$/i);
    if(v){v[1].split(',').forEach(n=>names.push(n));continue}
    if(!/^https?:\/\//i.test(seg))continue;
    const h=nsmSrcHost(seg);if(!h||nsmSrcBlocked(h))continue;
    const name=nsmSrcOutletName(h);
    if(nsmSrcIsArticle(seg)&&okSet.has(seg)&&out.links.length<NSM_SOURCE_MAX_LINKS){
      if(seenUrl.has(seg))continue;seenUrl.add(seg);
      out.links.push({url:seg,name:name,host:h});seenName.add(name.toLowerCase());
    }else names.unshift(name);
  }
  names.forEach(addOutlet);
  out.outlets=out.outlets.filter(n=>!out.links.some(l=>l.name.toLowerCase()===n.toLowerCase())).slice(0,NSM_SOURCE_MAX_OUTLETS);
  return out;
}
function nsmSourcesHTML(src){
  if(!src||((!src.links||!src.links.length)&&(!src.outlets||!src.outlets.length)))return'';
  let h='<section class="nsm-sources" aria-label="Sources"><h2 class="nsm-sources-title">Sources</h2>';
  if(src.links.length){
    h+='<ul class="nsm-sources-list">'+src.links.map(l=>'<li><a href="'+nsmSrcEsc(l.url)+'" target="_blank" rel="noopener">'+nsmSrcEsc(l.name)+'</a>'
      +(l.name!==l.host?'<span class="nsm-sources-host">'+nsmSrcEsc(l.host)+'</span>':'')+'</li>').join('')+'</ul>';
  }
  if(src.outlets.length){
    h+='<p class="nsm-sources-also"><span class="nsm-sources-label">'+(src.links.length?'Also consulted:':'Reporting consulted:')+'</span> '+src.outlets.map(nsmSrcEsc).join(', ')+'</p>';
  }
  h+='<p class="nsm-sources-note"><a href="/editorial-standards.html">How we source and verify stories</a></p></section>';
  return h;
}
