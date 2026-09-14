/* Kategori Yildizi — stable preview animation + persistence gate v4. */
(function(){
'use strict';
if(window.__KY_PREVIEW_STABILITY_FIX_V4__)return;
window.__KY_PREVIEW_STABILITY_FIX_V4__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let editTimer=0;
let playTimer=0;
let gateWatch=0;

function animationDuration(){
 const n=Number(q('#v3Duration')?.value||320);
 return Number.isFinite(n)?Math.max(100,Math.min(1600,n)):320;
}

function markEditing(ms=1100){
 const canvas=q('#stageCanvas');if(!canvas)return;
 canvas.classList.add('ky-preview-live-edit');
 clearTimeout(editTimer);
 editTimer=setTimeout(()=>canvas.classList.remove('ky-preview-live-edit'),ms);
}

function playEntryOnce(){
 const canvas=q('#stageCanvas');if(!canvas)return;
 clearTimeout(playTimer);
 canvas.classList.remove('ky-preview-live-edit');
 canvas.classList.add('ky-preview-play-entry');
 const badges=qa('.ky-v3-badge',canvas);
 badges.forEach(b=>{
  const entry=[...b.classList].find(c=>c.startsWith('ky-entry-'));
  if(!entry)return;
  b.classList.remove(entry);
  void b.offsetWidth;
  b.classList.add(entry);
 });
 playTimer=setTimeout(()=>canvas.classList.remove('ky-preview-play-entry'),animationDuration()+100);
}

function isMetaPath(path){
 return /^(deviceSettings|pageSettings)\./.test(String(path||''));
}

/*
 Device/page editor layers persist the same click again via handleInput.
 The core handleInput re-renders the preview on every call, which used to create:
   user click render -> deviceSettings render -> pageSettings render
 and therefore the visible old/new/old/new badge oscillation.
 Keep those metadata writes in config, but never let their duplicate preview paint
 replace the already-correct focused preview.
*/
function installHandleInputGate(){
 const current=window.handleInput;
 if(typeof current!=='function'||current.__kyMetaPreviewGate)return;
 const wrapped=function(path,val){
  if(!isMetaPath(path))return current.apply(this,arguments);
  const canvas=q('#stageCanvas');
  const hadFocused=!!canvas?.querySelector('.ky-focus-wrap');
  const savedNodes=hadFocused?[...canvas.childNodes]:null;
  const savedClass=hadFocused?canvas.className:'';
  const sx=hadFocused?canvas.scrollLeft:0,sy=hadFocused?canvas.scrollTop:0;
  window.__KY_META_PERSIST_WRITE__=true;
  try{
   const out=current.apply(this,arguments);
   if(hadFocused&&canvas&&savedNodes){
    canvas.replaceChildren(...savedNodes);
    canvas.className=savedClass;
    canvas.scrollLeft=sx;canvas.scrollTop=sy;
   }
   return out;
  }finally{
   window.__KY_META_PERSIST_WRITE__=false;
  }
 };
 wrapped.__kyMetaPreviewGate=true;
 wrapped.__kyMetaPreviewGateOriginal=current;
 window.handleInput=wrapped;
}

function injectCss(){
 q('#kyPreviewStabilityCss')?.remove();
 const st=document.createElement('style');
 st.id='kyPreviewStabilityCss';
 st.textContent=`
  /* Ordinary editor changes must never replay entry animation. */
  #stageCanvas:not(.ky-preview-play-entry) .ky-v3-badge[class*="ky-entry-"]{
    animation:none!important;
  }
  #stageCanvas.ky-preview-live-edit .ky-v3-badge,
  #stageCanvas.ky-preview-live-edit .ky-focus-badge-overlay,
  #stageCanvas.ky-preview-live-edit .ky-focus-underbar,
  #stageCanvas.ky-preview-live-edit .ky-focus-insidebar,
  #stageCanvas.ky-preview-live-edit .ky-v3-badge-position{
    transition:none!important;
  }
 `;
 document.head.appendChild(st);
}

function start(){
 const canvas=q('#stageCanvas');
 if(!canvas){setTimeout(start,80);return}
 injectCss();
 installHandleInputGate();
 clearInterval(gateWatch);
 let passes=0;
 gateWatch=setInterval(()=>{
  installHandleInputGate();
  if(++passes>24)clearInterval(gateWatch);
 },250);

 const sidebar=q('.ky-sidebar');
 if(!sidebar||sidebar.dataset.kyPreviewStableBound==='1')return;
 sidebar.dataset.kyPreviewStableBound='1';
 sidebar.addEventListener('pointerdown',e=>{
  if(e.target.closest('[data-template],.ky-template-card-v3,[data-icon],.ky-icon-choice,button,input,select,textarea,.ky-grid-btn,.ky-switch,.ky-slider,.ky-color-row'))markEditing(1400);
 },true);
 sidebar.addEventListener('input',e=>{
  if(e.target.id==='v3Entry')return;
  if(e.target.closest('input,textarea,.ky-slider,.ky-color-row'))markEditing(900);
 },true);
 sidebar.addEventListener('change',e=>{
  if(e.target.id==='v3Entry'){
   markEditing(140);
   clearTimeout(playTimer);
   playTimer=setTimeout(playEntryOnce,180);
   return;
  }
  if(e.target.closest('select,input,textarea'))markEditing(1200);
 },true);
 sidebar.addEventListener('click',e=>{
  if(e.target.closest('[data-template],.ky-template-card-v3,[data-icon],.ky-icon-choice,.ky-grid-btn,.ky-switch'))markEditing(1400);
 },true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
