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
 return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
load('ky-preview-stability','/preview-stability-fix.js?v=20260914-5');
load('ky-ui-control-tuning','/ui-control-tuning.js?v=20260915-2');
retireBadgeHoverUI();
guardLegacyHoverWrites();
repairCategoryPicker();
document.addEventListener('click',e=>{if(e.target.closest('.ky-category-picker-button'))repairCategoryPicker();},true);
let scheduled=false;
new MutationObserver(()=>{
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{
  scheduled=false;
  retireBadgeHoverUI();
  guardLegacyHoverWrites();
  repairCategoryPicker();
 });
}).observe(document.body,{childList:true,subtree:true});
})();