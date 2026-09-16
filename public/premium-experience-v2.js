/* Kategori Yildizi — Premium Experience v6 */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const PREMIUM=[
 {id:'premium-v6-maison-ribbon',name:'Maison Ribbon',bg:'#1a2a5a',text:'#ffffff',accent:'#c8a96b'},
 {id:'premium-v6-ivory-editorial',name:'Ivory Editorial',bg:'#fffbf7',text:'#2d3748',accent:'#b8956f'},
 {id:'premium-v6-signature-plate',name:'Signature Plate',bg:'#1a1a1a',text:'#f0f0f0',accent:'#c8c8c8'},
 {id:'premium-v6-atelier-seal',name:'Atelier Seal',bg:'#fffdf7',text:'#5a4a3a',accent:'#c9a55d'},
 {id:'premium-v6-couture-label',name:'Couture Label',bg:'#3a3a3a',text:'#f5f5f5',accent:'#d8b45c'},
 {id:'premium-v6-noir-prestige',name:'Noir Prestige',bg:'#1a1a1a',text:'#f0f0f0',accent:'#c8c8c8'},
 {id:'premium-v6-velvet-crest',name:'Velvet Crest',bg:'#3d1f2a',text:'#f5e8ea',accent:'#d89bb5'},
 {id:'premium-v6-emerald-signet',name:'Emerald Signet',bg:'#0d3a2a',text:'#f0f8f5',accent:'#7dd3a0'},
 {id:'premium-v6-sapphire-royal',name:'Sapphire Royal',bg:'#0f2a5a',text:'#e0f0ff',accent:'#7db4ff'},
 {id:'premium-v6-obsidian-mark',name:'Obsidian Mark',bg:'#0a0a0a',text:'#e0e0e0',accent:'#909090'},
 {id:'premium-v6-crystal-arc',name:'Crystal Arc',bg:'#f0f5ff',text:'#3a4a6a',accent:'#8ab5e8'},
 {id:'premium-v6-frosted-luxe',name:'Frosted Luxe',bg:'#f8f8fa',text:'#4a4a4a',accent:'#c8c8c8'},
 {id:'premium-v6-prism-luxe',name:'Prism Luxe',bg:'#f0e8ff',text:'#5a4a8a',accent:'#b5a0d5'},
 {id:'premium-v6-pearl-halo',name:'Pearl Halo',bg:'#fef5f0',text:'#6a5a5a',accent:'#d8b8a8'},
 {id:'premium-v6-smoke-glass',name:'Smoke Glass',bg:'#f0f5ff',text:'#4a5a7a',accent:'#a8c8e0'},
 {id:'premium-v6-heritage-emblem',name:'Heritage Emblem',bg:'#1a2a5a',text:'#f5f5f5',accent:'#d4a860'},
 {id:'premium-v6-imperial-coin',name:'Imperial Coin',bg:'#3a2810',text:'#f5e8d0',accent:'#d9a870'},
 {id:'premium-v6-monogram-tag',name:'Monogram Tag',bg:'#4a1f5a',text:'#f5e8f5',accent:'#d8b8d8'},
 {id:'premium-v6-noble-frame',name:'Noble Frame',bg:'#0d3a4a',text:'#e0f0ff',accent:'#a8d8e0'},
 {id:'premium-v6-porcelain-signature',name:'Porcelain Signature',bg:'#fefcff',text:'#0d2a6a',accent:'#8aa8e0'}
];
const PREMIUM_IDS=new Set(PREMIUM.map(x=>x.id));
const CUSTOM=[...PREMIUM];
const CUSTOM_IDS=new Set(CUSTOM.map(x=>x.id));
const palettes=Object.fromEntries(PREMIUM.map(x=>[x.id,{bg:x.bg,text:x.text,accent:x.accent}]));
let currentTemplateId='';
let wrapped=false,uiScheduled=false,previewScheduled=false,processing=false,stageObserver=null,templateObserver=null;

function linkCss(){
  if(!q('link[data-ky-premium-v6]')){const e=document.createElement('link');e.rel='stylesheet';e.href='/premium-v6-elegant.css?v=20260916-1';e.dataset.kyPremiumV6='1';document.head.appendChild(e)}
}

function applyPremiumIdentity(el,id,c){
  if(!el)return;
  const target='tpl-'+id;
  for(const cls of [...el.classList]){if(cls.startsWith('tpl-premium-')&&cls!==target)el.classList.remove(cls);}
  el.classList.add(target);
  for(const [name,value] of [['--v6-bg',c.bg],['--v6-text',c.text],['--v6-accent',c.accent]]){el.style.setProperty(name,value);}
}

function selectPremium(id){
  if(!CUSTOM_IDS.has(id))return;
  currentTemplateId=id;
  window.handleInput?.('templateId',id);
  schedulePreview();
}

function applyPreviewPremium(){
  if(processing||!CUSTOM_IDS.has(currentTemplateId))return;
  processing=true;
  try{const c=palettes[currentTemplateId];qa('#stageCanvas .ky-v3-badge').forEach(b=>applyPremiumIdentity(b,currentTemplateId,c));}finally{processing=false}
}

function schedulePreview(){if(previewScheduled)return;previewScheduled=true;requestAnimationFrame(()=>{previewScheduled=false;applyPreviewPremium()});}

function observeStage(){const stage=q('#stageCanvas');if(!stage)return;stageObserver?.disconnect();stageObserver=new MutationObserver(records=>{if(processing||!CUSTOM_IDS.has(currentTemplateId))return;if(records.some(r=>r.addedNodes?.length||r.removedNodes?.length))schedulePreview()});stageObserver.observe(stage,{childList:true,subtree:true});}

function wrapHandleInput(){
  if(wrapped||typeof window.handleInput!=='function')return;
  const original=window.handleInput;
  window.handleInput=function(path,val){
    if(path==='templateId'){currentTemplateId=String(val||'');}
    else if(/^templateColors\./.test(path)){const id=path.slice('templateColors.'.length);if(PREMIUM_IDS.has(id)&&val&&typeof val==='object')palettes[id]={...palettes[id],...val};}
    const out=original.apply(this,arguments);
    queueUi();
    if(CUSTOM_IDS.has(currentTemplateId)){schedulePreview();}
    return out;
  };
  wrapped=true;
}

function queueUi(){if(uiScheduled)return;uiScheduled=true;requestAnimationFrame(()=>{uiScheduled=false;linkCss();wrapHandleInput();observeStage();if(CUSTOM_IDS.has(currentTemplateId)){schedulePreview();}});}

function start(){linkCss();wrapHandleInput();queueUi();observeStage();setTimeout(queueUi,250);setTimeout(queueUi,900);}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
