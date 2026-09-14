/* Kategori Yildizi — product detail icon placement */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
let busy=false,mo=null,scheduled=false;
function iconSize(){return Math.max(8,Math.min(48,Number(q('#v3IconSize')?.value||14)))}
function moveFocusedPreviewIcon(){
 const context=q('#stageCanvas .ky-focus-pdp-context');if(!context)return;
 const badge=q('.ky-focus-pdp-badge .ky-v3-badge',context);if(!badge)return;
 qa('.ky-ref-medal',context).forEach(x=>x.remove());
 const text=q(':scope > .ky-badge-text',badge);
 const icons=[...badge.children].filter(x=>x!==text&&!x.classList.contains('ky-badge-text'));
 let existing=q('.ky-pdp-leading-selected-icon',context);
 if(!icons.length){existing?.remove();return;}
 const sig=icons.map(x=>x.outerHTML).join('')+'|'+iconSize();
 if(!existing){existing=document.createElement('span');existing.className='ky-pdp-leading-selected-icon';const anchor=q('a',context);context.insertBefore(existing,anchor||context.firstChild)}
 if(existing.dataset.sig!==sig){existing.innerHTML='';icons.forEach(x=>existing.appendChild(x.cloneNode(true)));existing.dataset.sig=sig}
 existing.style.setProperty('--ky-pdp-icon-size',iconSize()+'px');
 icons.forEach(x=>x.classList.add('ky-pdp-inner-icon-source'));
}
function moveLegacyPreviewIcon(){
 qa('#stageCanvas .ky-live-pdp-demo,#stageCanvas .ky-mock-pdp').forEach(root=>{
  const badge=q('.ky-live-pdp-badge .ky-v3-badge,.ky-v3-badge',root);if(!badge)return;
  const text=q(':scope > .ky-badge-text',badge),icons=[...badge.children].filter(x=>x!==text&&!x.classList.contains('ky-badge-text'));
  if(!icons.length)return;
  let old=q('.ky-pdp-leading-selected-icon',root);const sig=icons.map(x=>x.outerHTML).join('')+'|'+iconSize();
  if(!old){old=document.createElement('span');old.className='ky-pdp-leading-selected-icon';const first=q('a,.ky-live-pdp-icon',root);if(first?.classList.contains('ky-live-pdp-icon'))first.remove();const anchor=q('a',root);if(anchor)anchor.parentElement.insertBefore(old,anchor);else root.insertBefore(old,root.firstChild)}
  if(old.dataset.sig!==sig){old.innerHTML='';icons.forEach(x=>old.appendChild(x.cloneNode(true)));old.dataset.sig=sig}
  old.style.setProperty('--ky-pdp-icon-size',iconSize()+'px');icons.forEach(x=>x.classList.add('ky-pdp-inner-icon-source'));
 });
}
function apply(){if(busy)return;busy=true;try{moveFocusedPreviewIcon();moveLegacyPreviewIcon()}finally{busy=false}}
function style(){if(q('#kyPdpIconLayoutCss'))return;const s=document.createElement('style');s.id='kyPdpIconLayoutCss';s.textContent=`
#stageCanvas:not(:has(.ky-focus-wrap)){visibility:hidden!important}
.ky-ref-medal{display:none!important}
.ky-focus-pdp-context{align-items:center!important;line-height:1.2!important;gap:7px!important}.ky-focus-pdp-context>a,.ky-focus-pdp-context>span{vertical-align:middle!important}.ky-focus-pdp-badge{display:inline-flex!important;align-items:center!important;align-self:center!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;line-height:1!important}.ky-focus-pdp-badge .ky-v3-badge{display:inline-flex!important;align-items:center!important;margin:0!important;vertical-align:middle!important}.ky-focus-pdp-badge .ky-v3-badge>:not(.ky-badge-text){display:none!important}.ky-pdp-leading-selected-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:var(--ky-pdp-icon-size,14px)!important;height:var(--ky-pdp-icon-size,14px)!important;font-size:var(--ky-pdp-icon-size,14px)!important;line-height:1!important;margin:0!important;overflow:visible!important;vertical-align:middle!important}.ky-pdp-leading-selected-icon>svg{display:block!important;width:100%!important;height:100%!important;overflow:visible!important}.ky-pdp-leading-selected-icon .ky-premium-icon{display:inline-flex!important;width:100%!important;height:100%!important;font-size:inherit!important;margin:0!important;overflow:visible!important}.ky-pdp-leading-selected-icon .ky-premium-icon svg{width:100%!important;height:100%!important;overflow:visible!important}.ky-focus-pdp-badge .ky-pdp-inner-icon-source,.ky-live-pdp-badge .ky-pdp-inner-icon-source,.ky-mock-pdp .ky-pdp-inner-icon-source{display:none!important}
`;document.head.appendChild(s)}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();})}
document.addEventListener('click',e=>{if(e.target.closest('#v3Icons,[data-icon],#panelIcons,.ky-view-tab,[data-edit-surface]'))setTimeout(schedule,20)},true);
document.addEventListener('input',e=>{if(e.target.closest('#panelIcons')||e.target.id==='v3IconSize')schedule()},true);
document.addEventListener('change',e=>{if(e.target.closest('#panelIcons')||e.target.id==='v3IconSize')schedule()},true);
function observe(){const canvas=q('#stageCanvas');if(!canvas||mo)return;mo=new MutationObserver(()=>{if(!busy)schedule()});mo.observe(canvas,{childList:true,subtree:true});}
function start(){style();apply();observe();setTimeout(()=>{apply();observe()},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();