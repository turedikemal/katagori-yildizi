/* Compatibility entry — load the stable live-preview and focused UI tuning layers. */
(function(){
'use strict';
function load(key,src){
 if(document.querySelector(`script[data-${key}]`))return;
 const s=document.createElement('script');
 s.src=src;
 s.async=false;
 s.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';
 document.body.appendChild(s);
}
function retireBadgeHoverUI(){
 document.querySelectorAll('#v3Hover,[data-setting="animation.hover"],[data-path="animation.hover"]').forEach(el=>el.closest('.ky-field,.ky-group,.ky-control-row')?.remove()||el.remove());
 const card=document.querySelector('.ky-menu-card[data-target="panelAnimation"]');
 if(card){
  const title=card.querySelector('.ky-menu-title');
  const sub=card.querySelector('.ky-menu-subtitle');
  if(title)title.textContent='Animasyonlar & Efektler';
  if(sub)sub.textContent='Giriş animasyonu ve hareket ayarları';
 }
 const head=document.querySelector('#panelAnimation .ky-subpanel-title');
 if(head&&/hover/i.test(head.textContent||''))head.textContent='Animasyonlar & Efektler';
}
function guardLegacyHoverWrites(){
 const original=window.handleInput;
 if(typeof original!=='function'||original.__kyHoverRetired)return;
 const guarded=function(path,value){
  if(path==='animation.hover'||String(path||'').endsWith('.animation.hover'))return;
  return original.apply(this,arguments);
 };
 guarded.__kyHoverRetired=true;
 window.handleInput=guarded;
}
load('ky-preview-stability','/preview-stability-fix.js?v=20260914-5');
load('ky-ui-control-tuning','/ui-control-tuning.js?v=20260915-2');
retireBadgeHoverUI();
guardLegacyHoverWrites();
new MutationObserver(()=>{retireBadgeHoverUI();guardLegacyHoverWrites();}).observe(document.body,{childList:true,subtree:true});
})();