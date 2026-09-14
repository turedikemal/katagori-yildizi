/* Kategori Yildizi — compact category selector */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let scheduled=false,lastSignature='',observer=null;
const STORAGE='ky-selected-category-id';

function injectStyle(){
 if(q('#kyCategorySelectorStyle'))return;
 const s=document.createElement('style');
 s.id='kyCategorySelectorStyle';
 s.textContent=`
  #v3Categories.ky-category-selector-mode>.ky-category-global-tools{display:none!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card{display:none!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card.ky-category-selected{display:block!important;margin:0!important;border-color:rgba(36,58,139,.16)!important;box-shadow:0 5px 16px rgba(36,58,139,.035)!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card.ky-category-selected>.ky-category-body{display:block!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card.ky-category-selected>.ky-category-head{cursor:default!important;background:#fbfcff!important}
  .ky-category-picker{margin:0 0 10px;padding:10px;border:1px solid rgba(36,58,139,.12);border-radius:11px;background:#fff}
  .ky-category-picker-label{display:block;margin:0 0 6px;color:#243a8b;font-size:11px;font-weight:700;line-height:1.2}
  .ky-category-picker-select{width:100%;height:36px;border:1px solid rgba(36,58,139,.16);border-radius:9px;background:#f8faff;color:#243a8b;padding:0 32px 0 10px;font:600 10.5px/1.2 inherit;outline:none;cursor:pointer}
  .ky-category-picker-select:focus{border-color:#243a8b;box-shadow:0 0 0 3px rgba(36,58,139,.07)}
  .ky-category-picker-help{margin-top:6px;color:rgba(36,58,139,.48);font-size:8.8px;line-height:1.35}
 `;
 document.head.appendChild(s);
}

function cards(host){return qa(':scope > .ky-category-card',host)}
function cardId(card,index){return String(card.dataset.categoryId||card.getAttribute('data-category-id')||index)}
function cardMeta(card,index){
 const head=q(':scope > .ky-category-head',card)||q('.ky-category-head',card);
 const name=(q('strong',head)?.textContent||q('.ky-category-name',head)?.textContent||`Kategori ${index+1}`).trim();
 const rowCount=qa('[data-hide-product],.ky-rank-row',card).length;
 const countText=(qa('span',head).map(x=>x.textContent.trim()).find(x=>/\d/.test(x))||'').trim();
 const count=rowCount||Number((countText.match(/\d+/)||[])[0]||0);
 return {id:cardId(card,index),name,count};
}
function signature(list){return list.map((c,i)=>{const m=cardMeta(c,i);return `${m.id}:${m.name}:${m.count}`}).join('|')}

function ensurePicker(host,list){
 let wrap=q(':scope > .ky-category-picker',host);
 if(!wrap){
  wrap=document.createElement('div');
  wrap.className='ky-category-picker';
  wrap.innerHTML='<label class="ky-category-picker-label" for="kyCategoryPickerSelect">Kategoriler</label><select id="kyCategoryPickerSelect" class="ky-category-picker-select" aria-label="Kategori seç"></select><div class="ky-category-picker-help">Bir kategori seçin; yalnızca seçilen kategorinin ürünleri aşağıda açılır.</div>';
  const intro=q(':scope > .ky-category-intro',host);
  if(intro)intro.insertAdjacentElement('afterend',wrap);else host.prepend(wrap);
  q('select',wrap).addEventListener('change',e=>select(host,e.target.value,true));
 }
 return wrap;
}

function select(host,id,fromUser=false){
 const list=cards(host);if(!list.length)return;
 let target=null;
 list.forEach((card,i)=>{
  const active=cardId(card,i)===String(id);
  card.classList.toggle('ky-category-selected',active);
  card.classList.toggle('open',active);
  card.hidden=!active;
  if(active)target=card;
 });
 if(!target){target=list[0];id=cardId(target,0);target.classList.add('ky-category-selected','open');target.hidden=false;}
 const sel=q('#kyCategoryPickerSelect',host);if(sel&&sel.value!==String(id))sel.value=String(id);
 sessionStorage.setItem(STORAGE,String(id));
 if(fromUser&&target){window.selectPreviewCategory?.(target.dataset.categoryId||id);requestAnimationFrame(()=>target.scrollIntoView({block:'nearest',behavior:'smooth'}));}
}

function sync(){
 const host=q('#v3Categories');if(!host)return;
 injectStyle();host.classList.add('ky-category-selector-mode');
 const list=cards(host);if(!list.length)return;
 const wrap=ensurePicker(host,list),sel=q('select',wrap);
 const sig=signature(list);
 if(sig!==lastSignature){
  lastSignature=sig;
  const previous=sessionStorage.getItem(STORAGE)||list.find(c=>c.classList.contains('open'))?.dataset.categoryId||cardId(list[0],0);
  sel.innerHTML=list.map((card,i)=>{const m=cardMeta(card,i);const suffix=m.count?` (${m.count} ürün)`:'';return `<option value="${String(m.id).replace(/"/g,'&quot;')}">${m.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}${suffix}</option>`}).join('');
  select(host,previous,false);
 }else{
  const current=sessionStorage.getItem(STORAGE)||sel.value||cardId(list[0],0);
  select(host,current,false);
 }
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}
function start(){sync();const host=q('#v3Categories');if(host&&!observer){observer=new MutationObserver(schedule);observer.observe(host,{childList:true,subtree:false});}setTimeout(sync,300);setTimeout(sync,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
