const SB_KEY='sb_publishable_5uAn1PjQGf2Vmr7qpwGcdg_LOtygPRB';
const SB_REACTIONS='https://dckmflnbprhmaqysuued.supabase.co/rest/v1/story_reaction_totals';

const NE_TOPIC_RULES=[
  {topic:'education',kws:['school','schools','university','universities','college','colleges','student','students','teacher','teachers','curriculum','tuition','campus','classroom','education','graduation','superintendent','school board','school district']},
  {topic:'environment',kws:['climate','flood','flooding','storm','hurricane','wildfire','drought','pollution','environmental','conservation','wildlife','habitat','clean energy','solar','wind turbine','offshore wind','fishing','fishery','fisheries','lobster','seacoast','watershed']},
  {topic:'health',kws:['hospital','hospitals','healthcare','health care','medical','medicine','patient','patients','nurse','nurses','doctor','doctors','opioid','fentanyl','overdose','mental health','addiction','vaccine','vaccination','flu','cancer','medicaid','medicare','public health','pharmacy','ambulance']},
  {topic:'economy',kws:['economy','economic','budget','tax','taxes','spending','revenue','deficit','inflation','unemployment','jobs','labor','workforce','wage','wages','housing','rent','mortgage','property','development','business','businesses','commerce','trade','tariff','prices','cost of living','fiscal']},
  {topic:'legal',kws:['court','courts','judge','ruling','lawsuit','verdict','charged','indicted','arrested','prosecution','trial','sentence','appeal','attorney general','supreme court','federal court','civil rights','injunction','constitution','legislation']},
  {topic:'crime',kws:['shooting','homicide','murder','robbery','assault','theft','arson','drug bust','arrested for','convicted','sentenced to','fentanyl bust','trafficking','gang','shooting investigation','domestic violence']},
  {topic:'politics',kws:['governor','legislature','senate','senator','house of representatives','representative','congressman','congresswoman','election','ballot','primary','campaign','vote','voted','voter','democrat','republican','independent','mayor','city council','town meeting','selectboard','state house','statehouse','policy','law','bill','legislation']},
  {topic:'newengland',kws:['new hampshire','vermont','maine','massachusetts','connecticut','rhode island','boston','manchester','concord','portland','burlington','providence','new haven','cape cod','white mountains','acadia','foliage','maple syrup','lobster roll','patriots','red sox','celtics','bruins']},
];
const NE_TOPIC_LABELS={education:'Education',environment:'Environment',health:'Health',economy:'Economy',legal:'Legal',crime:'Crime',politics:'Politics',newengland:'New England',transportation:'Transportation',energy:'Energy & Utilities',publicsafety:'Public Safety'};
const NE_TOPIC_BG={
  education:'linear-gradient(160deg,#1A3A6B,#2E5FA0)',environment:'linear-gradient(160deg,#083A08,#1A7A1A)',
  health:'linear-gradient(160deg,#6B2E00,#C05A0A)',economy:'linear-gradient(160deg,#0A3D1F,#1A7A3C)',
  legal:'linear-gradient(160deg,#320A6B,#6A28C0)',crime:'linear-gradient(160deg,#4A0A0A,#952020)',
  politics:'linear-gradient(160deg,#0D3270,#1E5BB8)',newengland:'linear-gradient(160deg,#1A3A1A,#2E6B2E)',
  transportation:'linear-gradient(160deg,#1A2A4A,#2E4A7A)',energy:'linear-gradient(160deg,#3A2800,#7A5800)',
  publicsafety:'linear-gradient(160deg,#3A1A00,#8B3A00)'
};
function wordMatch(hay,kw){const esc=kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?<![a-zA-Z])'+esc+'(?![a-zA-Z])','i').test(hay)}
function neInferTopic(s){const text=[s.headline||'',(s.summary||'').split('\n\n')[0]].join(' ');for(const rule of NE_TOPIC_RULES){if(rule.kws.some(kw=>wordMatch(text,kw)))return rule.topic}return'newengland'}

function resolveBackLink(){
  const ref=document.referrer;
  if(ref){try{const u=new URL(ref);if(u.hostname===window.location.hostname){const pg=u.pathname.split('/').pop();if(pg==='ne_index.html'||pg==='new-england.html'||pg==='ne.html')return{href:pg,label:'New England News'};if(pg==='news.html')return{href:'news.html',label:'Archive'};if(pg===''||pg==='index.html'||pg==='/')return{href:'index.html',label:'Latest News'};return{href:ref,label:'Back'}}}catch(e){}}
  return{href:'ne.html',label:'New England News'};
}

/* ── AFFILIATE ── */
/* must_show values: true = pinned, false = normal pool, "hide" = excluded */
let _affiliateData=null,_keywordAffiliateData=null;
async function loadAffiliateData(){if(_affiliateData)return _affiliateData;if(window.AMAZON_AFFILIATES_ENABLED===true)try{const r=await fetch('/affiliate/affiliate.json');if(r.ok)_affiliateData=await r.json()}catch(e){}return _affiliateData||{}}
async function loadKeywordAffiliateData(){if(_keywordAffiliateData)return _keywordAffiliateData;if(window.AMAZON_AFFILIATES_ENABLED===true)try{const r=await fetch('/affiliate/keyword-affiliates.json');if(r.ok)_keywordAffiliateData=await r.json()}catch(e){}return _keywordAffiliateData||{rules:[]}}
function findKeywordMatch(text,rules){if(!text||!rules||!rules.length)return null;let best=null,bestScore=0;for(const rule of rules){const score=(rule.keywords||[]).filter(kw=>wordMatch(text,kw)).length;if(score>bestScore){bestScore=score;best=rule}}return best}
function getRandomLink(item){return(item.links||[])[Math.floor(Math.random()*(item.links||[]).length)]||'#'}

/* Exclude "hide" items, then pinned first, then random pool */
function pickItems(items,count){
  const visible=items.filter(i=>i.must_show!=='hide');
  const must=visible.filter(i=>i.must_show===true);
  const opt=[...visible.filter(i=>i.must_show!==true)].sort(()=>0.5-Math.random());
  const pool=[...must,...opt];
  const seen=new Set();const result=[];
  for(const item of pool){if(!seen.has(item.title)&&result.length<count){seen.add(item.title);result.push(item)}}
  return result;
}
function pickOneMobile(items){
  const visible=items.filter(i=>i.must_show!=='hide');
  const must=visible.filter(i=>i.must_show===true);
  const pool=must.length?must:visible;
  return pool[Math.floor(Math.random()*pool.length)];
}

function renderTileHTML(item){return'<a href="'+getRandomLink(item)+'" target="_blank" rel="noopener nofollow sponsored" title="Browse on Amazon"><img src="/affiliate/'+item.image+'" alt="'+item.title+'" loading="lazy"></a>'}
const NSM_SUPPORT_MSGS=['Supports independent journalism','Helps keep NSM free','Curated by No Spin Media','Reader-supported journalism','Recommended by the NSM newsroom','Hand-picked by No Spin Media','Helps fund independent reporting','NSM reader recommendation'];
function randSupport(){return NSM_SUPPORT_MSGS[Math.floor(Math.random()*NSM_SUPPORT_MSGS.length)]}
function bookTileHTML(b){const tl=(b.title||'').split('\\n').map(l=>'<div>'+l+'</div>').join('');const sub=(b.subtitle||'').replace(/\\n/g,'<br>');return'<a href="'+b.url+'" target="_blank" rel="noopener nofollow sponsored" class="aff-card aff-card-book" title="Recommended reading \u2014 supports NSM at no extra cost"><div class="book-card-wrap"><div class="book-spine" style="background:'+b.spine_color+';"></div><div class="book-pages"></div><div class="book-cover" style="background:'+b.cover_color+';"><div class="book-cover-sheen"></div><div class="book-cat" style="color:'+b.accent_color+';border-color:'+b.accent_color+';">'+b.category_label+'</div><div class="book-title book-title-lg">'+tl+'</div><div class="book-rule" style="background:'+b.accent_color+';"></div><div class="book-sub book-sub-readable">'+sub+'</div><div style="flex:1;"></div><div class="book-brand book-brand-bottom"><div class="book-brand-rule" style="background:'+b.accent_color+';"></div><div class="book-brand-name">\uD83E\uDDED\u00A0 No Spin Media Pick</div><div class="book-brand-sub">'+randSupport()+'</div></div></div></div></a>'}
function gearTileHTML(g){const tLen=(g.title||'').replace(/\\n/g,'').length;const tSize=tLen<=6?38:tLen<=8?32:tLen<=10?28:tLen<=13?24:20;const tl=(g.title||'').split('\\n').map(l=>'<div>'+l+'</div>').join('');const sub=(g.subtitle||'').split('\\n').map(l=>'<div>'+l+'</div>').join('');return'<a href="'+g.url+'" target="_blank" rel="noopener nofollow sponsored" class="aff-card aff-card-gear" title="Recommended gear \u2014 supports NSM at no extra cost"><div class="gear-card-wrap"><div class="gear-sheen"></div><div class="gear-inner-border"></div><div class="gear-clip-t"></div><div class="gear-clip-b"></div><div class="gear-clip-l"></div><div class="gear-clip-r"></div><div class="gear-content"><div class="gear-cat">'+(g.category_label||'')+'</div><div class="gear-title" style="font-size:'+tSize+'px;">'+tl+'</div><div class="gear-icon">'+(g.icon||'\u2699\uFE0F')+'</div><div class="gear-rule"></div><div class="gear-sub">'+sub+'</div></div><div class="gear-brand gear-brand-bottom"><div class="gear-brand-rule"></div><div class="gear-brand-name">\uD83E\uDDED\u00A0 No Spin Media Pick</div><div class="gear-brand-sub">'+randSupport()+'</div></div></div></a>'}

async function loadAllAffiliateTiles(matchedRule){
  if(window.AMAZON_AFFILIATES_ENABLED!==true)return;
  const data=await loadAffiliateData();
  /* Filter out hidden items at the source */
  const bookItems=(data.books?.items||[]).filter(i=>i.must_show!=='hide');
  const gearItems=(data.gear?.items||[]).filter(i=>i.must_show!=='hide');
  const bookEl=document.getElementById('book-tiles');
  if(bookEl){let html='';if(matchedRule?.books)html+='<div style="margin-bottom:12px;">'+bookTileHTML(matchedRule.books)+'</div>';pickItems(bookItems,matchedRule?.books?2:3).forEach(item=>{html+='<div style="margin-bottom:12px;">'+renderTileHTML(item)+'</div>'});bookEl.innerHTML=html}
  const gearEl=document.getElementById('gear-tiles');
  if(gearEl){let html='';if(matchedRule?.gear)html+='<div style="margin-bottom:12px;">'+gearTileHTML(matchedRule.gear)+'</div>';pickItems(gearItems,matchedRule?.gear?2:3).forEach(item=>{html+='<div style="margin-bottom:12px;">'+renderTileHTML(item)+'</div>'});gearEl.innerHTML=html}
  let bHTML='',gHTML='';
  if(matchedRule?.books)bHTML='<div style="border-radius:8px;overflow:hidden;">'+bookTileHTML(matchedRule.books)+'</div>';
  else{const mb=pickOneMobile(bookItems);if(mb)bHTML='<a href="'+getRandomLink(mb)+'" target="_blank" rel="noopener nofollow sponsored"><img src="/affiliate/'+mb.image+'" alt="'+mb.title+'" loading="lazy" style="width:100%;display:block;border-radius:8px;"></a>'}
  if(matchedRule?.gear)gHTML='<div style="border-radius:8px;overflow:hidden;">'+gearTileHTML(matchedRule.gear)+'</div>';
  else{const mg=pickOneMobile(gearItems);if(mg)gHTML='<a href="'+getRandomLink(mg)+'" target="_blank" rel="noopener nofollow sponsored"><img src="/affiliate/'+mg.image+'" alt="'+mg.title+'" loading="lazy" style="width:100%;display:block;border-radius:8px;"></a>'}
  window.mobileAffiliateHTML='<div class="mobile-aff-insert"><div class="mobile-aff-label">\uD83E\uDDED NSM Picks</div><div class="mobile-aff-grid">'+bHTML+gHTML+'</div><div class="mobile-aff-disc">Selecting an item supports independent journalism at no extra cost.</div></div>';
}

/* ── IMAGE RESOLUTION ── */
let _imgRulesCache=null;
async function resolveStoryImage(storyId){for(const ext of['webp','jpg','png']){try{const r=await fetch('/images/news/'+storyId+'.'+ext,{method:'HEAD'});if(r.ok)return'/images/news/'+storyId+'.'+ext}catch(e){}}return null}
async function resolveFallbackImage(headline){try{if(!_imgRulesCache){const r=await fetch('/images/news/image-rules.json');if(r.ok)_imgRulesCache=await r.json()}if(_imgRulesCache){const h=(headline||'').toLowerCase();for(const rule of(_imgRulesCache.keywords||[])){if(rule.match.some(kw=>{const esc=kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?<![a-z])'+esc+'(?![a-z])','i').test(h)}))return'/images/news/'+rule.image}}}catch(e){}return null}
async function fetchImageMeta(p){try{const r=await fetch(p.replace(/\.[^.]+$/,'.json'));if(r.ok)return await r.json()}catch(e){}return null}
async function getStoryImage(id,headline){const si=await resolveStoryImage(id);if(si)return{url:si,meta:await fetchImageMeta(si)};const fi=await resolveFallbackImage(headline);if(fi)return{url:fi,meta:await fetchImageMeta(fi)};return null}

/* ── REACTIONS ── */
const REACTIONS=[
  {key:'helpful',  emoji:'👍',label:'Helpful'},
  {key:'thinking', emoji:'🤔',label:'Makes me think'},
  {key:'surprised',emoji:'😮',label:'Unexpected'},
  {key:'concerning',emoji:'⚠️',label:'Concerning'},
  {key:'important',emoji:'📌',label:'Important'}
];

async function loadReactions(storyId){
  try{
    const res=await fetch(SB_REACTIONS+'?story_id=eq.'+storyId+'&select=helpful,thinking,surprised,concerning,important,story_page_reactions,summary_page_reactions,reddit_seed,reddit_comments',{headers:{apikey:SB_KEY}});
    const data=await res.json();return(data&&data[0])?data[0]:null;
  }catch(e){return null}
}
async function upsertReaction(storyId,field,delta,source){
  const cur=await loadReactions(storyId);
  const current=cur?(cur[field]||0):0;const newVal=Math.max(0,current+delta);
  const payload={story_id:storyId,helpful:0,thinking:0,surprised:0,concerning:0,important:0,story_page_reactions:0,summary_page_reactions:0,reddit_seed:0,reddit_comments:0};
  if(cur)Object.assign(payload,cur);payload[field]=newVal;
  if(source==='story')payload.story_page_reactions=Math.max(0,(payload.story_page_reactions||0)+delta);
  const res=await fetch(SB_REACTIONS,{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify(payload)});
  if(!res.ok)throw new Error('Supabase write failed: '+res.status);
  return newVal;
}
function getStoredReaction(storyId){return localStorage.getItem('reaction_'+storyId)||null}
function setStoredReaction(storyId,key){if(key)localStorage.setItem('reaction_'+storyId,key);else localStorage.removeItem('reaction_'+storyId)}

function commentsItemHTML(totals,redditLink){
  const comments=(totals&&totals.reddit_comments)||0;
  if(comments===0)return'';
  const divider='<span class="reaction-grid-divider"></span>';
  return divider+(redditLink
    ?'<a href="'+redditLink+'" target="_blank" rel="noopener" class="reaction-btn reddit-comment-link" id="reddit-comment-btn" title="Join discussion on Reddit">'
      +'<span class="reaction-emoji">💬</span><span class="reaction-count" id="reddit-comment-count">'+comments+'</span></a>'
    :'<span class="reaction-btn reddit-static" id="reddit-comment-btn">'
      +'<span class="reaction-emoji">💬</span><span class="reaction-count" id="reddit-comment-count">'+comments+'</span></span>');
}

function updateRedditDisplay(seed,comments,helpful){
  const helpfulBtn=document.querySelector('.reaction-btn[data-key="helpful"] .reaction-count');
  if(helpfulBtn)helpfulBtn.textContent=((helpful||0)+(seed||0))||'';
  const cmEl=document.getElementById('reddit-comment-count');
  if(cmEl)cmEl.textContent=(comments||0)>0?(comments||0):'';
}

function reactionsHTML(storyId,totals,selected,redditLink){
  window._redditSeed=(totals&&totals.reddit_seed)||0;
  const cmHTML=commentsItemHTML(totals,redditLink);
  const items=REACTIONS.map(r=>{
    let count=totals?(totals[r.key]||0):0;
    if(r.key==='helpful')count=count+(window._redditSeed||0);
    const isSel=selected===r.key;
    return'<button class="reaction-btn'+(isSel?' selected':'')+'" data-key="'+r.key+'" title="'+r.label+'" aria-label="'+r.label+'" onclick="handleReaction(\''+storyId+'\',\''+r.key+'\')">'
      +'<span class="reaction-emoji">'+r.emoji+'</span>'
      +'<span class="reaction-count">'+(count>0?count:'')+'</span>'
      +'</button>';
  }).join('');
  return'<div class="reactions-card">'
    +'<div class="reactions-label">\uD83E\uDDED HOW NSM READERS REACTED TO THIS STORY</div>'
    +'<div class="reactions-grid" id="reactions-grid">'+items+cmHTML+'</div>'
    +'</div>';
}

async function handleReaction(storyId,key){
  const prev=getStoredReaction(storyId);const isSame=prev===key;
  const grid=document.getElementById('reactions-grid');if(!grid)return;
  const snapshot={};
  grid.querySelectorAll('.reaction-btn[data-key]').forEach(btn=>{snapshot[btn.dataset.key]={count:parseInt(btn.querySelector('.reaction-count').textContent)||0,selected:btn.classList.contains('selected')}});
  const deltas={};if(isSame){deltas[key]=-1}else{if(prev)deltas[prev]=-1;deltas[key]=1}
  grid.querySelectorAll('.reaction-btn[data-key]').forEach(btn=>{
    const k=btn.dataset.key;const countEl=btn.querySelector('.reaction-count');const cur=parseInt(countEl.textContent)||0;
    if(deltas[k]){const next=Math.max(0,cur+deltas[k]);countEl.textContent=next>0?next:''}
    if(isSame)btn.classList.remove('selected');else btn.classList.toggle('selected',k===key);
  });
  setStoredReaction(storyId,isSame?null:key);
  try{
    if(isSame)await upsertReaction(storyId,key,-1,'story');
    else{if(prev)await upsertReaction(storyId,prev,-1,'story');await upsertReaction(storyId,key,1,'story')}
    const fresh=await loadReactions(storyId);
    if(fresh)updateRedditDisplay(fresh.reddit_seed,fresh.reddit_comments,fresh.helpful);
  }catch(e){
    grid.querySelectorAll('.reaction-btn[data-key]').forEach(btn=>{const k=btn.dataset.key;const countEl=btn.querySelector('.reaction-count');countEl.textContent=snapshot[k].count>0?snapshot[k].count:'';btn.classList.toggle('selected',snapshot[k].selected)});
    setStoredReaction(storyId,prev);
  }
}

/* ── REDDIT ADMIN PANEL ── */
function parseRedditPaste(raw){
  if(!raw||!raw.trim())return null;
  const nums=raw.match(/\d+/g);if(!nums||!nums.length)return null;
  return{seed:parseInt(nums[0])||0,comments:nums.length>=2?parseInt(nums[1])||0:0};
}
async function saveRedditStats(){
  const storyId=nsmStoryParam();if(!storyId)return;
  const textarea=document.getElementById('reddit-paste-input');
  const statusEl=document.getElementById('radmin-status');
  const saveBtn=document.getElementById('radmin-save-btn');
  const parsed=parseRedditPaste(textarea.value);
  if(!parsed){statusEl.className='radmin-status err';statusEl.textContent='No numbers found — check paste';return}
  saveBtn.disabled=true;statusEl.className='radmin-status';statusEl.textContent='Saving…';
  try{
    const cur=await loadReactions(storyId);
    const payload={story_id:storyId,helpful:0,thinking:0,surprised:0,concerning:0,important:0,story_page_reactions:0,summary_page_reactions:0,reddit_seed:0,reddit_comments:0};
    if(cur)Object.assign(payload,cur);
    payload.reddit_seed=parsed.seed;payload.reddit_comments=parsed.comments;
    const res=await fetch(SB_REACTIONS,{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify(payload)});
    if(!res.ok)throw new Error('HTTP '+res.status);
    updateRedditDisplay(parsed.seed,parsed.comments,payload.helpful);
    statusEl.className='radmin-status ok';
    statusEl.textContent='✅ Saved — 👍 '+(payload.helpful+parsed.seed)+' 💬 '+parsed.comments;
    updateAdminPreview();
  }catch(e){statusEl.className='radmin-status err';statusEl.textContent='Error: '+e.message}
  finally{saveBtn.disabled=false}
}
function updateAdminPreview(){
  const textarea=document.getElementById('reddit-paste-input');const previewEl=document.getElementById('radmin-preview');
  if(!textarea||!previewEl)return;
  const parsed=parseRedditPaste(textarea.value);
  if(!parsed){previewEl.innerHTML='<span style="color:#bbb;">Paste Reddit stats above</span>';return}
  previewEl.innerHTML='reddit_seed = <span>'+parsed.seed+'</span> &nbsp;·&nbsp; reddit_comments = <span>'+parsed.comments+'</span>';
}
function showAdminPanel(){const panel=document.getElementById('reddit-admin-panel');if(!panel)return;panel.classList.add('open');setTimeout(()=>{const t=document.getElementById('reddit-paste-input');if(t)t.focus()},50)}
function hideAdminPanel(){const panel=document.getElementById('reddit-admin-panel');if(panel)panel.classList.remove('open');const s=document.getElementById('radmin-status');if(s)s.textContent=''}
function toggleAdminPanel(){const panel=document.getElementById('reddit-admin-panel');if(panel&&panel.classList.contains('open'))hideAdminPanel();else showAdminPanel()}

/* ── SHARE ── */
function _copyToClipboard(text,msg){const fb=document.getElementById('share-feedback');const done=()=>{if(fb){fb.textContent=msg;setTimeout(()=>fb.textContent='',2500)}};navigator.clipboard.writeText(text).then(done).catch(()=>{const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;top:0;left:-9999px';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);done()})}
function _closeShare(){const w=document.getElementById('share-wrap');if(w)w.classList.remove('open')}
function toggleShareMenu(){const w=document.getElementById('share-wrap');w.classList.toggle('open');if(w.classList.contains('open')){setTimeout(()=>{document.addEventListener('click',function h(e){if(!w.contains(e.target)){w.classList.remove('open');document.removeEventListener('click',h)}})},0)}}
function copyLinkOnly(){_closeShare();_copyToClipboard(window._storyUrl||location.href,'\u2705 Link copied!')}
function copyWithTitle(){_closeShare();const hl=(window._storyHeadline||'').replace(/\n/g,': ').trim();_copyToClipboard(hl+'\n'+(window._storyUrl||location.href),'\u2705 Copied with headline!')}
function copyWithSummary(){_closeShare();const s=window._storyData||{};const opts=[s.social_bluesky,s.social_threads,s.social_facebook].filter(x=>x&&x.trim().length>20);const summary=opts.length?opts[Math.floor(Math.random()*opts.length)]:(s.summary||'').split('\n\n')[0].replace(/\\n/g,' ').replace(/\*\*(.*?)\*\*/g,'$1').substring(0,280);_copyToClipboard(summary.trim()+'\n\n'+(window._storyUrl||location.href),'\u2705 Copied with summary!')}
function nativeShare(){if(navigator.share)navigator.share({title:window._storyHeadline||'No Spin Media',url:window._storyUrl||location.href}).catch(()=>{});else copyLinkOnly()}
function convertMarkdown(text){if(!text)return'';text=text.replace(/\\n\\n/g,'\n\n').replace(/\\n/g,'\n');text=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');text=text.replace(/(?<!\*)\*(?!\s)([^*]+?)\*(?!\*)/g,'<em>$1</em>');return text}

/* Story summaries are stored as markdown (**bold**, *italic*, # headings,
   literal \n). Plain-text version for <meta> descriptions only -- the
   visible article still renders through convertMarkdown(). (2026-10-03) */
function markdownToPlain(t){return(t||'').replace(/\\n/g,'\n').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/^[ \t]*#{1,6}[ \t]+/gm,'').replace(/(\*\*|__)(.+?)\1/g,'$2').replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\*)/g,'$1$2').replace(/`([^`]+)`/g,'$1').replace(/\*{2,}/g,'').replace(/\s+/g,' ').trim()}
/* ── SEARCH METADATA (2026-10-03) ──
   After the story loads: <title>, meta description, self-referencing
   canonical, and NewsArticle JSON-LD. Each element is found-or-created
   (never appended twice) and fully overwritten, so re-running this for
   another story can't leave duplicates or a previous story's values.
   datePublished is Supabase posted_at, never the displayed "1h ago" text.
   Open Graph/Twitter tags are still set separately, unchanged. */
function nsmHeadEl(selector,create){let el=document.head.querySelector(selector);if(!el){el=create();document.head.appendChild(el)}return el}
/* ── VISIBLE PUBLISH TIME (2026-10-xx) ──
   Absolute date + time in Eastern Time inside <time datetime>, so readers
   and Google see the same publication moment the JSON-LD declares. */
function nsmPubTime(iso){const d=iso?new Date(iso):null;if(!d||isNaN(d))return'';const txt=d.toLocaleString('en-US',{timeZone:'America/New_York',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})+' ET';return'Published <time datetime="'+d.toISOString()+'">'+txt+'</time>'}
function setStorySearchMetadata(s,page,section,imageUrl){
  const strip=t=>(t||'').replace(/^[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}‍️\s]+|[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}‍️\s]+$/gu,'').trim();
  const hl=(s.headline||'').trim();const nl=hl.indexOf('\n');
  const headline=strip(nl>-1?hl.substring(0,nl):hl)||'Story';
  const subhead=strip(nl>-1?hl.substring(nl+1):'');
  const plain=markdownToPlain(s.summary);
  let desc=plain||subhead||headline+'. Independent news from No Spin Media.';
  if(desc.length>160){const cut=desc.substring(0,157);const sp=cut.lastIndexOf(' ');desc=(sp>100?cut.substring(0,sp):cut).replace(/[\s,;:.\-–—]+$/,'')+'…'}
  const canonical=s._canonical||(window.NSM_STATIC_URL?'https://nospin.media'+window.NSM_STATIC_URL:'https://nospin.media/'+page+'?story='+encodeURIComponent(s.url));
  document.title=headline+' | No Spin Media';
  nsmHeadEl('meta[name="description"]',()=>{const m=document.createElement('meta');m.setAttribute('name','description');return m}).setAttribute('content',desc);
  nsmHeadEl('link[rel="canonical"]',()=>{const l=document.createElement('link');l.setAttribute('rel','canonical');return l}).setAttribute('href',canonical);
  nsmHeadEl('meta[property="og:url"]',()=>{const m=document.createElement('meta');m.setAttribute('property','og:url');return m}).setAttribute('content',canonical);
  const org={'@type':'Organization','name':'No Spin Media','url':'https://nospin.media/',
    'logo':{'@type':'ImageObject','url':'https://nospin.media/images/NSM-Logo.png','width':1024,'height':1024}};
  const ld={'@context':'https://schema.org','@type':'NewsArticle','headline':headline.substring(0,110),
    'description':desc,'url':canonical,'mainEntityOfPage':{'@type':'WebPage','@id':canonical},
    'inLanguage':'en-US','isAccessibleForFree':true,
    'author':{'@type':'Organization','name':'No Spin Media Newsroom','url':'https://nospin.media/editorial-standards.html'},
    'publisher':Object.assign({},org,{'publishingPrinciples':'https://nospin.media/editorial-standards.html'})};
  const published=s.posted_at?new Date(s.posted_at):null;
  if(published&&!isNaN(published)){ld.datePublished=published.toISOString();ld.dateModified=ld.datePublished}
  if(section)ld.articleSection=section;
  if(imageUrl){try{ld.image=[new URL(imageUrl,'https://nospin.media/').href]}catch(e){}}
  else{ld.image=['https://data.nospin.media/preview-image/'+encodeURIComponent(s.url)+'.webp'+(page==='ne_story.html'?'?source=ne':'')]}
  if(Array.isArray(s.tags)&&s.tags.length)ld.keywords=s.tags.filter(t=>typeof t==='string').join(', ');
  const sc=nsmHeadEl('script#nsm-article-jsonld',()=>{const x=document.createElement('script');x.type='application/ld+json';x.id='nsm-article-jsonld';return x});
  sc.textContent=JSON.stringify(ld);
}

/* ── NOT-FOUND NOINDEX (2026-10-08) ──
   GitHub Pages returns 200 for every ?story= value, so a missing story is a
   soft 404 unless the page itself says noindex. Called only on a definitive
   miss: no ?story= param, Supabase answered 200 with zero rows, or 400 (a
   malformed id). A network error or 5xx is treated as transient and leaves
   the page indexable, so a Supabase outage can't noindex real stories. */
/* Remove the early canonical when the story can't be shown (missing, invalid
   or failed to load), so it never points at a nonexistent article. (2026-10-15) */
function nsmDropCanonical(){document.head.querySelectorAll('link[rel="canonical"],meta[property="og:url"]').forEach(el=>el.remove())}
function nsmMarkNotFound(label){
  nsmHeadEl('meta[name="robots"]',()=>{const m=document.createElement('meta');m.setAttribute('name','robots');return m}).setAttribute('content','noindex');
  document.title=label+' not found | No Spin Media';
}

/* ── STATIC PAGE (2026-10-22) ──
   On /new-england/<id>.html the generator (~/nsm_sitemap) embeds this story's public
   fields as #nsm-static-story. The page then renders from them instead of
   fetching Supabase -- same code path, same result as ne_story.html?story=<id>. */
function nsmStaticStory(){if(nsmStaticStory._v!==undefined)return nsmStaticStory._v;let v=null;const el=document.getElementById('nsm-static-story');if(el){try{v=JSON.parse(el.textContent)}catch(e){}}return nsmStaticStory._v=v}
function nsmStoryParam(){const st=nsmStaticStory();return st?st.url:new URLSearchParams(location.search).get('story')}
/* ── MAIN STORY LOADER ── */
async function loadStory(){
  const storyId=nsmStoryParam();
  if(!storyId){document.getElementById('story-container').innerHTML='<p style="padding:2rem;color:#999;">Story not found.</p>';nsmMarkNotFound('Story');return}
  const st=nsmStaticStory();
  const res=st?{ok:true,status:200}:await fetch('https://dckmflnbprhmaqysuued.supabase.co/rest/v1/news_ne?select=*&url=eq.'+storyId,{headers:{apikey:SB_KEY}});
  const data=st?[st]:await res.json();
  if(!data.length){document.getElementById('story-container').innerHTML='<p style="padding:2rem;color:#999;">Story not found.</p>';nsmDropCanonical();if((res.ok&&Array.isArray(data))||res.status===400)nsmMarkNotFound('Story');return}
  const s=data[0];
  window._storyData=s;
  s._topic=neInferTopic(s);const topic=s._topic;
  /* Search metadata right after retrieval (2026-10-15), before the affiliate,
     reactions and image lookups, so a failure there can't leave the page
     without title/canonical/og:url/JSON-LD. Re-run below once the hero image is known. */
  try{setStorySearchMetadata(s,'ne_story.html','New England')}catch(e){console.warn('search metadata failed',e)}
  const kwData=await loadKeywordAffiliateData();
  const matchedRule=findKeywordMatch([s.headline||'',s.summary||''].join(' '),kwData.rules||[]);
  const [,reactTotals]=await Promise.all([loadAllAffiliateTiles(matchedRule),loadReactions(storyId)]);
  const storedReaction=getStoredReaction(storyId);
  document.querySelector('meta[property="og:title"]').setAttribute('content',(s.headline||'').replace('\n',' '));
  document.querySelector('meta[property="og:description"]').setAttribute('content',markdownToPlain(s.summary).substring(0,180));
  document.querySelector('meta[name="twitter:title"]').setAttribute('content',(s.headline||'').replace('\n',' '));
  document.querySelector('meta[name="twitter:description"]').setAttribute('content',markdownToPlain(s.summary).substring(0,180));
  window._storyHeadline=s.headline;
  // Rich /preview/ URL, same mechanism story.html already uses for
  // National (see PREVIEW_SOURCES in app.py) -- the four share functions
  // below (copyLinkOnly/copyWithTitle/copyWithSummary/nativeShare) already
  // just consume window._storyUrl, unchanged.
  window._storyUrl='https://data.nospin.media/preview/'+storyId+'?source=ne';
  const hl=(s.headline||'').trim();const nl=hl.indexOf('\n');
  const line1=nl>-1?hl.substring(0,nl).trim():hl;const line2=nl>-1?hl.substring(nl+1).trim():'';
  const topicBg=NE_TOPIC_BG[topic]||NE_TOPIC_BG.newengland;
  const topicLabel=NE_TOPIC_LABELS[topic]||'New England';
  const pillCls='story-pill tp-'+(topic||'newengland');
  const imgResult=await getStoryImage(storyId,s.headline);
  if(imgResult&&imgResult.url){try{setStorySearchMetadata(s,'ne_story.html','New England',imgResult.url)}catch(e){console.warn('search metadata failed',e)}}
  let heroBgStyle=imgResult?'background-image:url(\''+imgResult.url+'\');background-size:cover;background-position:center;':'background:'+topicBg+';';
  let captionHTML='';
  if(imgResult){const meta=imgResult.meta;let cap='',cred='';if(meta){cap=meta.caption||'';cred=meta.credit||''}else if(s.image_caption){const pts=s.image_caption.split(/\nCredit:/i);cap=pts[0].trim();if(pts[1])cred=pts[1].trim()}if(cap||cred)captionHTML='<div class="story-img-caption">'+cap+(cred?'<span class="story-img-credit">Credit: '+cred+'</span>':'')+'</div>'}
  function timeSince(ds){if(!ds)return'';const d=new Date(ds);if(isNaN(d))return'';const m=Math.floor((Date.now()-d)/60000);if(m<2)return'Just now';if(m<60)return m+'m ago';if(m<1440)return Math.floor(m/60)+'h ago';if(m<2880)return'Yesterday';if(m<10080)return Math.floor(m/1440)+'d ago';return d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
  const dateStr=timeSince(s.posted_at);
  const cleanText=convertMarkdown(s.summary||'');const paras=cleanText.split('\n\n');
  let bodyParas=[],discussionQ='';
  for(const p of paras){if(p.trim().endsWith('?')&&paras.indexOf(p)===paras.length-1)discussionQ=p.trim();else bodyParas.push(p)}
  const bodyHTML=bodyParas.map(p=>'<p>'+p+'</p>').join('');
  let redditLink='';
  if(s.reddit_post_id){try{const parsed=JSON.parse(s.reddit_post_id);if(parsed.jquery?.[10]?.[3]?.[0])redditLink=parsed.jquery[10][3][0]}catch(e){console.warn('Reddit parse failed')}}
  const back=resolveBackLink();
  document.getElementById('story-container').innerHTML=
    '<a href="'+back.href+'" class="back-link">\u2190 '+back.label+'</a>'
    +'<div class="story-header">'
    +'<div class="story-hero-img" style="background:'+topicBg+';">'
    +'<div class="story-hero-bg" style="'+heroBgStyle+'"></div>'
    +'<div class="story-hero-scrim"></div>'
    +'<div class="story-hero-content">'
    +'<span class="story-topic-pill">'+topicLabel+'</span><br>'
    +'<h1 class="story-hl"><span class="story-hl-line1">'+line1+'</span>'+(line2?'<span class="story-hl-line2">'+line2+'</span>':'')+'</h1>'
    +'</div></div>'
    +captionHTML
    +'<div class="story-meta-row"><div class="story-meta-left">'
    +'<span class="'+pillCls+'">'+topicLabel+'</span>'+(dateStr?'<span class="story-date">'+dateStr+'</span>':'')
    +'<span class="story-byline">By <a class="byline-link" href="/editorial-standards.html">No Spin Media Newsroom</a>'+(s.posted_at?' · '+nsmPubTime(s.posted_at):'')+'</span>'
    +'</div></div></div>'
    +'<div class="story-body-card"><div class="story-content">'+bodyHTML+'</div>'
    +(discussionQ?'<div class="discussion-label">Community Discussion</div><div class="story-discussion">\uD83D\uDCAC '+discussionQ+'</div>':'')
    +'</div>'
    +reactionsHTML(storyId,reactTotals,storedReaction,redditLink)
    +'<div class="story-actions-card">'
    +(redditLink?'<a href="'+redditLink+'" target="_blank" rel="noopener" class="action-btn action-btn-reddit">Join the discussion on Reddit \u2192</a>':'')
    +'<a href="https://reddit.com/r/NewEnglandContext" target="_blank" rel="noopener" class="action-btn action-btn-secondary">r/NewEnglandContext</a>'
    +'<div class="share-wrap" id="share-wrap">'
    +'<button class="action-btn action-btn-secondary" onclick="toggleShareMenu()">\uD83D\uDD17 Share \u25BE</button>'
    +'<div class="share-dropdown">'
    +'<button onclick="nativeShare()"><span class="share-opt-label">\uD83D\uDCF1 Share</span><span class="share-opt-desc">Native share / copy link</span></button>'
    +'<button onclick="copyLinkOnly()"><span class="share-opt-label">\uD83D\uDD17 Copy link</span><span class="share-opt-desc">Just the URL</span></button>'
    +'<button onclick="copyWithTitle()"><span class="share-opt-label">\uD83D\uDCCB Copy with headline</span><span class="share-opt-desc">Headline + link</span></button>'
    +'<button onclick="copyWithSummary()"><span class="share-opt-label">\uD83D\uDCDD Copy with summary</span><span class="share-opt-desc">Story summary + link</span></button>'
    +'</div></div>'
    +'<span class="share-feedback" id="share-feedback"></span>'
    +'</div>';
  if(window.innerWidth<=900&&window.mobileAffiliateHTML){const div=document.createElement('div');div.innerHTML=window.mobileAffiliateHTML;document.getElementById('story-container').appendChild(div.firstElementChild)}
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded',()=>{
  document.body.insertAdjacentHTML('beforeend',
    '<div id="reddit-admin-panel">'
    +'<div class="radmin-header"><span class="radmin-title">📋 Reddit Stats</span><button class="radmin-close" onclick="hideAdminPanel()" title="Close">✕</button></div>'
    +'<label class="radmin-label" for="reddit-paste-input">Paste Reddit mobile snippet:</label>'
    +'<textarea id="reddit-paste-input" placeholder="Upvote 26\nDownvote 9\nGo to comments" oninput="updateAdminPreview()"></textarea>'
    +'<div class="radmin-preview" id="radmin-preview"><span style="color:#bbb;">Paste Reddit stats above</span></div>'
    +'<div class="radmin-actions"><button class="radmin-save" id="radmin-save-btn" onclick="saveRedditStats()">Save</button><span class="radmin-status" id="radmin-status"></span></div>'
    +'<div class="radmin-hint">Click 🧭 in footer &nbsp;·&nbsp; Overwrites existing values</div>'
    +'</div>'
  );
  fetch('header.html').then(r=>r.text()).then(html=>{
    document.getElementById('site-header').innerHTML=html;
    const ham=document.getElementById('hamburger'),nav=document.getElementById('mobile-nav');
    if(ham&&nav){ham.onclick=()=>{nav.classList.toggle('open');ham.classList.toggle('active')};nav.querySelectorAll('a').forEach(a=>{a.onclick=()=>{nav.classList.remove('open');ham.classList.remove('active')}})}
    loadStory().catch(e=>{if(!window._storyData)nsmDropCanonical();throw e});
  });
});
