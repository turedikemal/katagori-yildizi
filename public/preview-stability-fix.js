/* Kategori Yildizi — stable preview animation gate. */
(function(){
'use strict';
if(window.__KY_PREVIEW_STABILITY_FIX_V3__)return;
window.__KY_PREVIEW_STABILITY_FIX_V3__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let editTimer=0;
let playTimer=0;

function animationDuration(){
 const n=Number(q('#v3Duration')?.value||320);
 return Number.isFinite(n)?Math.max(100,Math.min(1600,n)):320;
}

function markEditing(ms=900){
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

function injectCss(){
 if(q('#kyPreviewStabilityCss'))q('#kyPreviewStabilityCss').remove();
 const st=document.createElement('style');
 st.id='kyPreviewStabilityCss';
 st.textContent=`
  /* Entry animations are NEVER allowed to restart during ordinary editor renders. */
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
 const sidebar=q('.ky-sidebar');
 if(!sidebar)return;
 sidebar.addEventListener('pointerdown',e=>{
  if(e.target.closest('[data-template],.ky-template-card-v3,[data-icon],.ky-icon-choice,button,input,select,textarea,.ky-grid-btn,.ky-switch,.ky-slider,.ky-color-row'))markEditing(1100);
 },true);
 sidebar.addEventListener('input',e=>{
  if(e.target.id==='v3Entry')return;
  if(e.target.closest('input,textarea,.ky-slider,.ky-color-row'))markEditing(650);
 },true);
 sidebar.addEventListener('change',e=>{
  if(e.target.id==='v3Entry'){
   markEditing(140);
   clearTimeout(playTimer);
   playTimer=setTimeout(playEntryOnce,180);
   return;
  }
  if(e.target.closest('select,input,textarea'))markEditing(900);
 },true);
 sidebar.addEventListener('click',e=>{
  if(e.target.closest('[data-template],.ky-template-card-v3,[data-icon],.ky-icon-choice,.ky-grid-btn,.ky-switch'))markEditing(1100);
 },true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
