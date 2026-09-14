(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const shop=(new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');
let scheduled=false;

function injectStyle(){
  if(q('#kyCategoryBulkStyle'))return;
  const s=document.createElement('style');
  s.id='kyCategoryBulkStyle';
  s.textContent=`
    .ky-category-bulk{display:flex;align-items:center;justify-content:space-between;gap:7px;margin:7px 0 5px;padding:7px 8px;border:1px solid rgba(36,58,139,.10);border-radius:9px;background:#f7f9ff}
    .ky-category-bulk-label{font-size:8.5px;font-weight:800;color:#243a8b;white-space:nowrap}
    .ky-category-bulk-actions{display:grid;grid-template-columns:1fr 1fr;gap:4px;min-width:152px}
    .ky-category-bulk-btn{height:27px;padding:0 8px;border:1px solid rgba(36,58,139,.14);border-radius:7px;background:#fff;color:#243a8b;font-size:8px;font-weight:800;cursor:pointer;transition:.15s ease}
    .ky-category-bulk-btn:hover{border-color:#243a8b;background:#eef2ff}
    .ky-category-bulk-btn.close{color:#a33136;border-color:rgba(206,63,68,.18)}
    .ky-category-bulk-btn.close:hover{border-color:#ce3f44;background:#fff2f2}
    .ky-category-bulk-btn:disabled{opacity:.48;cursor:wait}
    .ky-category-bulk.is-busy .ky-category-bulk-label:after{content:' • uygulanıyor';font-weight:600;color:rgba(36,58,139,.52)}
  `;
  document.head.appendChild(s);
}

async function json(url,options={}){
  const r=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.success===false)throw new Error(d.message||'İşlem tamamlanamadı');
  return d;
}

async function setWholeCategory(card,show){
  if(!card||card.dataset.bulkBusy==='1')return;
  const categoryId=card.dataset.categoryId;
  if(!categoryId)return;
  card.dataset.bulkBusy='1';
  const bulk=q('.ky-category-bulk',card);
  bulk?.classList.add('is-busy');
  qa('.ky-category-bulk-btn',card).forEach(b=>b.disabled=true);
  try{
    const settings=await json(`/api/admin/settings?shop=${encodeURIComponent(shop)}&categoryBulk=1`,{cache:'no-store'});
    const category=(settings.categories||[]).find(c=>String(c.id)===String(categoryId));
    const products=category?.products||[];
    if(!products.length)throw new Error('Bu kategoride ürün bulunamadı.');
    const hidden=!show;
    await Promise.all(products.map(p=>json(`/api/admin/categories/override?shop=${encodeURIComponent(shop)}`,{
      method:'POST',
      body:JSON.stringify({categoryId,productId:p.id,manualRank:p.manual?Number(p.rank):null,hidden})
    })));

    // One final native change refreshes the editor's internal category state and preview
    // after every bulk write has completed, avoiding a full-page reload.
    const first=q('[data-hide-product]',card);
    if(first){
      first.checked=hidden;
      first.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }catch(err){
    console.error('[Kategori toplu aç/kapa]',err);
    const label=q('.ky-category-bulk-label',card);
    if(label){const old=label.textContent;label.textContent='İşlem tamamlanamadı';setTimeout(()=>{if(label.isConnected)label.textContent=old;},1800);}
  }finally{
    card.dataset.bulkBusy='0';
    bulk?.classList.remove('is-busy');
    qa('.ky-category-bulk-btn',card).forEach(b=>b.disabled=false);
  }
}

function enhance(){
  injectStyle();
  const host=q('#v3Categories');if(!host)return;
  qa('.ky-category-card',host).forEach(card=>{
    if(q(':scope > .ky-category-body > .ky-category-bulk',card))return;
    const body=q(':scope > .ky-category-body',card);if(!body)return;
    const bar=document.createElement('div');
    bar.className='ky-category-bulk';
    bar.innerHTML=`<span class="ky-category-bulk-label">Kategori ürünleri</span><span class="ky-category-bulk-actions"><button class="ky-category-bulk-btn open" type="button">Tümünü Aç</button><button class="ky-category-bulk-btn close" type="button">Tümünü Kapat</button></span>`;
    body.prepend(bar);
    q('.open',bar).addEventListener('click',e=>{e.stopPropagation();setWholeCategory(card,true);});
    q('.close',bar).addEventListener('click',e=>{e.stopPropagation();setWholeCategory(card,false);});
  });
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance();});}
function start(){enhance();const host=q('#v3Categories');if(host)new MutationObserver(schedule).observe(host,{childList:true,subtree:true});setTimeout(enhance,300);setTimeout(enhance,900);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
