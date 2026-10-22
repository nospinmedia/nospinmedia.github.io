/* Static article links (2026-10-22).
   Stories published since the static-page cutover live at /news/<id>.html,
   /new-england/<id>.html and /knowledge/<id>.html. The generator (~/nsm_sitemap)
   lists their IDs in static-index.json (newest 1000 per section).
   nsmArticleHref(section, id, fallback) returns the static URL for a listed ID
   and the page's own old-style link otherwise; an old link still redirects to
   the static page when one exists, so an unlisted ID is never a broken link. */
(function(){
  var sets=null;
  window.nsmArticleHref=function(section,id,fallback){
    if(sets&&sets[section]&&sets[section].has(String(id)))return'/'+section+'/'+encodeURIComponent(String(id))+'.html';
    return fallback;
  };
  try{fetch('/assets/article/static-index.json').then(function(r){return r.ok?r.json():null}).then(function(j){
    if(!j)return;var s={};['news','new-england','knowledge'].forEach(function(k){s[k]=new Set(j[k]||[])});sets=s;
  }).catch(function(){})}catch(e){}
})();
