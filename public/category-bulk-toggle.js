/* Compatibility entry — load the stable live-preview and focused UI tuning layers. */
/* Deploy sync: force Railway to fetch the current GitHub branch HEAD. */
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
function setTextIfChanged(el,text){
 if(el&&el.textContent!==text)el.textContent=text;
}
function retireBadgeHoverUI(){
 document.querySelectorAll('#v3Hover,[data-setting="animation.hover"],[data-path="animation.hover"]').forEach(el=>{
  const target=el.closest('.ky-field,.ky-group,.ky-control-row')||el;
  if(target&&target.isConnected)target.remove();
 });
 const card=document.querySelector('.ky-menu-card[data-target="panelAnimation"]');
 if(card){
  setTextIfChanged(card.querySelector('.ky-menu-title'),'Animasyonlar & Efektler');
  setTextIfChanged(card.querySelector('.ky-menu-subtitle'),'Giriş animasyonu ve hareket ayarları');
 }
 const head=document.querySelector('#panelAnimation .ky-subpanel-title');
 if(head&&/hover/i.test(head.textContent||''))setTextIfChanged(head,'Animasyonlar & Efektler');
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
function esc(v){
 return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
}
function repairCategoryPicker(){
 const host=document.querySelector('#v3Categories');
 const wrap=host?.querySelector(':scope > .ky-category-picker');
 if(!host||!wrap)return;
 const cards=[...host.querySelectorAll(':scope > .ky-category-card')];
 if(!cards.length)return;
 const menu=wrap._kyMenu||wrap.querySelector('.ky-category-picker-menu');
 const select=wrap.querySelector('#kyCategoryPickerSelect');
 if(!menu||!select)return;
 const metas=cards.map((card,index)=>{
  const head=card.querySelector(':scope > .ky-category-head')||card.querySelector('.ky-category-head');
  const id=String(card.dataset.categoryId||card.getAttribute('data-category-id')||index);
  const name=(head?.querySelector('strong')?.textContent||head?.querySelector('.ky-category-name')?.textContent||`Kategori ${index+1}`).trim();
  const rowCount=card.querySelectorAll('[data-hide-product],.ky-rank-row').length;
  const countText=[...(head?.querySelectorAll('span')||[])].map(x=>x.textContent.trim()).find(x=>/\d/.test(x))||'';
  const count=rowCount||Number((countText.match(/\d+/)||[])[0]||0);
  return {id,name,count};
 });
 const needsBuild=select.options.length!==metas.length||menu.querySelectorAll('.ky-category-picker-option').length!==metas.length;
 if(needsBuild){
  select.innerHTML=metas.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');
  menu.innerHTML=metas.map(m=>`<button type="button" class="ky-category-picker-option" role="option" data-category-id="${esc(m.id)}" aria-selected="false"><span class="ky-category-picker-check">✓</span><span class="ky-category-picker-option-name">${esc(m.name)}</span><span class="ky-category-picker-option-count">${m.count} ürün</span></button>`).join('');
 }
 const selected=sessionStorage.getItem('ky-selected-category-id')||cards.find(c=>c.classList.contains('ky-category-selected'))?.dataset.categoryId||metas[0]?.id;
 if(selected!=null){
  select.value=String(selected);
  menu.querySelectorAll('.ky-category-picker-option').forEach(opt=>opt.setAttribute('aria-selected',opt.dataset.categoryId===String(selected)?'true':'false'));
  const meta=metas.find(m=>m.id===String(selected))||metas[0];
  if(meta){setTextIfChanged(wrap.querySelector('.ky-category-picker-name'),meta.name);setTextIfChanged(wrap.querySelector('.ky-category-picker-count'),`${meta.count} ürün`);}
 }
 document.body.querySelectorAll('.ky-category-picker-menu').forEach(other=>{if(other!==menu&&!other.closest('#v3Categories'))other.remove();});
}

/* Premium moving badges must keep moving inside every premium template.
   The focused preview repeatedly clones badge markup, therefore SVG parts are animated
   with Web Animations after every clone/render. This intentionally does not animate
   the 10 retired legacy template shells; it animates only the selected premium icon. */
const premiumPreviewAnimated=new WeakSet();
function animatePart(el,frames,options){
 if(!el||premiumPreviewAnimated.has(el))return;
 try{
  const a=el.animate(frames,{iterations:Infinity,fill:'both',...options});
  a.play();
  el._kyPremiumMotion=a;
  premiumPreviewAnimated.add(el);
 }catch{}
}
function bindPremiumIconMotion(icon){
 if(!icon)return;
 const has=(s)=>icon.classList.contains(s);
 const all=s=>[...icon.querySelectorAll(s)];
 if(has('ky-premium-crown-orbit')){
  all('.p-float').forEach(x=>animatePart(x,[{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:1800,easing:'ease-in-out'}));
  all('.p-spark').forEach((x,i)=>animatePart(x,[{opacity:1,transform:'scale(1)'},{opacity:.2,transform:'scale(.45)'},{opacity:1,transform:'scale(1)'}],{duration:1100,delay:i*260,easing:'ease-in-out'}));
 }else if(has('ky-premium-trophy-glow')){
  all('.p-pulse').forEach(x=>animatePart(x,[{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:1500,easing:'ease-in-out'}));
  all('.p-ray').forEach(x=>animatePart(x,[{opacity:.35},{opacity:1},{opacity:.35}],{duration:1200,easing:'ease-in-out'}));
 }else if(has('ky-premium-medal-spin')){
  all('.p-star').forEach(x=>animatePart(x,[{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:3200,easing:'linear'}));
  all('.p-ribbon-left').forEach(x=>animatePart(x,[{transform:'rotate(-3deg)'},{transform:'rotate(4deg)'},{transform:'rotate(-3deg)'}],{duration:1300,easing:'ease-in-out'}));
  all('.p-ribbon-right').forEach(x=>animatePart(x,[{transform:'rotate(3deg)'},{transform:'rotate(-4deg)'},{transform:'rotate(3deg)'}],{duration:1300,easing:'ease-in-out'}));
 }else if(has('ky-premium-flame-winner')){
  all('.p-flame').forEach(x=>animatePart(x,[{transform:'scale(1) translateY(0)'},{transform:'scale(.94,1.09) translateY(-2px)'},{transform:'scale(1) translateY(0)'}],{duration:820,easing:'ease-in-out'}));
  all('.p-flame-core').forEach(x=>animatePart(x,[{transform:'scale(1)'},{transform:'scale(1.05,.9) translateY(1px)'},{transform:'scale(1)'}],{duration:650,easing:'ease-in-out'}));
 }else if(has('ky-premium-diamond-shine')){
  all('.p-shine').forEach(x=>animatePart(x,[{transform:'translateX(-28px)',opacity:0},{offset:.45,opacity:.95},{transform:'translateX(28px)',opacity:0}],{duration:2000,easing:'ease-in-out'}));
  animatePart(icon,[{transform:'translateY(0)'},{transform:'translateY(-2px)'},{transform:'translateY(0)'}],{duration:1700,easing:'ease-in-out'});
 }else if(has('ky-premium-rocket-rank')){
  all('.p-rocket').forEach(x=>animatePart(x,[{transform:'translate(0,0) rotate(0deg)'},{transform:'translate(3px,-4px) rotate(3deg)'},{transform:'translate(0,0) rotate(0deg)'}],{duration:1150,easing:'ease-in-out'}));
  all('.p-flare').forEach(x=>animatePart(x,[{transform:'scale(.8)',opacity:.55},{transform:'scale(1.18)',opacity:1},{transform:'scale(.8)',opacity:.55}],{duration:650,easing:'ease-in-out'}));
 }else if(has('ky-premium-shield-spark')){
  all('.p-pulse').forEach(x=>animatePart(x,[{transform:'scale(1)'},{transform:'scale(1.07)'},{transform:'scale(1)'}],{duration:1450,easing:'ease-in-out'}));
  all('.p-spark').forEach(x=>animatePart(x,[{opacity:.3,transform:'scale(.5)'},{opacity:1,transform:'scale(1.25)'},{opacity:.3,transform:'scale(.5)'}],{duration:1050,easing:'ease-in-out'}));
 }else if(has('ky-premium-laurel-star')){
  all('.p-pulse').forEach(x=>animatePart(x,[{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:1500,easing:'ease-in-out'}));
  all('.p-ribbon-left,.p-ribbon-right').forEach((x,i)=>animatePart(x,[{transform:`rotate(${i?-3:3}deg)`},{transform:`rotate(${i?3:-3}deg)`},{transform:`rotate(${i?-3:3}deg)`}],{duration:1450,easing:'ease-in-out'}));
 }else if(has('ky-premium-bolt-ring')){
  all('.p-spin').forEach(x=>animatePart(x,[{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:3000,easing:'linear'}));
  all('.p-pulse').forEach(x=>animatePart(x,[{transform:'scale(1)'},{transform:'scale(1.09)'},{transform:'scale(1)'}],{duration:1100,easing:'ease-in-out'}));
 }else if(has('ky-premium-gift-pop')){
  all('.p-float').forEach(x=>animatePart(x,[{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:1600,easing:'ease-in-out'}));
  all('.p-sway').forEach(x=>animatePart(x,[{transform:'rotate(-4deg)'},{transform:'rotate(4deg)'},{transform:'rotate(-4deg)'}],{duration:1200,easing:'ease-in-out'}));
 }else if(has('ky-premium-heart-crown')){
  all('.p-pulse').forEach(x=>animatePart(x,[{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:1250,easing:'ease-in-out'}));
  all('.p-float').forEach(x=>animatePart(x,[{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:1500,easing:'ease-in-out'}));
 }else if(has('ky-premium-check-burst')){
  all('.p-spin').forEach(x=>animatePart(x,[{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:3600,easing:'linear'}));
  all('.p-pulse').forEach(x=>animatePart(x,[{transform:'scale(1)'},{transform:'scale(1.07)'},{transform:'scale(1)'}],{duration:1150,easing:'ease-in-out'}));
 }else{
  animatePart(icon,[{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:1450,easing:'ease-in-out'});
 }
}
function ensurePremiumPreviewMotion(){
 document.querySelectorAll('#stageCanvas .ky-premium-icon').forEach(bindPremiumIconMotion);
}
function injectPremiumMotionSafetyCss(){
 if(document.getElementById('kyPremiumMotionSafety'))return;
 const s=document.createElement('style');
 s.id='kyPremiumMotionSafety';
 s.textContent=`#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon{transform-origin:center!important;will-change:transform!important}#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-float,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-pulse,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-spin,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-star,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-spark,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-flame,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-flame-core,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-shine,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-rocket,#stageCanvas .ky-v3-badge[class*="tpl-premium-"] .ky-premium-icon .p-flare{transform-box:fill-box!important;transform-origin:center!important;will-change:transform,opacity!important}`;
 document.head.appendChild(s);
}

load('ky-preview-stability','/preview-stability-fix.js?v=20260914-5');
load('ky-ui-control-tuning','/ui-control-tuning.js?v=20260915-2');
retireBadgeHoverUI();
guardLegacyHoverWrites();
repairCategoryPicker();
injectPremiumMotionSafetyCss();
ensurePremiumPreviewMotion();
document.addEventListener('click',e=>{
 if(e.target.closest('.ky-category-picker-button'))repairCategoryPicker();
 if(e.target.closest('.ky-premium-choice,.ky-icon-choice,.ky-device-btn,.ky-view-tab,[data-template]'))requestAnimationFrame(ensurePremiumPreviewMotion);
},true);
let scheduled=false;
new MutationObserver(()=>{
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{
  scheduled=false;
  retireBadgeHoverUI();
  guardLegacyHoverWrites();
  repairCategoryPicker();
  injectPremiumMotionSafetyCss();
  ensurePremiumPreviewMotion();
 });
}).observe(document.body,{childList:true,subtree:true});
})();