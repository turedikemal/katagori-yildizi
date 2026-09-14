/* Kategori Yildizi — product detail icon placement */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
let busy=false;
function moveFocusedPreviewIcon(){
 const context=q('#stageCanvas .ky-focus-pdp-context');if(!context)return;
 const badge=q('.ky-focus-pdp-badge .ky-v3-badge',context);if(!badge)return;
 qa('.ky-ref-medal,.ky-pdp-leading-selected-icon',context).forEach(x=>x.remove());
 const text=q(':scope > .ky-badge-text',badge);
 const icons=[...badge.children].filter(x=>x!==text&&!x.classList.contains('ky-badge-text'));
 if(!icons.length)return;
 const lead=document.createElement('span');lead.className='ky-pdp-leading-selected-icon';
 icons.forEach(x=>lead.appendChild(x));
 const anchor=q('a',context);context.insertBefore(lead,anchor||context.firstChild);
}
function moveLegacyPreviewIcon(){
 qa('#stageCanvas .ky-live-pdp-demo,#stageCanvas .ky-mock-pdp').forEach(root=>{
  const badge=q('.ky-live-pdp-badge .ky-v3-badge,.ky-v3-badge',root);if(!badge)return;
  const text=q(':scope > .ky-badge-text',badge),icons=[...badge.children].filter(x=>x!==text&&!x.classList.contains('ky-badge-text'));
  const old=q('.ky-pdp-leading-selected-icon',root);if(old)old.remove();
  if(!icons.length)return;
  const lead=document.createElement('span');lead.className='ky-pdp-leading-selected-icon';icons.forEach(x=>lead.appendChild(x));
  const firstText=q('a,.ky-live-pdp-icon',root);if(firstText?.classList.contains('ky-live-pdp-icon'))firstText.remove();
  if(firstText&&firstText.parentElement)firstText.parentElement.insertBefore(lead,firstText);else root.insertBefore(lead,root.firstChild);
 });
}
function apply(){if(busy)return;busy=true;try{moveFocusedPreviewIcon();moveLegacyPreviewIcon()}finally{busy=false}}
function style(){if(q('#kyPdpIconLayoutCss'))return;const s=document.createElement('style');s.id='kyPdpIconLayoutCss';s.textContent=`
.ky-pdp-leading-selected-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;line-height:1!important;margin-right:1px!important;background:transparent!important;border:0!important;box-shadow:none!important}.ky-pdp-leading-selected-icon>svg{display:block!important}.ky-pdp-leading-selected-icon .ky-premium-icon{margin:0!important}.ky-focus-pdp-badge .ky-v3-badge>.ky-pdp-leading-selected-icon{display:none!important}
`;document.head.appendChild(s)}
function schedule(){requestAnimationFrame(()=>{apply();setTimeout(apply,35)})}
document.addEventListener('click',e=>{if(e.target.closest('#v3Icons,[data-icon],#panelIcons,.ky-view-tab,[data-edit-surface]'))setTimeout(schedule,30)},true);
document.addEventListener('input',e=>{if(e.target.closest('#panelIcons'))schedule()},true);
document.addEventListener('change',e=>{if(e.target.closest('#panelIcons'))schedule()},true);
const mo=new MutationObserver(()=>{if(!busy)schedule()});
function start(){style();apply();mo.observe(document.body,{childList:true,subtree:true});setTimeout(apply,400)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();