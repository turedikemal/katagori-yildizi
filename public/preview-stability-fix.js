/* Kategori Yildizi — stable preview animation + deferred persistence gate v6. */
(function(){
'use strict';
if(window.__KY_PREVIEW_STABILITY_FIX_V6__)return;
window.__KY_PREVIEW_STABILITY_FIX_V6__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const clone=v=>{try{return structuredClone(v)}catch{try{return JSON.parse(JSON.stringify(v))}catch{return v}}};
let editTimer=0;
let playTimer=0;
let gateWatch=0;
const pendingWrites=new Map();

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
 qa('.ky-v3-badge',canvas).forEach(b=>{
  const entry=[...b.classList].find(c=>c.startsWith('ky-entry-'));
  if(!entry)return;
  b.classList.remove(entry);
  void b.offsetWidth;
  b.classList.add(entry);
 });
 playTimer=setTimeout(()=>canvas.classList.remove('ky-preview-play-entry'),animationDuration()+100);
}

function premiumPreviewActive(){
 return !!q('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]') ||
        !!q('#v3Templates [data-template^="premium-"].active');
}

function isDeferredPath(path){
 const p=String(path||'');
 if(/^(deviceSettings|pageSettings)\./.test(p))return true;
 /* Premium size/spacing is applied directly to the existing badge DOM by
    premium-sizing-enable.js. Do not let the core renderer replace the badge
    between slider frames, otherwise the user sees default -> custom -> default
    -> custom size oscillation. Persist the value later instead. */
 if(premiumPreviewActive() && /^(styling\.(paddingX|paddingY|scale))$/.test(p))return true;
 return false;
}

function queueConfigWrite(path,val){
 if(!path)return;
 pendingWrites.set(String(path),clone(val));
}
window.__KY_QUEUE_CONFIG_WRITE__=queueConfigWrite;

function installHandleInputGate(){
 const current=window.handleInput;
 if(typeof current!=='function'||current.__kyDeferredPreviewGate)return;
 const wrapped=function(path,val){
  if(window.__KY_FLUSHING_DEFERRED_WRITES__)return current.apply(this,arguments);
  if(isDeferredPath(path)){
   queueConfigWrite(path,val);
   return val;
  }
  return current.apply(this,arguments);
 };
 wrapped.__kyDeferredPreviewGate=true;
 wrapped.__kyDeferredPreviewGateOriginal=current;
 window.handleInput=wrapped;
}

function flushPendingWrites(){
 if(!pendingWrites.size)return;
 installHandleInputGate();
 const fn=window.handleInput;
 if(typeof fn!=='function')return;
 const entries=[...pendingWrites.entries()];
 pendingWrites.clear();
 window.__KY_FLUSHING_DEFERRED_WRITES__=true;
 markEditing(500);
 try{
  for(const [path,val] of entries)fn(path,clone(val));
 }finally{
  window.__KY_FLUSHING_DEFERRED_WRITES__=false;
 }
}
window.__KY_FLUSH_DEFERRED_WRITES__=flushPendingWrites;

function injectCss(){
 q('#kyPreviewStabilityCss')?.remove();
 const st=document.createElement('style');
 st.id='kyPreviewStabilityCss';
 st.textContent=`
  /* Ordinary editor changes must never replay entry animation. */
  #stageCanvas:not(.ky-preview-play-entry) .ky-v3-badge[class*="ky-entry-"]{animation:none!important}
  #stageCanvas.ky-preview-live-edit .ky-v3-badge,
  #stageCanvas.ky-preview-live-edit .ky-focus-badge-overlay,
  #stageCanvas.ky-preview-live-edit .ky-focus-underbar,
  #stageCanvas.ky-preview-live-edit .ky-focus-insidebar,
  #stageCanvas.ky-preview-live-edit .ky-v3-badge-position{transition:none!important}
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
  if(++passes>40)clearInterval(gateWatch);
 },250);

 document.addEventListener('click',e=>{
  if(e.target.closest('#btnSaveDraft,#btnPublish'))flushPendingWrites();
 },true);

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
