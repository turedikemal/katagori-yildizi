/* Kategori Yildizi — stable preview without DOM restore loops. */
(function(){
'use strict';
if(window.__KY_PREVIEW_STABILITY_FIX_V2__)return;
window.__KY_PREVIEW_STABILITY_FIX_V2__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let observer=null;
let editTimer=0;

function stripTransientEntry(root){
 if(!root)return;
 qa('.ky-v3-badge',root).forEach(badge=>{
  [...badge.classList].forEach(cls=>{
   if(cls.startsWith('ky-entry-'))badge.classList.remove(cls);
  });
 });
}

function markEditing(){
 const canvas=q('#stageCanvas');if(!canvas)return;
 canvas.classList.add('ky-preview-live-edit');
 stripTransientEntry(canvas);
 clearTimeout(editTimer);
 editTimer=setTimeout(()=>{
  stripTransientEntry(canvas);
  canvas.classList.remove('ky-preview-live-edit');
 },260);
}

function bind(){
 const canvas=q('#stageCanvas');if(!canvas)return false;
 if(!q('#kyPreviewStabilityCss')){
  const st=document.createElement('style');
  st.id='kyPreviewStabilityCss';
  st.textContent=`
   #stageCanvas.ky-preview-live-edit .ky-v3-badge,
   #stageCanvas.ky-preview-live-edit .ky-focus-badge-overlay,
   #stageCanvas.ky-preview-live-edit .ky-focus-underbar,
   #stageCanvas.ky-preview-live-edit .ky-focus-insidebar,
   #stageCanvas.ky-preview-live-edit .ky-v3-badge-position{
     transition:none!important;
   }
   #stageCanvas.ky-preview-live-edit .ky-v3-badge[class*="ky-entry-"]{
     animation:none!important;
   }
  `;
  document.head.appendChild(st);
 }
 stripTransientEntry(canvas);
 if(!observer){
  observer=new MutationObserver(records=>{
   let changed=false;
   for(const rec of records){
    if(rec.addedNodes?.length){changed=true;break}
   }
   if(changed)stripTransientEntry(canvas);
  });
  observer.observe(canvas,{childList:true,subtree:true});
 }
 return true;
}

function start(){
 if(!bind()){setTimeout(start,80);return}
 const sidebar=q('.ky-sidebar');
 if(sidebar){
  ['pointerdown','input','change','click'].forEach(type=>sidebar.addEventListener(type,e=>{
   if(e.target.closest('button,input,select,textarea,.ky-template-card-v3,[data-template],.ky-icon-choice,[data-icon],.ky-grid-btn,.ky-switch,.ky-color-row,.ky-slider'))markEditing();
  },true));
 }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
