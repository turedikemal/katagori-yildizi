/* Kategori Yildizi — premium preview guard v2
   Keeps premium template previews readable, distinct and stable. Allows new v3 effects. */
(function(){
'use strict';
if(window.__KY_PREMIUM_PREVIEW_GUARD_V2__)return;
window.__KY_PREMIUM_PREVIEW_GUARD_V2__=true;

const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const DEFAULTS={
 'premium-mercury-flow':{bg:'#0a0e27',text:'#64b5f6',accent:'#42a5f5'},
 'premium-crystal-veil':{bg:'#1a1a2e',text:'#a8d8ff',accent:'#7ec8ff'},
 'premium-eclipse-core':{bg:'#1a0033',text:'#9c27b0',accent:'#7b1fa2'},
 'premium-neon-circuit':{bg:'#0a0e1f',text:'#00ff88',accent:'#00dd77'},
 'premium-prism-cut':{bg:'#1a0f2e',text:'#ce93d8',accent:'#ba68c8'},
 'premium-frosted-atelier':{bg:'#f5f5f5',text:'#455a64',accent:'#37474f'},
 'premium-architect-frame':{bg:'#1a1a1a',text:'#bdbdbd',accent:'#9e9e9e'},
 'premium-orbit-tail':{bg:'#0d1f3e',text:'#4fc3f7',accent:'#29b6f6'},
 'premium-editorial-slab':{bg:'#fef5e7',text:'#8b4513',accent:'#6b3410'},
 'premium-voltage-cut':{bg:'#1a0a2e',text:'#ffb84d',accent:'#ff9800'}
};
const IDS=new Set(Object.keys(DEFAULTS));
const PREMIUM_TEMPLATE_MIGRATIONS={
 'premium-aurora':'premium-mercury-flow','premium-prism':'premium-crystal-veil','premium-nebula':'premium-eclipse-core',
 'premium-liquid':'premium-neon-circuit','premium-photon':'premium-prism-cut','premium-hologram':'premium-frosted-atelier',
 'premium-comet':'premium-architect-frame','premium-spectrum':'premium-orbit-tail','premium-quantum':'premium-editorial-slab',
 'premium-electric':'premium-voltage-cut'
};
let raf=0,observer=null;

function premiumId(el){
 if(!el)return '';
 const cls=[...el.classList].find(x=>x.startsWith('tpl-premium-'));
 return cls?cls.slice(4):'';
}
function activeId(){
 let card=q('#v3Templates .ky-template-card-v3.active[data-template^="premium-"]');
 if(card&&IDS.has(card.dataset.template))return card.dataset.template;
 if(card){const migrated=PREMIUM_TEMPLATE_MIGRATIONS[card.dataset.template];if(migrated&&IDS.has(migrated))return migrated;}
 let badge=q('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]');
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
 /* Text and icon stability only. */
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

