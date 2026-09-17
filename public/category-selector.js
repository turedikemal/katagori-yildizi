/* Kategori Yildizi — compact themed category selector */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let scheduled=false,lastSignature='',observer=null;
const STORAGE='ky-selected-category-id';

function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function injectStyle(){
 if(q('#kyCategorySelectorStyle'))return;
 const s=document.createElement('style');
 s.id='kyCategorySelectorStyle';
 s.textContent=`
  #v3Categories.ky-category-selector-mode>.ky-category-global-tools{display:none!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card{display:none!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card.ky-category-selected{display:block!important;margin:0!important;border-color:rgba(36,58,139,.15)!important;box-shadow:0 8px 22px rgba(36,58,139,.045)!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card.ky-category-selected>.ky-category-body{display:block!important}
  #v3Categories.ky-category-selector-mode>.ky-category-card.ky-category-selected>.ky-category-head{cursor:default!important;background:#fbfcff!important}
  .ky-category-picker{position:relative;margin:0 0 10px;padding:11px;border:1px solid rgba(36,58,139,.12);border-radius:13px;background:#fff;box-shadow:0 5px 16px rgba(36,58,139,.025)}
  .ky-category-picker-label{display:block;margin:0 0 7px;color:#243a8b;font-size:11px;font-weight:750;line-height:1.2}
  .ky-category-picker-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;clip:rect(0,0,0,0)!important}
  .ky-category-picker-button{width:100%;min-height:42px;border:1px solid rgba(36,58,139,.18);border-radius:11px;background:linear-gradient(180deg,#fff,#f8faff);display:flex;align-items:center;gap:9px;padding:7px 9px 7px 11px;color:#243a8b;cursor:pointer;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;box-sizing:border-box;text-align:left}
  .ky-category-picker-button:hover{border-color:rgba(36,58,139,.32);background:#fbfcff}
  .ky-category-picker.open .ky-category-picker-button,.ky-category-picker-button:focus-visible{outline:0;border-color:#243a8b;box-shadow:0 0 0 3px rgba(36,58,139,.075)}
  .ky-category-picker-main{display:flex;align-items:center;min-width:0;flex:1;gap:7px}
  .ky-category-picker-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10.8px;font-weight:720;color:#243a8b}
  .ky-category-picker-count{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:#eef2ff;color:#243a8b;font-size:8.5px;font-weight:800;line-height:1.1;white-space:nowrap;border:1px solid rgba(36,58,139,.08)}
  .ky-category-picker-chevron{width:24px;height:24px;display:grid;place-items:center;flex:0 0 24px;border-radius:7px;background:#f1f4fb;color:#243a8b;transition:transform .16s ease,background .16s ease;color .16s ease}
  .ky-category-picker-chevron svg{width:12px;height:12px;display:block}
  .ky-category-picker.open .ky-category-picker-chevron{transform:rotate(180deg);background:#243a8b;color:#fff}
  .ky-category-picker-menu{position:fixed;left:auto;right:auto;top:auto;z-index:9999;display:none;padding:6px;border:1px solid rgba(36,58,139,.14);border-radius:12px;background:rgba(255,255,255,.995);box-shadow:0 18px 42px rgba(25,42,100,.20);max-height:310px;overflow:auto;overscroll-behavior:contain;box-sizing:border-box}
  .ky-category-picker-menu.is-open{display:block;animation:kyCategoryMenuIn .13s ease-out both}
  @keyframes kyCategoryMenuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  .ky-category-picker-option{width:100%;min-height:37px;border:0;border-radius:8px;background:transparent;display:flex;align-items:center;gap:8px;padding:6px 7px 6px 9px;color:#243a8b;cursor:pointer;text-align:left;transition:background .12s ease,color .12s ease}
  .ky-category-picker-option:hover,.ky-category-picker-option:focus-visible{outline:0;background:#eef3ff}
  .ky-category-picker-option-name{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10.3px;font-weight:650}
  .ky-category-picker-option-count{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:#f1f4fb;color:rgba(36,58,139,.72);font-size:8.2px;font-weight:800;border:1px solid rgba(36,58,139,.08)}
  .ky-category-picker-option[aria-selected="true"]{background:#243a8b;color:#fff}
  .ky-category-picker-option[aria-selected="true"] .ky-category-picker-option-count{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.22)}
  .ky-category-picker-check{width:16px;flex:0 0 16px;opacity:0;font-size:11px;font-weight:900;text-align:center}
  .ky-category-picker-option[aria-selected="true"] .ky-category-picker-check{opacity:1}
  .ky-category-picker-help{margin-top:7px;color:rgba(36,58,139,.48);font-size:8.8px;line-height:1.4}
  .ky-category-picker-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px;padding-top:9px;border-top:1px solid rgba(36,58,139,.09)}
  .ky-category-picker-actions-label{grid-column:1/-1;color:rgba(36,58,139,.62);font-size:8.8px;font-weight:700;line-height:1.3}
  .ky-category-picker-action{min-height:31px;border:1px solid rgba(36,58,139,.16);border-radius:8px;background:#fff;color:#243a8b;font-size:9px;font-weight:800;cursor:pointer}
  .ky-category-picker-action:hover,.ky-category-picker-action:focus-visible{outline:0;border-color:#243a8b;background:#f2f5ff}
  .ky-category-picker-action.primary{background:#243a8b;color:#fff;border-color:#243a8b}
  #v3Categories.ky-category-selector-mode>.ky-category-card.ky-category-selected .ky-v4-category-bulk{display:none!important}
  @media(max-width:760px){.ky-category-picker-button{min-height:40px}.ky-category-picker-menu{max-height:270px}.ky-category-picker-name{font-size:10.4px}}
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

function pickerMenu(wrap){return wrap?._kyMenu||q('.ky-category-picker-menu',wrap)}
function placeMenu(wrap){
 if(!wrap?.classList.contains('open'))return;
 const btn=q('.ky-category-picker-button',wrap),menu=pickerMenu(wrap);if(!btn||!menu)return;
 const rect=btn.getBoundingClientRect(),gap=5,below=window.innerHeight-rect.bottom-gap-8,above=rect.top-gap-8,openUp=below<180&&above>below;
 const room=Math.max(120,Math.min(310,openUp?above:below));
 menu.style.left=`${Math.round(rect.left)}px`;menu.style.width=`${Math.round(rect.width)}px`;menu.style.maxHeight=`${Math.round(room)}px`;menu.style.right='auto';
 if(openUp){menu.style.top='auto';menu.style.bottom=`${Math.round(window.innerHeight-rect.top+gap)}px`;}else{menu.style.top=`${Math.round(rect.bottom+gap)}px`;menu.style.bottom='auto';}
}
function closePicker(wrap,returnFocus=false){if(!wrap)return;wrap.classList.remove('open');pickerMenu(wrap)?.classList.remove('is-open');q('.ky-category-picker-button',wrap)?.setAttribute('aria-expanded','false');if(returnFocus)q('.ky-category-picker-button',wrap)?.focus()}
function openPicker(wrap){if(!wrap)return;const menu=pickerMenu(wrap);if(menu&&menu.parentElement!==document.body)document.body.appendChild(menu);wrap.classList.add('open');menu?.classList.add('is-open');const btn=q('.ky-category-picker-button',wrap);btn?.setAttribute('aria-expanded','true');placeMenu(wrap);requestAnimationFrame(()=>{placeMenu(wrap);q('.ky-category-picker-option[aria-selected="true"]',menu)?.scrollIntoView({block:'nearest'})})}

function ensurePicker(host){
 let wrap=q(':scope > .ky-category-picker',host);
 if(!wrap){
  wrap=document.createElement('div');
  wrap.className='ky-category-picker';
  wrap.innerHTML=`
    <label class="ky-category-picker-label" for="kyCategoryPickerSelect">Kategoriler</label>
    <select id="kyCategoryPickerSelect" class="ky-category-picker-native" aria-hidden="true" tabindex="-1"></select>
    <button type="button" class="ky-category-picker-button" aria-haspopup="listbox" aria-expanded="false">
      <span class="ky-category-picker-main"><span class="ky-category-picker-name">Kategori seç</span><span class="ky-category-picker-count">0 ürün</span></span>
      <span class="ky-category-picker-chevron" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 7.5 5 5 5-5"/></svg></span>
    </button>
    <div class="ky-category-picker-menu" role="listbox" aria-label="Kategoriler"></div>
    <div class="ky-category-picker-help">Bir kategori seçin; yalnızca seçilen kategorinin ürünleri aşağıda açılır.</div>
    <div class="ky-category-picker-actions" aria-label="Seçili kategori ürünleri">
      <span class="ky-category-picker-actions-label">Seçili kategorideki ürün rozetleri</span>
      <button type="button" class="ky-category-picker-action primary" data-category-bulk="open">Tümünü Aç</button>
      <button type="button" class="ky-category-picker-action" data-category-bulk="close">Tümünü Kapat</button>
    </div>`;
  wrap._kyMenu=q('.ky-category-picker-menu',wrap);
  const intro=q(':scope > .ky-category-intro',host);
  if(intro)intro.insertAdjacentElement('afterend',wrap);else host.prepend(wrap);
  const btn=q('.ky-category-picker-button',wrap);
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();wrap.classList.contains('open')?closePicker(wrap):openPicker(wrap)});
  btn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openPicker(wrap);requestAnimationFrame(()=>q('.ky-category-picker-option[aria-selected="true"]',wrap)?.focus())}if(e.key==='Escape'){e.preventDefault();closePicker(wrap)}});
  q('select',wrap).addEventListener('change',e=>select(host,e.target.value,true));
  pickerMenu(wrap).addEventListener('click',e=>{const opt=e.target.closest('.ky-category-picker-option');if(!opt)return;e.preventDefault();e.stopPropagation();select(host,opt.dataset.categoryId,true);closePicker(wrap,true)});
  pickerMenu(wrap).addEventListener('keydown',e=>{
    const opts=qa('.ky-category-picker-option',pickerMenu(wrap));if(!opts.length)return;const i=Math.max(0,opts.indexOf(document.activeElement));
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();opts[(i+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length].focus()}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();document.activeElement?.click()}
    if(e.key==='Escape'){e.preventDefault();closePicker(wrap,true)}
  });
  q('.ky-category-picker-actions',wrap).addEventListener('click',e=>{
    const action=e.target.closest('[data-category-bulk]');if(!action)return;e.preventDefault();e.stopPropagation();
    const card=q(':scope > .ky-category-card.ky-category-selected',host);if(!card)return;
    const selector=action.dataset.categoryBulk==='open'?'.ky-v4-bulk-open':'.ky-v4-bulk-close';
    const trigger=()=>q(selector,card)?.click();
    if(!q(selector,card)){window.dispatchEvent(new Event('resize'));setTimeout(trigger,90);}else trigger();
  });
 }
 return wrap;
}

function updatePickerState(host,id){
 const wrap=q(':scope > .ky-category-picker',host);if(!wrap)return;
 const list=cards(host),idx=list.findIndex((c,i)=>cardId(c,i)===String(id));if(idx<0)return;
 const m=cardMeta(list[idx],idx);
 const sel=q('#kyCategoryPickerSelect',wrap);if(sel&&sel.value!==String(id))sel.value=String(id);
 q('.ky-category-picker-name',wrap).textContent=m.name;
 q('.ky-category-picker-count',wrap).textContent=`${m.count} ürün`;
 qa('.ky-category-picker-option',pickerMenu(wrap)).forEach(opt=>opt.setAttribute('aria-selected',opt.dataset.categoryId===String(id)?'true':'false'));
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
 sessionStorage.setItem(STORAGE,String(id));
 updatePickerState(host,id);
 if(fromUser&&target){window.selectPreviewCategory?.(target.dataset.categoryId||id);requestAnimationFrame(()=>target.scrollIntoView({block:'nearest',behavior:'smooth'}));}
}

function rebuildPicker(host,list,wrap){
 const sel=q('#kyCategoryPickerSelect',wrap),menu=pickerMenu(wrap);
 const metas=list.map((card,i)=>cardMeta(card,i));
 sel.innerHTML=metas.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');
 menu.innerHTML=metas.map(m=>`<button type="button" class="ky-category-picker-option" role="option" data-category-id="${esc(m.id)}" aria-selected="false"><span class="ky-category-picker-check">✓</span><span class="ky-category-picker-option-name">${esc(m.name)}</span><span class="ky-category-picker-option-count">${m.count} ürün</span></button>`).join('');
}

function sync(){
 const host=q('#v3Categories');if(!host)return;
 injectStyle();host.classList.add('ky-category-selector-mode');
 const list=cards(host);if(!list.length)return;
 const wrap=ensurePicker(host),sig=signature(list);
 if(sig!==lastSignature){
  lastSignature=sig;
  const previous=sessionStorage.getItem(STORAGE)||list.find(c=>c.classList.contains('open'))?.dataset.categoryId||cardId(list[0],0);
  rebuildPicker(host,list,wrap);
  select(host,previous,false);
 }else{
  const current=sessionStorage.getItem(STORAGE)||q('#kyCategoryPickerSelect',wrap)?.value||cardId(list[0],0);
  select(host,current,false);
 }
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}
function start(){
 sync();const host=q('#v3Categories');if(host&&!observer){observer=new MutationObserver(schedule);observer.observe(host,{childList:true,subtree:false});}
 document.addEventListener('click',e=>{const wrap=q('#v3Categories>.ky-category-picker');if(wrap&&wrap.classList.contains('open')&&!wrap.contains(e.target)&&!pickerMenu(wrap)?.contains(e.target))closePicker(wrap)},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const wrap=q('#v3Categories>.ky-category-picker');if(wrap?.classList.contains('open'))closePicker(wrap,true)}},true);
 window.addEventListener('resize',()=>placeMenu(q('#v3Categories>.ky-category-picker')),{passive:true});
 document.addEventListener('scroll',()=>placeMenu(q('#v3Categories>.ky-category-picker')),{capture:true,passive:true});
 setTimeout(sync,300);setTimeout(sync,900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
