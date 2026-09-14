/* Kategori Yildizi — stable live preview layer.
 * Prevents transient base-preview paints and entry-animation restarts while
 * sidebar controls are being edited. Premium template motion remains intact.
 */
(function(){
'use strict';
if(window.__KY_PREVIEW_STABILITY_FIX__)return;
window.__KY_PREVIEW_STABILITY_FIX__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let observer=null;
let restoring=false;
let lastFocusedHtml='';
let lastFocusedClass='';
let editTimer=0;

function stripEntryRestart(root){
 if(!root)return;
 qa('.ky-v3-badge',root).forEach(badge=>{
  [...badge.classList].forEach(cls=>{if(cls.startsWith('ky-entry-'))badge.classList.remove(cls)});
 });
}

function rememberFocused(canvas){
 const focus=q(':scope > .ky-focus-wrap',canvas)||q('.ky-focus-wrap',canvas);
 if(!focus)return false;
 stripEntryRestart(focus);
 lastFocusedHtml=focus.outerHTML;
 lastFocusedClass=canvas.className;
 canvas.classList.add('ky-preview-stable-ready');
 return true;
}

function restoreStableFrame(canvas){
 if(restoring||!lastFocusedHtml||q('.ky-focus-wrap',canvas))return;
 restoring=true;
 try{
  const mobile=canvas.classList.contains('mobile-view');
  canvas.innerHTML=lastFocusedHtml;
  if(lastFocusedClass){
   const stable=canvas.classList.contains('ky-preview-stable-ready');
   canvas.className=lastFocusedClass;
   if(stable)canvas.classList.add('ky-preview-stable-ready');
  }
  canvas.classList.toggle('mobile-view',mobile);
  canvas.classList.add('ky-preview-stable-ready');
  stripEntryRestart(canvas);
 }finally{restoring=false}
}

function handleMutation(){
 const canvas=q('#stageCanvas');
 if(!canvas||restoring)return;
 if(rememberFocused(canvas))return;
 // admin-theme-preview replaces this restored frame with the newly rendered
 // focused preview on the next render. Keeping the previous focused frame
 // prevents the base preview from flashing in between.
 restoreStableFrame(canvas);
}

function markEditing(){
 const canvas=q('#stageCanvas');if(!canvas)return;
 canvas.classList.add('ky-preview-live-edit');
 clearTimeout(editTimer);
 editTimer=setTimeout(()=>canvas.classList.remove('ky-preview-live-edit'),140);
}

function bind(){
 const canvas=q('#stageCanvas');if(!canvas)return false;
 if(!q('#kyPreviewStabilityCss')){
  const st=document.createElement('style');
  st.id='kyPreviewStabilityCss';
  st.textContent=`
   #stageCanvas.ky-preview-live-edit .ky-v3-badge{transition:none!important}
   #stageCanvas.ky-preview-live-edit .ky-focus-badge-overlay,
   #stageCanvas.ky-preview-live-edit .ky-focus-underbar,
   #stageCanvas.ky-preview-live-edit .ky-focus-insidebar{transition:none!important}
  `;
  document.head.appendChild(st);
 }
 rememberFocused(canvas);
 if(!observer){
  observer=new MutationObserver(handleMutation);
  observer.observe(canvas,{childList:true,subtree:true});
 }
 return true;
}

function start(){
 if(!bind()){setTimeout(start,80);return}
 const sidebar=q('.ky-sidebar');
 if(sidebar){
  ['input','change','click'].forEach(type=>sidebar.addEventListener(type,e=>{
   if(e.target.closest('button,input,select,textarea,.ky-template-card-v3,.ky-icon-choice,.ky-grid-btn,.ky-switch'))markEditing();
  },true));
 }
 setTimeout(()=>{const canvas=q('#stageCanvas');if(canvas){rememberFocused(canvas);stripEntryRestart(canvas)}},250);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
