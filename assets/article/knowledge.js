const SUPABASE_URL = 'https://dckmflnbprhmaqysuued.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_5uAn1PjQGf2Vmr7qpwGcdg_LOtygPRB';
const SB_NEWS_POSTS = SUPABASE_URL + '/news_posts';
const SB_DAILY_POSTS_KB = SUPABASE_URL + '/daily_posts';

let allPosts = [];

/* ── RELATED NEWS / RELATED KNOWLEDGE — TAG MATCHING (mirrors story.html) ── */
const LOW_WEIGHT_TAGS=['government','business','public health','international relations','weather','law enforcement'];
const NSM_CACHE_TTL=3600000; // 1 hour

function normTag(t){return(t||'').toString().trim().toLowerCase()}
function parseTags(raw){
  if(Array.isArray(raw))return raw;
  if(typeof raw==='string'){try{const p=JSON.parse(raw);return Array.isArray(p)?p:[]}catch(e){return[]}}
  return[];
}
function scoreTagOverlap(aTags,bTags){
  const aSet=new Set(parseTags(aTags).map(normTag));
  const bSet=new Set(parseTags(bTags).map(normTag));
  let score=0,specificMatches=0;
  aSet.forEach(tag=>{
    if(!tag||!bSet.has(tag))return;
    if(LOW_WEIGHT_TAGS.includes(tag))score+=1;
    else{score+=3;specificMatches++;}
  });
  return{score,specificMatches};
}
function topMatches(currentTags,candidates,getTags,limit){
  return candidates
    .map(c=>({item:c,...scoreTagOverlap(currentTags,getTags(c))}))
    .filter(r=>r.specificMatches>=1)
    .sort((a,b)=>b.score-a.score||(b.item.id-a.item.id))
    .slice(0,limit)
    .map(r=>r.item);
}
function fmtFullDate(ds){
  if(!ds)return'';
  const d=new Date(ds);
  if(isNaN(d))return'';
  return d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
}
function stripMarkdownForPreview(text){
  if(!text)return'';
  return text
    // Drop whole heading LINES, not just the leading #s — KB articles
    // routinely open with "# <exact same text as the headline>", and
    // leaving the text behind (just minus the #) made the hero's deck line
    // literally repeat its own headline verbatim.
    .replace(/^#{1,6}\s+.*$/gm,'')
    .replace(/\*\*(.*?)\*\*/g,'$1')
    .replace(/\*(.*?)\*/g,'$1')
    .replace(/`(.*?)`/g,'$1')
    .replace(/\[(.*?)\]\(.*?\)/g,'$1')
    .trim();
}
function firstSentence(text,maxLen){
  const clean=stripMarkdownForPreview(text);
  if(!clean)return'';
  // A plain [.!?] scan treats abbreviation periods (U.S., U.K., D.C.) as full
  // sentence endings — seen live, it cut a deck line off mid-thought at
  // "...issued by U.S." Skip a candidate boundary when the period is
  // immediately preceded by a single capital letter (the common
  // abbreviation shape) and keep scanning for the real sentence end.
  const re=/[.!?](?=\s|$)/g;
  let m, sentence=null;
  while((m=re.exec(clean))){
    const before=clean.slice(Math.max(0,m.index-2),m.index);
    if(/\b[A-Z]$/.test(before))continue;
    sentence=clean.slice(0,m.index+1).trim();
    break;
  }
  if(!sentence)sentence=clean;
  if(sentence.length>maxLen)sentence=sentence.slice(0,maxLen).trim()+'…';
  else if(sentence.length===clean.length&&clean.length>maxLen)sentence=sentence.slice(0,maxLen).trim()+'…';
  return sentence;
}

function nsmCacheGet(key){
  try{
    const raw=localStorage.getItem(key);
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    if(!parsed||!Array.isArray(parsed.data))return null;
    return parsed;
  }catch(e){return null}
}
function nsmCacheSet(key,data){
  try{localStorage.setItem(key,JSON.stringify({timestamp:Date.now(),data}))}
  catch(e){console.warn('NSM cache write failed for '+key,e)}
}
function nsmCacheFresh(entry){return entry&&(Date.now()-entry.timestamp)<NSM_CACHE_TTL}

async function nsmFetchCached(cacheKey,url){
  const cached=nsmCacheGet(cacheKey);
  if(nsmCacheFresh(cached))return cached.data;
  try{
    const res=await fetch(url,{headers:{apikey:SUPABASE_KEY}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    nsmCacheSet(cacheKey,data);
    return data;
  }catch(e){
    console.warn('NSM fetch failed for '+cacheKey+', falling back to cache if available:',e);
    if(cached)return cached.data;
    return [];
  }
}

/* Renders "Latest News About This Topic" + "Related Knowledge" below a single KB article. */
async function loadRelatedNewsAndKnowledge(currentPost){
  const container=document.getElementById('kb-related-container');
  if(!container)return;
  const currentTags=currentPost.tags;
  if(!parseTags(currentTags).length)return;

  const [newsStories,kbArticles]=await Promise.all([
    nsmFetchCached('NSM_recentStories', SB_NEWS_POSTS+'?select=id,headline,url,tags,posted_at&order=id.desc&limit=300'),
    nsmFetchCached('NSM_knowledgeArticles', SB_DAILY_POSTS_KB+'?select=id,headline_text,url,tags,comment_text&post_type=eq.knowledge&order=id.desc')
  ]);

  const relatedNews=topMatches(currentTags,newsStories,c=>c.tags,3);
  const kbCandidates=kbArticles.filter(k=>k.id!==currentPost.id);
  const relatedKB=topMatches(currentTags,kbCandidates,c=>c.tags,3);

  let html='';
  if(relatedNews.length){
    html+='<div class="related-card"><div class="related-label">📰 LATEST NEWS ABOUT THIS TOPIC</div><div class="related-list">'
      +relatedNews.map(r=>'<a class="related-item" href="'+nsmHref('news',r.url,'story.html?story='+encodeURIComponent(r.url))+'"><span class="related-item-title">'+(r.headline||'').replace('\n',': ')+'</span>'+(r.posted_at?'<span class="related-item-date">'+fmtFullDate(r.posted_at)+'</span>':'')+'</a>').join('')
      +'</div></div>';
  }
  if(relatedKB.length){
    html+='<div class="learnmore-card"><div class="related-label">📚 RELATED KNOWLEDGE</div><div class="related-kb-list">'
      +relatedKB.map(k=>{
        const desc=firstSentence(k.comment_text,145);
        const href=nsmHref('knowledge',k.url?k.url:k.id,'knowledge.html?id='+encodeURIComponent(k.url?k.url:k.id));
        return'<a class="related-kb-item" href="'+href+'"><span class="related-kb-item-title">📖 '+(k.headline_text||'')+'</span>'
          +(desc?'<span class="related-kb-item-desc">'+desc+'</span>':'')
          +'</a>';
      }).join('')
      +'</div></div>';
  }
  container.innerHTML=html;
}

/* ── MARKDOWN → HTML CONVERTER ── */
function markdownToHTML(text) {
  if (!text) return '';
  let html = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  html = html.replace(/^---+$/gm, '<hr>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/((?:^[*\-] .+\n?)+)/gm, function(block) {
    const items = block.trim().split('\n').map(line => '<li>' + line.replace(/^[*\-] /, '') + '</li>').join('');
    return '<ul>' + items + '</ul>\n';
  });
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, function(block) {
    const items = block.trim().split('\n').map(line => '<li>' + line.replace(/^\d+\. /, '') + '</li>').join('');
    return '<ol>' + items + '</ol>\n';
  });
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|li|blockquote|hr|p)/.test(block)) return block;
    block = block.replace(/\n/g, '<br>');
    return '<p>' + block + '</p>';
  }).join('\n');
  return html;
}

/* ── IMAGE SYSTEM — HEAD-check a real per-article photo, then the News page's
   keyword-phrase rules, then (new) a broad post_tag → generic-photo map, then
   an always-present topic-color gradient. Tested against 30 live KB articles:
   the keyword tier alone matched 8/30 (27%, written for breaking-news
   headlines, not evergreen explainers) — adding the tag map brings that to
   26/30 (87%), reusing only photos already in images/news/. ── */
let _imgCache={},_imgRules=null;
const KB_TAG_FALLBACK_IMG={
  government:'us-capitol.webp',politics:'us-capitol.webp',
  law:'court-gavel.webp','law enforcement':'police-generic.webp',
  immigration:'ice-enforcement.webp',
  military:'military-drone.webp',security:'military-drone.webp',defense:'military-drone.webp',
  health:'fda-logo.webp',
  finance:'corporate-merger.webp',economy:'corporate-merger.webp',business:'corporate-merger.webp',trade:'cargo-containers.webp',
  technology:'ai-brain.webp',ai:'ai-brain.webp',
  world:'diplomacy-meeting.webp','international relations':'diplomacy-meeting.webp'
};
async function resolveImg(url,headline,tag){
  if(_imgCache[url]!==undefined)return _imgCache[url];
  for(const ext of['webp','jpg','png']){
    try{const r=await fetch('/images/news/'+url+'.'+ext,{method:'HEAD'});if(r.ok){_imgCache[url]='/images/news/'+url+'.'+ext;return _imgCache[url]}}catch(e){}
  }
  try{
    if(!_imgRules){const r=await fetch('/images/news/image-rules.json');if(r.ok)_imgRules=await r.json()}
    if(_imgRules){
      const h=(headline||'').toLowerCase();
      for(const rule of(_imgRules.keywords||[])){
        if(rule.match.some(kw=>{const esc=kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?<![a-z])'+esc+'(?![a-z])','i').test(h)})){_imgCache[url]='/images/news/'+rule.image;return _imgCache[url]}
      }
    }
  }catch(e){}
  const tagFallback=KB_TAG_FALLBACK_IMG[(tag||'').toLowerCase().trim()];
  if(tagFallback){_imgCache[url]='/images/news/'+tagFallback;return _imgCache[url]}
  _imgCache[url]=null;return null;
}
async function preloadImages(posts){await Promise.all(posts.map(p=>resolveImg(p.url,(p.headline_text||'')+' '+(p.comment_text||'').slice(0,300),p.post_tag)))}

function shade(hex,percent){
  const h=(hex||'#2a7a2a').replace('#','');
  const num=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
  let r=(num>>16)+Math.round(255*percent),g=((num>>8)&0xff)+Math.round(255*percent),b=(num&0xff)+Math.round(255*percent);
  r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
  return'#'+(r<<16|g<<8|b).toString(16).padStart(6,'0');
}
function tint(hex,amount){
  // Mixes toward white proportionally per-channel (unlike shade()'s flat
  // additive lighten, which blows straight out to pure white on saturated
  // colors well before reaching a usable pastel wash).
  const h=(hex||'#2a7a2a').replace('#','');
  const num=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
  const r=(num>>16),g=((num>>8)&0xff),b=(num&0xff);
  const mix=(c)=>Math.round(c+(255-c)*amount);
  return'#'+(mix(r)<<16|mix(g)<<8|mix(b)).toString(16).padStart(6,'0');
}
function bgBase(tagColor){
  return'background-image:linear-gradient(160deg,'+shade(tagColor,-.55)+','+shade(tagColor,-.15)+');background-size:cover;';
}
function bgPhoto(url){
  const res=_imgCache[url];
  return res?'background-image:url(\''+res+'\');background-size:cover;background-position:center;':'';
}

/* ── ONE tasteful, topic-matched recommendation (right rail) — replaces the
   in-feed ad-tile system entirely. A trusted publication makes an occasional
   recommendation; it doesn't wallpaper its own content with them. ── */
let _kwRules=null;
/* Broad post_tag → pool of relevant keyword-affiliates.json rule ids. Curated
   once by hand rather than fuzzy-matched against article body text, because
   most rules' keywords are narrow/event-specific ("drone strike", "strait of
   hormuz") and rarely overlap with an evergreen explainer's actual wording —
   fuzzy matching a specific article usually turned up exactly one rule,
   leaving no real pool to rotate through. This gives each topic a handful of
   genuinely relevant candidates instead. */
const KB_TAG_RULE_POOL={
  government:['police','immigration','white-house','congress','courts','diplomacy'],
  politics:['white-house','congress','diplomacy'],
  immigration:['immigration','police','courts'],
  law:['courts','police'],
  'law enforcement':['police','courts'],
  military:['drones','missiles','air-power','navy','hormuz','sahel-conflict'],
  security:['drones','missiles','navy'],
  defense:['drones','missiles','air-power','navy'],
  health:['fda','global-health','food-security'],
  finance:['trade','oil','oil-refining'],
  economy:['trade','oil','oil-refining'],
  business:['trade','oil-refining'],
  technology:['ai','space'],
  ai:['ai'],
  science:['space','ai','wildfire','heatwave'],
  world:['diplomacy','sahel-conflict','vatican','hormuz'],
  history:['vatican','sahel-conflict']
};

/* Topic-aware pool + deterministic daily rotation: same topic always picks
   from the same relevant pool (curated above), but which item — and whether
   it's the book or gear side of that item — advances once per calendar day,
   the same for every visitor that day, and never on a mid-day refresh. */
function pickRecommendationPick(tag){
  const rules=(_kwRules&&_kwRules.rules)||[];
  if(!rules.length)return null;
  const byId={};
  rules.forEach(r=>{byId[r.id]=r});
  const poolIds=KB_TAG_RULE_POOL[(tag||'').toLowerCase().trim()]||[];
  let pool=poolIds.map(id=>byId[id]).filter(Boolean);
  if(!pool.length)pool=rules; // unmapped or unrecognized topic — rotate the full catalog rather than show nothing

  const dayIndex=Math.floor(Date.now()/86400000);
  const rule=pool[dayIndex%pool.length];
  const cycle=Math.floor(dayIndex/pool.length);
  const preferGear=cycle%2===1;
  // A chunk of the catalog's gear entries are a generic "STAY INFORMED" /
  // Home Office placeholder (checked live: 8 of 23 rules, and they happen to
  // make up the *entire* Government pool) rather than a real distinct item.
  // Rotating onto one of those would show identical text no matter which
  // rule landed that day — exactly the "doesn't feel curated" problem this
  // was meant to fix. Falls back to the book side, which is always distinct.
  if(preferGear&&rule.gear&&rule.gear.title!=='STAY INFORMED')return rule.gear;
  return rule.books||rule.gear;
}
function recommendationHTML(pick){
  if(!pick)return'';
  const title=(pick.title||'').replace(/\n/g,' ');
  const sub=(pick.subtitle||'').replace(/\n/g,' ');
  return`<a class="kb-recommend" href="${pick.url}" target="_blank" rel="noopener nofollow sponsored" title="Recommended by the NSM newsroom">
    <img class="kb-recommend-thumb" src="/affiliate/${pick.image}" alt="" loading="lazy">
    <div>
      <div class="kb-recommend-title">${title}</div>
      <div class="kb-recommend-sub">${sub}</div>
      <div class="kb-recommend-shop">Shop this pick →</div>
    </div>
  </a>`;
}
function renderRecommendation(tag){
  const el=document.getElementById('kb-recommendation');
  if(!el)return;
  const pick=pickRecommendationPick(tag);
  el.innerHTML=recommendationHTML(pick) || '';
  if(!pick){el.closest('.kb-rail-card').style.display='none'}else{el.closest('.kb-rail-card').style.display=''}
}

/* ── UTILITIES ── */
function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}
function slugify(label) {
  return (label || '').toString().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function formatDateLabel(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || 'Undated';
  const [y, m, d] = dateStr.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[Number(m) - 1]} ${Number(d)}, ${y}`;
}
function readingTime(text){
  const words=(text||'').trim().split(/\s+/).filter(Boolean).length;
  const mins=Math.max(1,Math.round(words/200));
  return mins+' min read';
}

/* ── TOPIC COLORS ── */
const TAG_COLORS = {
  history:'#b5651d',health:'#0f8b8d',politics:'#5b4b8a',science:'#1d6fa5',
  economy:'#946200',business:'#946200',war:'#8a1f2d',security:'#8a1f2d',
  world:'#1d6fa5',law:'#5b4b8a',technology:'#1d6fa5',environment:'#0f8b8d',
  'voting & elections':'#5a3e85'
};
function getTagColor(tag) {
  const key = (tag || '').toLowerCase().trim();
  return TAG_COLORS[key] || '#2a7a2a';
}

/* A curated cross-cutting topic sourced from the granular `tags` array
   rather than the single post_tag category each article already has (see
   loadPosts()'s dedicated fetch below, and buildTopicList/applyFilter) --
   lets this topic span articles filed under different post_tag categories
   without reassigning/losing that category, and without being capped by
   the recent-50 fetch the normal list view uses. */
const KB_VOTING_ELECTIONS_TAG = 'voting & elections';
const KB_VOTING_ELECTIONS_SLUG = 'voting-and-elections';
const KB_VOTING_ELECTIONS_LABEL = 'Voting & Elections';
const KB_VOTING_ELECTIONS_DATATAG = '__voting_elections__';
let votingElectionsPosts = [];

function formatSummary(post) {
  const raw = (post.post_comment && post.post_comment.trim()) ? post.post_comment.trim() : extractPreview(post.comment_text);
  return raw
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}
function extractPreview(text) {
  if (!text) return '';
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^#+/.test(trimmed)) continue;
    return trimmed
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .slice(0, 220) + (trimmed.length > 220 ? '…' : '');
  }
  return '';
}

async function sharePost(url, btn) {
  // Copy Article Link: hands out the rich /preview/ URL (server-rendered
  // OG/twitter meta + the generated Knowledge Base card image), not a
  // direct knowledge.html link -- crawlers/social bots read the metadata
  // from that page, then a real human visitor's browser gets JS-redirected
  // back to this exact article. Same data.nospin.media/preview/<id>?source=
  // mechanism unpublished.html's national/NE/KB share buttons already use;
  // see PREVIEW_SOURCES in app.py. This is the ONLY thing this function
  // changed for -- article loading, the page's own canonical URL, and its
  // own OG tags are untouched.
  const shareUrl = `https://data.nospin.media/preview/${encodeURIComponent(url)}?source=kb`;
  const originalHTML = btn.innerHTML;
  const done = () => { btn.innerHTML = '✅'; setTimeout(() => { btn.innerHTML = originalHTML; }, 2000); };
  try {
    // navigator.clipboard only exists in a "secure context" (https:// or
    // localhost) — a plain http:// LAN address, like this test server,
    // doesn't qualify, so this throws there even though it works fine on
    // the real https://nospin.media site. Falls back to the older
    // execCommand technique either way — same approach index.html/story.html
    // already use for their own share buttons.
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard API unavailable in this context');
    await navigator.clipboard.writeText(shareUrl);
    done();
  } catch (err) {
    try {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.cssText = 'position:fixed;top:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (err2) {
      alert('Could not copy link. Please copy manually from the address bar.');
    }
  }
}
function wireShare(el, p) {
  const shareBtn = el.querySelector('.kb-share-btn');
  if (shareBtn) shareBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); sharePost(p.url, shareBtn); });
}
function goToArticle(url) {
  window.location.href = nsmHref('knowledge', url, 'knowledge.html?id=' + encodeURIComponent(url));
}

/* ── COVER STORY ── */
function coverHTML(p) {
  const tagLabel = p.post_tag || 'Knowledge';
  const tagColor = getTagColor(tagLabel);
  const summary = formatSummary(p);
  const dateLabel = formatDateLabel(p.post_date);
  const rt = readingTime(p.comment_text);
  const deck = firstSentence(p.comment_text, 130);
  const hasImage = !!_imgCache[p.url];

  // The hero adapts to whether a real photo actually resolved: a tall photo
  // treatment when one did, or a short, flat, topic-tinted treatment when it
  // didn't — never a stretched-out empty color block pretending to be a photo.
  const topSection = hasImage ? `
    <div class="kb-cover-photo" style="${bgBase(tagColor)}">
      <div class="kb-cover-bg" style="${bgPhoto(p.url)}"></div>
      <div class="kb-cover-scrim"></div>
      <div class="kb-cover-wordmark">✦ Featured Explainer</div>
      <div class="kb-cover-content">
        <div class="kb-cover-kicker"><span class="kb-cover-kicker-bar"></span><span class="kb-cover-kicker-text">${tagLabel}</span></div>
        <h1 class="kb-cover-title">${p.headline_text || 'Untitled'}</h1>
        ${deck ? `<p class="kb-cover-deck">${deck}</p>` : ''}
      </div>
    </div>` : `
    <div class="kb-cover-flat" style="background:linear-gradient(120deg,${tint(tagColor,.9)},${tint(tagColor,.96)})">
      <div class="kb-cover-wordmark-flat">✦ Featured Explainer</div>
      <div class="kb-cover-kicker"><span class="kb-cover-kicker-bar" style="background:${tagColor}"></span><span class="kb-cover-kicker-text" style="color:${tagColor}">${tagLabel}</span></div>
      <h1 class="kb-cover-title-flat">${p.headline_text || 'Untitled'}</h1>
    </div>`;

  return `<div class="kb-cover" style="--tag-color:${tagColor}" onclick="goToArticle('${p.url}')">
    ${topSection}
    <div class="kb-cover-below">
      <div>
        <div class="kb-cover-summary">${summary}</div>
        <div class="kb-cover-meta"><span>${dateLabel}</span><span class="dot"></span><span>${rt}</span></div>
      </div>
      <div class="kb-cover-actions">
        <button class="kb-share-btn" title="Copy link to this article" aria-label="Copy link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"></line><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line></svg>
        </button>
        <a class="kb-open-link" href="${nsmHref('knowledge', p.url, 'knowledge.html?id=' + encodeURIComponent(p.url))}" onclick="event.stopPropagation()">Read Full Explainer <span class="cta-arrow">→</span></a>
      </div>
    </div>
  </div>`;
}

/* ── ARTICLE CARD (grid) ── */
function cardHTML(p) {
  const tagLabel = p.post_tag || 'Knowledge';
  const tagColor = getTagColor(tagLabel);
  const summary = formatSummary(p);
  const dateLabel = formatDateLabel(p.post_date);
  const rt = readingTime(p.comment_text);

  return `<div class="kb-card" style="--tag-color:${tagColor}" onclick="goToArticle('${p.url}')">
    <div class="kb-card-top" style="${bgBase(tagColor)}">
      <div class="kb-card-top-bg" style="${bgPhoto(p.url)}"></div>
      <div class="kb-card-top-scrim"></div>
      <div class="kb-card-top-content">
        <button class="kb-pill" onclick="event.stopPropagation();filterByTag('${tagLabel.replace(/'/g,"\\'")}')">${tagLabel}</button>
      </div>
    </div>
    <div class="kb-card-body">
      <h3 class="kb-card-title">${p.headline_text || 'Untitled'}</h3>
      <div class="kb-card-meta"><span>${dateLabel}</span><span class="dot"></span><span>${rt}</span></div>
      <div class="kb-card-summary">${summary}</div>
      <div class="kb-card-footer">
        <button class="kb-share-btn" title="Copy link to this article" aria-label="Copy link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"></line><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line></svg>
        </button>
        <a class="kb-open-link" href="${nsmHref('knowledge', p.url, 'knowledge.html?id=' + encodeURIComponent(p.url))}" onclick="event.stopPropagation()">Read Full Explainer <span class="cta-arrow">→</span></a>
      </div>
    </div>
  </div>`;
}

/* ── LIST VIEW: cover story + rails + grid ── */
let _renderSeq = 0;
function resultsBannerHTML(label){
  return `<div class="kb-results-banner"><span class="kb-results-count">${label}</span><button type="button" class="kb-results-clear" onclick="clearFilters()">Clear</button></div>`;
}

// filterLabel: null in the default "All Explainers" view (shows the full
// cover-story treatment). A string (e.g. "26 explainers matching “ice”")
// whenever a search or topic filter is active — in that case the cover story
// is suppressed entirely in favor of a plain, equal-weight results grid with
// an explicit count. Searching a coincidentally-still-matching hero article
// (its own top pick both before and after) previously looked identical
// before and after the search — this makes the change unmistakable.
// topicHint: a post_tag string used only to pick the right-rail recommendation pool.
function renderList(posts, filterLabel, topicHint) {
  const grid = document.getElementById('kb-grid');
  const coverContainer = document.getElementById('kb-cover-container');
  const seq = ++_renderSeq;

  if (!posts || posts.length === 0) {
    coverContainer.innerHTML = filterLabel ? resultsBannerHTML('0 explainers found') : '';
    grid.innerHTML = `
      <div class="kb-empty">
        <div class="kb-empty-icon">🧭</div>
        <h4>No explainers match that yet</h4>
        <p>Try a different search term or topic — or clear your filters to see everything.</p>
        <button id="kb-clear-filters">Clear filters</button>
      </div>`;
    document.getElementById('kb-clear-filters').addEventListener('click', clearFilters);
    renderRecommendation(topicHint);
    return;
  }

  preloadImages(posts).then(() => {
    // Typing fast (or clicking filters in quick succession) fires renderList
    // repeatedly; each call's image-preload finishes at its own pace. Without
    // this guard, an older, slower-resolving call can finish after a newer
    // one and clobber it with stale results — which looks exactly like
    // "search doesn't work" even though the filtering logic itself is fine.
    if (seq !== _renderSeq) return;

    if (filterLabel) {
      coverContainer.innerHTML = resultsBannerHTML(filterLabel);
      grid.innerHTML = posts.map(p => cardHTML(p)).join('');
      posts.forEach((p, i) => wireShare(grid.children[i], p));
    } else {
      const heroPost = posts[0];
      const rest = posts.slice(1);
      coverContainer.innerHTML = coverHTML(heroPost);
      wireShare(coverContainer.firstElementChild, heroPost);
      grid.innerHTML = rest.map(cardHTML).join('');
      rest.forEach((p, i) => wireShare(grid.children[i], p));
    }

    renderRecommendation(topicHint);
  });
}

/* ── SINGLE ARTICLE READING VIEW ── */
function renderSingleArticle(p) {
  document.getElementById('kb-list-view').style.display = 'none';
  const view = document.getElementById('kb-single-view');
  view.style.display = '';

  const tagLabel = p.post_tag || 'Knowledge';
  const tagColor = getTagColor(tagLabel);
  const dateLabel = formatDateLabel(p.post_date);
  const rt = readingTime(p.comment_text);
  const fullHTML = markdownToHTML(p.comment_text);

  preloadImages([p]).then(() => {
    document.getElementById('kb-single-content').innerHTML = `
      <div class="kb-single-header" style="--tag-color:${tagColor};${bgBase(tagColor)}">
        <div class="kb-cover-bg" style="${bgPhoto(p.url)}"></div>
        <div class="kb-cover-scrim"></div>
        <div class="kb-cover-content" style="position:relative;z-index:1;max-width:none">
          <div class="kb-cover-kicker"><span class="kb-cover-kicker-bar" style="background:${tagColor}"></span><span class="kb-cover-kicker-text">${tagLabel}</span></div>
          <h1 class="kb-single-title">${p.headline_text || 'Untitled'}</h1>
        </div>
      </div>
      <div class="kb-single-body">
        <div class="kb-single-meta">
          <span>${dateLabel}</span><span class="dot"></span><span>${rt}</span>
          <span style="flex:1"></span>
          <button class="kb-share-btn" title="Copy link to this article" aria-label="Copy link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"></line><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line></svg>
          </button>
        </div>
        <div class="post-content">${fullHTML}</div>
      </div>`;
    wireShare(document.getElementById('kb-single-content'), p);
  });
}

/* ── STATIC PAGE (2026-10-22) ──
   On /knowledge/<id>.html the generator (~/nsm_sitemap) embeds this article's public
   fields as #nsm-static-story; the single-article view renders from them instead of
   fetching Supabase -- same code path, same result as knowledge.html?id=<id>. */
function nsmStaticStory(){if(nsmStaticStory._v!==undefined)return nsmStaticStory._v;let v=null;const el=document.getElementById('nsm-static-story');if(el){try{v=JSON.parse(el.textContent)}catch(e){}}return nsmStaticStory._v=v}

/* ── DATA LOAD ── */
async function loadPosts() {
  const st = nsmStaticStory();
  if (st) {
    renderSingleArticle(st);
    loadRelatedNewsAndKnowledge(st);
    return;
  }
  const sharedId = getQueryParam('id');

  if (sharedId) {
    const res = await fetch(
      `${SUPABASE_URL}/daily_posts?select=*&post_type=eq.knowledge&url=eq.${encodeURIComponent(sharedId)}`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    const data = await res.json();
    if (data && data[0]) {
      renderSingleArticle(data[0]);
      loadRelatedNewsAndKnowledge(data[0]);
    } else if ((res.ok && Array.isArray(data)) || res.status === 400) {
      // Not-found noindex (2026-10-08): GitHub Pages returns 200 for any
      // ?id=, so a missing article must say noindex itself or it's a soft
      // 404. Definitive misses only (200 + zero rows, or 400 malformed id);
      // a network error/5xx leaves the page indexable.
      let robots = document.head.querySelector('meta[name="robots"]');
      if (!robots) { robots = document.createElement('meta'); robots.setAttribute('name', 'robots'); document.head.appendChild(robots); }
      robots.setAttribute('content', 'noindex');
      document.title = 'Article not found | No Spin Media';
    }
    return;
  }

  const [res, kwData, veRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/daily_posts?select=*&post_type=eq.knowledge&order=id.desc&limit=50`, { headers: { apikey: SUPABASE_KEY } }),
    (window.AMAZON_AFFILIATES_ENABLED===true ? fetch('/affiliate/keyword-affiliates.json').then(r => r.ok ? r.json() : { rules: [] }).catch(() => ({ rules: [] })) : Promise.resolve({ rules: [] })),
    fetch(`${SUPABASE_URL}/daily_posts?select=*&post_type=eq.knowledge&tags=cs.${encodeURIComponent(JSON.stringify([KB_VOTING_ELECTIONS_TAG]))}&order=id.desc`, { headers: { apikey: SUPABASE_KEY } }).then(r => r.ok ? r.json() : []).catch(() => [])
  ]);
  const rawPosts = await res.json();
  // The content pipeline occasionally republishes the same explainer under a
  // second row (same headline, different id/url) — confirmed live with "What
  // Is a Trade Deficit?" appearing twice back to back. A reference library
  // should never show the same entry twice, regardless of why the upstream
  // duplicate exists, so dedupe by normalized headline, keeping the newest
  // (rows already arrive ordered id.desc).
  const seenHeadlines = new Set();
  allPosts = rawPosts.filter(p => {
    const key = (p.headline_text || '').trim().toLowerCase();
    if (!key) return true; // nothing meaningful to dedupe against — keep it
    if (seenHeadlines.has(key)) return false;
    seenHeadlines.add(key);
    return true;
  });
  _kwRules = kwData;

  const veSeenHeadlines = new Set();
  votingElectionsPosts = (Array.isArray(veRes) ? veRes : []).filter(p => {
    const key = (p.headline_text || '').trim().toLowerCase();
    if (!key) return true;
    if (veSeenHeadlines.has(key)) return false;
    veSeenHeadlines.add(key);
    return true;
  });

  buildTopicList(allPosts);
  buildRecentList(allPosts);

  // URL-addressable topic filtering (knowledge.html?topic=<slug>) -- selects
  // the matching rail button before the first render so a shared/bookmarked
  // link lands directly on that filtered view. Silently falls back to "all"
  // (already active by default) if the slug doesn't match any current topic.
  const topicParam = getQueryParam('topic');
  if (topicParam) {
    const buttons = Array.from(document.querySelectorAll('#kb-topic-list .kb-topic-item'));
    const match = buttons.find(b => b.dataset.topicSlug === topicParam);
    if (match) {
      buttons.forEach(b => b.classList.remove('active'));
      match.classList.add('active');
    }
  }

  // Not renderList(allPosts) — if the user already typed a search term or
  // picked a topic while this fetch was still in flight (very plausible:
  // this is a real round trip to Supabase), that unconditionally blows away
  // whatever they'd already entered the instant data arrives. applyFilter()
  // re-reads whatever's currently in the search box / active topic (still
  // defaults harmlessly to "all" / empty on a normal load) and renders that.
  applyFilter();
}

function buildTopicList(posts) {
  const el = document.getElementById('kb-topic-list');
  const counts = {};
  posts.forEach(p => { const t = p.post_tag || 'Other'; counts[t] = (counts[t] || 0) + 1; });
  const tags = Object.keys(counts).sort();

  let html = `<button type="button" class="kb-topic-item active" data-tag="all" data-topic-slug="all"><span class="kb-topic-dot" style="background:var(--blue)"></span><span class="kb-topic-name">All Explainers</span><span class="kb-topic-count">${posts.length}</span></button>`;
  tags.forEach(t => {
    html += `<button type="button" class="kb-topic-item" data-tag="${t.replace(/"/g,'&quot;')}" data-topic-slug="${slugify(t)}" style="--tag-color:${getTagColor(t)}"><span class="kb-topic-dot"></span><span class="kb-topic-name">${t}</span><span class="kb-topic-count">${counts[t]}</span></button>`;
  });
  if (votingElectionsPosts.length > 0) {
    html += `<button type="button" class="kb-topic-item" data-tag="${KB_VOTING_ELECTIONS_DATATAG}" data-topic-slug="${KB_VOTING_ELECTIONS_SLUG}" style="--tag-color:${getTagColor(KB_VOTING_ELECTIONS_LABEL)}"><span class="kb-topic-dot"></span><span class="kb-topic-name">${KB_VOTING_ELECTIONS_LABEL}</span><span class="kb-topic-count">${votingElectionsPosts.length}</span></button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('.kb-topic-item').forEach(item => {
    item.addEventListener('click', () => {
      el.querySelectorAll('.kb-topic-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      applyFilter();
      // The rail stays put (it's sticky) but the results it just changed
      // render at the top of the page — without this, picking a topic while
      // scrolled down leaves you staring at whatever used to be there.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function buildRecentList(posts) {
  const el = document.getElementById('kb-recent-list');
  // "New This Week" means it literally — real date filter, not just "last N
  // regardless of age." Skips whatever's the global newest since that's
  // already the default cover story; if nothing else was posted in 7 days,
  // the section just doesn't render rather than mislabel older items.
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = posts.slice(1).filter(p => {
    const d = new Date(p.post_date);
    return !isNaN(d) && d.getTime() >= weekAgo;
  }).slice(0, 6);
  if (!recent.length) { el.closest('.kb-rail-section')?.remove(); return; }
  el.innerHTML = recent.map(p => `<a class="kb-item" href="${nsmHref('knowledge', p.url, 'knowledge.html?id=' + encodeURIComponent(p.url))}">
    <span class="kb-item-title">${p.headline_text || 'Untitled'}</span>
    <span class="kb-item-desc">${formatDateLabel(p.post_date)}</span>
  </a>`).join('');
}

function activeTag() {
  const active = document.querySelector('#kb-topic-list .kb-topic-item.active');
  return active ? active.dataset.tag : 'all';
}
function applyFilter() {
  const selectedTag = activeTag();
  const rawQuery = document.getElementById('kbSearch').value.trim();
  const query = rawQuery.toLowerCase();
  let filtered = selectedTag === 'all'
    ? allPosts
    : (selectedTag === KB_VOTING_ELECTIONS_DATATAG ? votingElectionsPosts : allPosts.filter(p => p.post_tag === selectedTag));
  if (query) {
    filtered = filtered.filter(p => {
      const haystack = `${p.headline_text || ''} ${p.post_comment || ''} ${p.comment_text || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  const selectedLabel = selectedTag === KB_VOTING_ELECTIONS_DATATAG ? KB_VOTING_ELECTIONS_LABEL : selectedTag;
  let filterLabel = null;
  if (selectedTag !== 'all' || query) {
    const bits = [];
    if (query) bits.push(`matching “${rawQuery}”`);
    if (selectedTag !== 'all') bits.push(`in ${selectedLabel}`);
    filterLabel = `${filtered.length} explainer${filtered.length === 1 ? '' : 's'} ${bits.join(' ')}`;
  }
  const topicHint = selectedTag !== 'all' ? selectedLabel : (filtered[0] ? filtered[0].post_tag : '');

  renderList(filtered, filterLabel, topicHint);
}
function filterByTag(tag) {
  const list = document.getElementById('kb-topic-list');
  list.querySelectorAll('.kb-topic-item').forEach(i => i.classList.toggle('active', i.dataset.tag === tag));
  applyFilter();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function clearFilters() {
  const list = document.getElementById('kb-topic-list');
  const search = document.getElementById('kbSearch');
  const searchClear = document.getElementById('kbSearchClear');
  list.querySelectorAll('.kb-topic-item').forEach(i => i.classList.toggle('active', i.dataset.tag === 'all'));
  if (search) search.value = '';
  if (searchClear) searchClear.hidden = true;
  renderList(allPosts);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── SUGGEST FORM ── */
async function submitSuggestion(e) {
  e.preventDefault();
  if (document.getElementById('kb-honeypot').value) return;
  const status = document.getElementById('suggestStatus');
  status.textContent = '⏳ Sending...';
  const data = {
    name:    document.getElementById('kb-name').value || 'Someone',
    email:   document.getElementById('kb-email').value,
    subject: `Knowledge Base Suggestion — ${document.getElementById('kb-topic').value || 'General'}`,
    message: document.getElementById('kb-message').value
  };
  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbwr26uY61Dip94_QwzyLh1JDSIFdYHJgqL_scKGLdRd9O42VLDBvt2XzkA67tjphJrs/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    });
    let result = {};
    try { result = await res.json(); } catch { result = { status: 'success' }; }
    if (result.status === 'success') {
      status.textContent = '✅ Thanks! Your suggestion was sent.';
      document.getElementById('suggestForm').reset();
    } else {
      status.textContent = '❌ Error sending. Please try again.';
    }
    setTimeout(() => { status.textContent = ''; }, 5000);
  } catch (err) {
    status.textContent = '❌ Failed to send. Check your connection.';
    setTimeout(() => { status.textContent = ''; }, 5000);
  }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function () {
  fetch('header.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('site-header').innerHTML = html;
      const hamburger = document.getElementById('hamburger');
      const mobileNav = document.getElementById('mobile-nav');
      if (hamburger && mobileNav) {
        hamburger.onclick = () => { mobileNav.classList.toggle('open'); hamburger.classList.toggle('active'); };
        mobileNav.querySelectorAll('a').forEach(link => {
          link.onclick = () => { mobileNav.classList.remove('open'); hamburger.classList.remove('active'); };
        });
      }
      loadPosts();
    });

  const searchInput = document.getElementById('kbSearch');
  const searchClear = document.getElementById('kbSearchClear');
  searchInput.addEventListener('input', () => {
    searchClear.hidden = !searchInput.value;
    applyFilter();
  });
  // Filtering already happens live on every keystroke, but pressing Enter
  // should still visibly "do something" rather than silently no-op (there's
  // no <form> here for it to submit against) — dismiss the keyboard on
  // mobile and just confirm the current results.
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyFilter(); searchInput.blur(); }
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    applyFilter();
    searchInput.focus();
  });
  document.getElementById('suggestForm').addEventListener('submit', submitSuggestion);
});
