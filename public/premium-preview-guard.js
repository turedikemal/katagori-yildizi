/* Kategori Yildizi — premium preview guard v1
   Keeps premium template previews readable, distinct and stable without replaying DOM animations. */
(function(){
'use strict';
if(window.__KY_PREMIUM_PREVIEW_GUARD_V1__)return;
window.__KY_PREMIUM_PREVIEW_GUARD_V1__=true;

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
 ,'premium-elite-obsidian':{bg:'#111216',text:'#fffdf7',accent:'#d9b45b'}
 ,'premium-elite-sapphire-glass':{bg:'#0b2f6b',text:'#ffffff',accent:'#63d8ff'}
 ,'premium-elite-platinum':{bg:'#d7dbe1',text:'#18233f',accent:'#ffffff'}
 ,'premium-elite-emerald':{bg:'#064d42',text:'#ffffff',accent:'#75e0bd'}
 ,'premium-elite-ruby':{bg:'#7d1328',text:'#ffffff',accent:'#f1a6a2'}
 ,'premium-elite-marble':{bg:'#f4f0e7',text:'#2a3247',accent:'#b99b62'}
 ,'premium-elite-carbon':{bg:'#20242c',text:'#ffffff',accent:'#6ca8ff'}
 ,'premium-elite-champagne-silk':{bg:'#e8d7b4',text:'#4b3822',accent:'#fff7e5'}
 ,'premium-elite-midnight-chrome':{bg:'#101a33',text:'#ffffff',accent:'#9eb7e7'}
 ,'premium-elite-amethyst':{bg:'#4d236d',text:'#ffffff',accent:'#d5a8ff'}
 ,'premium-elite-titanium':{bg:'#414952',text:'#ffffff',accent:'#73e2d1'}
 ,'premium-elite-onyx-rose':{bg:'#181419',text:'#ffffff',accent:'#d69b9b'}
 ,'premium-elite-pearl-lustre':{bg:'#f5f3f5',text:'#3e344b',accent:'#b598d1'}
 ,'premium-elite-cobalt':{bg:'#1439a1',text:'#ffffff',accent:'#dbe7ff'}
 ,'premium-elite-bronze':{bg:'#5a3525',text:'#ffffff',accent:'#cf9b63'}
 ,'premium-elite-arctic':{bg:'#e9f3f6',text:'#214454',accent:'#77bfd4'}
 ,'premium-elite-forest':{bg:'#243d2d',text:'#ffffff',accent:'#c1a36d'}
 ,'premium-elite-bordeaux':{bg:'#641e32',text:'#ffffff',accent:'#e1b28f'}
 ,'premium-elite-porcelain-blue':{bg:'#f5f7fb',text:'#203f79',accent:'#668ecf'}
 ,'premium-elite-aurora-black':{bg:'#101318',text:'#ffffff',accent:'#7ee7d7'}
 ,'premium-elite-signature-ivory':{bg:'#f7f3e9',text:'#54462f',accent:'#b28a3f'}
 ,'premium-elite-bevel-silver':{bg:'#c8cbd0',text:'#20242b',accent:'#6f747c'}
 ,'premium-elite-botanical-marble':{bg:'#f5f5f0',text:'#365725',accent:'#7a9a58'}
 ,'premium-elite-ribbon-crimson':{bg:'#8f1724',text:'#fff7f1',accent:'#d9a0a4'}
 ,'premium-elite-carved-walnut':{bg:'#704427',text:'#fff0cc',accent:'#b57a45'}
 ,'premium-elite-resin-glass':{bg:'#dce5eb',text:'#48515a',accent:'#ffffff'}
 ,'premium-elite-embossed-leather':{bg:'#222326',text:'#d8d0c4',accent:'#77716a'}
 ,'premium-elite-etched-copper':{bg:'#b96f4f',text:'#4a2117',accent:'#e8aa83'}
 ,'premium-elite-origami-white':{bg:'#f6f6f4',text:'#32363d',accent:'#c9ccd0'}
 ,'premium-elite-diamond-mirror':{bg:'#e5e7e8',text:'#171a1e',accent:'#ffffff'}
 ,'premium-elite-concrete-inlay':{bg:'#b8b8b3',text:'#343431',accent:'#e5ded2'}
 ,'premium-elite-woven-royal':{bg:'#173e92',text:'#ffe6a5',accent:'#d8a439'}
 ,'premium-elite-gunmetal-port':{bg:'#555b5f',text:'#f5f5f2',accent:'#a7adb0'}
 ,'premium-elite-organic-stone':{bg:'#d8c3a5',text:'#634f37',accent:'#a9845d'}
 ,'premium-elite-puzzle-alloy':{bg:'#b6b5b2',text:'#25282c',accent:'#d49b73'}
 ,'premium-elite-minimal-frame':{bg:'#ffffff',text:'#16191e',accent:'#16191e'}
 ,'premium-elite-lenticular':{bg:'#e5e4ed',text:'#2d3139',accent:'#b9d9da'}
 ,'premium-elite-layered-edge':{bg:'#c8b8a0',text:'#3e3428',accent:'#eee4d2'}
 ,'premium-elite-diamond-cut':{bg:'#f5f4ef',text:'#2d3238',accent:'#aadbea'}
 ,'premium-elite-wood-glass':{bg:'#d8e4e5',text:'#3e4d4c',accent:'#8a5635'}
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
 #stageCanvas .ky-v3-badge[class*="tpl-premium-"]::before,
 #stageCanvas .ky-v3-badge[class*="tpl-premium-"]::after,
 #v3Templates .ky-v3-badge[class*="tpl-premium-"]::before,
 #v3Templates .ky-v3-badge[class*="tpl-premium-"]::after{pointer-events:none!important}
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
