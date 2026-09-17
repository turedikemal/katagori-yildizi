/* Kategori Yildizi — minimum sales rule. */
(function(){
'use strict';
if(window.__KY_MIN_SALES_HOVER_FIX__)return;
window.__KY_MIN_SALES_HOVER_FIX__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let filterTimer=0;
let syncTimer=0;
let observer=null;
let bypassSyncClick=false;

function threshold(){
 const el=q('#v3MinSales');
 const n=Math.floor(Number(el?.value||0));
 return Number.isFinite(n)?Math.max(0,n):0;
}

function salesFromRow(row){
 const text=row?.querySelector('.ky-rank-product small')?.textContent||'';
 const m=text.match(/([\d.]+)\s*satış/i);
 return m?Number(m[1].replace(/\./g,'')):0;
}

function applyMinimumSalesFilter(){
 const min=threshold();
 qa('#v3Categories .ky-category-card').forEach(card=>{
  const rows=qa('.ky-rank-row',card);
  let visible=0;
  rows.forEach(row=>{
   const show=salesFromRow(row)>=min;
   row.hidden=!show;
   row.style.display=show?'':'none';
   if(show)visible++;
  });
  const count=card.querySelector('.ky-category-head span');
  if(count){
   const total=rows.length;
   count.textContent=min>0?`${visible} uygun / ${total} ürün`:`${total} ürün`;
  }
 });
}

function scheduleFilter(){
 clearTimeout(filterTimer);
 filterTimer=setTimeout(applyMinimumSalesFilter,0);
}

function explainMinimumSales(){
 const el=q('#v3MinSales');if(!el)return;
 el.min='0';el.step='1';
 const field=el.closest('.ky-field');if(!field)return;
 const label=field.querySelector('.ky-label');
 if(label)label.textContent='Minimum Satış Adedi';
 if(!field.querySelector('.ky-min-sales-help')){
  const note=document.createElement('div');
  note.className='ky-inline-help ky-min-sales-help';
  note.textContent='Örnek: 5 yazarsanız, seçili hesaplama döneminde 5 adetten az satılan ürünler çok satan sıralamasına girmez ve rozet alamaz.';
  field.appendChild(note);
 }
}

function persistAndResync(){
 clearTimeout(syncTimer);
 syncTimer=setTimeout(()=>{
  const save=q('#btnSaveDraft');
  if(save)save.click();
  setTimeout(()=>{
   const sync=q('#v3Sync');
   if(sync&&!sync.disabled){
    bypassSyncClick=true;
    sync.click();
    setTimeout(()=>{bypassSyncClick=false},0);
   }
  },1100);
 },180);
}

function bind(){
 const input=q('#v3MinSales');
 if(input&&!input.dataset.kyMinSalesFixed){
  input.dataset.kyMinSalesFixed='1';
  input.addEventListener('input',()=>{
   if(Number(input.value)<0)input.value='0';
   scheduleFilter();
  });
  input.addEventListener('change',()=>{
   if(Number(input.value)<0)input.value='0';
   applyMinimumSalesFilter();
   persistAndResync();
  });
  input.addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();input.blur();}
  });
 }
 const host=q('#v3Categories');
 if(host&&!host.dataset.kyMinSalesObserved){
  host.dataset.kyMinSalesObserved='1';
  observer=new MutationObserver(scheduleFilter);
  observer.observe(host,{childList:true,subtree:true});
 }
}

function boot(){
 explainMinimumSales();
 bind();
 applyMinimumSalesFilter();
 [150,450,900,1600].forEach(ms=>setTimeout(()=>{explainMinimumSales();bind();applyMinimumSalesFilter()},ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


