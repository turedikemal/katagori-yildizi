/* Kategori Yildizi — premium preview guard v2
   Keeps premium template previews readable, distinct and stable. Allows new v3 effects. */
(function(){
'use strict';
if(window.__KY_PREMIUM_PREVIEW_GUARD_V2__)return;
window.__KY_PREMIUM_PREVIEW_GUARD_V2__=true;

const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const DEFAULTS={
 'premium-aurora':{bg:'#18204a',text:'#ffffff',accent:'#a855f7'},
 'premium-prism':{bg:'#16265f',text:'#ffffff',accent:'#ff3366'},
 'premium-nebula':{bg:'#171235',text:'#ffffff',accent:'#e879f9'},
 'premium-liquid':{bg:'#243a8b',text:'#ffffff',accent:'#22d3ee'},
 'premium-photon':{bg:'#0f1f4d',text:'#ffffff',accent:'#06b6d4'},
 'premium-hologram':{bg:'#f3f4ff',text:'#243a8b',accent:'#d946ef'},
 'premium-comet':{bg:'#172554',text:'#ffffff',accent:'#22d3ee'},
 'premium-spectrum':{bg:'#243a8b',text:'#ffffff',accent:'#f43f5e'},
 'premium-quantum':{bg:'#36457d',text:'#ffffff',accent:'#a78bfa'},
 'premium-electric':{bg:'#101b45',text:'#ffffff',accent:'#00f5ff'}
};
const IDS=new Set(Object.keys(DEFAULTS));
let raf=0,observer=null;

function premiumId(el){
 if(!el)return '';
 const cls=[...el.classList].find(x=>x.startsWith('tpl-premium-'));
 return cls?cls.slice(4):'';
}
function activeId(){
 const card=q('#v3Templates .ky-template-card-v3.active[data-template^="premium-"]');
 if(card&&IDS.has(card.dataset.template))return card.dataset.template;
 const badge=q('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]');
 const id=premiumId(badge);return IDS.has(id)?id:'';
}
function hex(v){return /^#[0-9a-f]{6}$/i.test(String(v||'').trim())?String(v).trim().toLowerCase():''}
function rgb(v){
 const h=hex(v);if(h)return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
 const m=String(v||'').match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)/i);return m?[+m[1],+m[2],+m[3]]:null;
}
function lum(v){const a=rgb(v);if(!a)return null;const c=a.map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function contrast(a,b){const x=lum(a),y=lum(b);if(x==null||y==null)return 99;const hi=Math.max(x,y),lo=Math.min(x,y);return (hi+.05)/(lo+.05)}
function readable(text,bg){
 if(contrast(text,bg)>=3)return text;
 return contrast('#ffffff',bg)>=contrast('#243a8b',bg)?'#ffffff':'#243a8b';
}
function editorPalette(id){
 const d=DEFAULTS[id];if(!d)return null;
 if(activeId()!==id)return d;
 const bg=hex(q('#tplBgHex')?.value)||hex(q('#tplBgPicker')?.value)||d.bg;
 const text=hex(q('#tplTextHex')?.value)||hex(q('#tplTextPicker')?.value)||d.text;
 const accent=hex(q('#tplAccentHex')?.value)||hex(q('#tplAccentPicker')?.value)||d.accent;
 return {bg,text,accent};
}
function applyVars(el,p){
 if(!el||!p)return;
 const displayText=readable(p.text,p.bg);
 for(const [name,val] of [['--badge-bg',p.bg],['--badge-text',p.text],['--badge-accent',p.accent],['--p-bg',p.bg],['--p-text',displayText],['--p-accent',p.accent]]){
  if(el.style.getPropertyValue(name)!==val)el.style.setProperty(name,val);
 }
 el.style.setProperty('color',displayText,'important');
 el.style.setProperty('transition','none','important');
 qa('.ky-badge-text',el).forEach(t=>{t.style.setProperty('color',displayText,'important');t.style.setProperty('opacity','1','important');t.style.setProperty('visibility','visible','important');});
}
function repairGallery(){
 qa('#v3Templates .ky-template-card-v3[data-template^="premium-"]').forEach(card=>{
  const id=card.dataset.template;if(!IDS.has(id))return;
  const badge=q('.ky-v3-badge',card);if(!badge)return;
  const p=editorPalette(id)||DEFAULTS[id];applyVars(badge,p);
 });
}
function repairStage(){
 const selected=activeId();
 qa('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]').forEach(b=>{
  const id=selected||premiumId(b);if(!IDS.has(id))return;
  const target='tpl-'+id;
  if(!b.classList.contains(target)){
   [...b.classList].filter(x=>x.startsWith('tpl-premium-')).forEach(x=>b.classList.remove(x));
   b.classList.add(target);
  }
  applyVars(b,editorPalette(id)||DEFAULTS[id]);
 });
}
function injectCss(){
 if(q('#kyPremiumPreviewGuardCss'))return;
 const s=document.createElement('style');s.id='kyPremiumPreviewGuardCss';s.textContent=`
 /* Disable legacy ::before (old sheen on all except Liquid). */
 #stageCanvas .ky-v3-badge[class*="tpl-premium-"]::before,
 #v3Templates .ky-v3-badge[class*="tpl-premium-"]::before{content:none!important;display:none!important;animation:none!important;background:none!important;box-shadow:none!important}

 /* Re-enable Liquid sheen on stage only. */
 #stageCanvas .ky-v3-badge.tpl-premium-liquid::before{content:""!important;display:block!important;animation:inherit!important;background:inherit!important}

 /* Disable gallery preview ::after (old effect). */
 #v3Templates .ky-premium-template-v3 .preview::after{content:none!important;display:none!important;animation:none!important}

 /* Allow new v3 effects on stage: Photon scan, Comet spark. */
 #stageCanvas .ky-v3-badge.tpl-premium-photon::after,
 #stageCanvas .ky-v3-badge.tpl-premium-comet::after{content:""!important;display:block!important;animation:inherit!important}

 /* Block old ::after effects not in v3. */
 #stageCanvas .ky-v3-badge.tpl-premium-aurora::after,
 #stageCanvas .ky-v3-badge.tpl-premium-prism::after,
 #stageCanvas .ky-v3-badge.tpl-premium-nebula::after,
 #stageCanvas .ky-v3-badge.tpl-premium-hologram::after,
 #stageCanvas .ky-v3-badge.tpl-premium-spectrum::after,
 #stageCanvas .ky-v3-badge.tpl-premium-quantum::after,
 #stageCanvas .ky-v3-badge.tpl-premium-electric::after{content:none!important;display:none!important;animation:none!important}

 /* Text and icon stability. */
 #stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-badge-text,
 #v3Templates .ky-v3-badge[class*="tpl-premium-"] .ky-badge-text{position:relative!important;z-index:5!important;opacity:1!important;visibility:visible!important;mix-blend-mode:normal!important;text-shadow:0 1px 2px rgba(0,0,0,.18)}
 #stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon,
 #stageCanvas .ky-v3-badge[class*="tpl-premium-"] svg{position:relative!important;z-index:5!important}
 `;document.head.appendChild(s);
}
function repair(){raf=0;injectCss();repairGallery();repairStage()}
function schedule(){if(raf)return;raf=requestAnimationFrame(repair)}
function bind(){
 document.addEventListener('click',e=>{if(e.target.closest('#v3Templates [data-template^="premium-"]'))requestAnimationFrame(schedule)},true);
 document.addEventListener('input',e=>{if(/^tpl(Bg|Text|Accent)(Picker|Hex)$/.test(e.target?.id||''))schedule()},true);
 document.addEventListener('change',e=>{if(/^tpl(Bg|Text|Accent)(Picker|Hex)$/.test(e.target?.id||''))schedule()},true);
 const stage=q('#stageCanvas');if(stage){observer?.disconnect();observer=new MutationObserver(rs=>{if(rs.some(r=>r.addedNodes.length||r.removedNodes.length))schedule()});observer.observe(stage,{childList:true,subtree:true});}
}
function start(){injectCss();repair();bind();setTimeout(repair,350);setTimeout(repair,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

