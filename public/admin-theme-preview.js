(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const params=new URLSearchParams(location.search);
const shop=(params.get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'').toLowerCase();
let catalog=null;
let replacing=false;
let lastBadge='';
let lastPlacement='overlay';
let selectedCategoryId='';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fill(t,p,c){return String(t||'').replaceAll('{rank}',p?.rank??1).replaceAll('{category}',c?.name||'').replaceAll('{product}',p?.name||'').replaceAll('{sales}',p?.sales||0);}
function money(v){const n=Number(String(v||'').replace(/[^0-9.,-]/g,'').replace(',','.'));return Number.isFinite(n)&&n>0?`${n.toLocaleString('tr-TR',{maximumFractionDigits:0})} TL`:'';}
function mode(){return qs('.ky-view-tab.active')?.dataset.view==='pdp'?'pdp':'category';}

function injectStyles(){
 if(qs('#kyFocusedPreviewV3'))return;
 const old=qs('#kyFocusedPreviewV2');if(old)old.remove();
 const st=document.createElement('style');st.id='kyFocusedPreviewV3';st.textContent=`
 .ky-theme-adapter{display:none!important}
 .ky-preview-selectors{display:none!important}
 .ky-preview-stage{padding:16px!important;background:#f4f5f8!important}
 .ky-stage-canvas{background:transparent!important;border:0!important;box-shadow:none!important;overflow:auto!important}
 .ky-focus-wrap{max-width:1120px;margin:0 auto;background:#fff;border:1px solid rgba(36,58,139,.10);border-radius:16px;padding:26px;box-shadow:0 18px 42px rgba(36,58,139,.07)}
 .ky-focus-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:20px}.ky-focus-head h2{margin:0;color:#182a68;font-size:26px;line-height:1.1}.ky-focus-head p{margin:6px 0 0;color:#8a92ac;font-size:12px}.ky-focus-pill{font-size:10px;font-weight:800;color:#243a8b;background:#eef2ff;border:1px solid #dbe4ff;border-radius:999px;padding:7px 10px;white-space:nowrap}
 .ky-focus-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.ky-focus-card{min-width:0}.ky-focus-media{position:relative;aspect-ratio:1/1;background:#f5f5f3;border-radius:10px;overflow:hidden}.ky-focus-media img{width:100%;height:100%;display:block;object-fit:cover}.ky-focus-fallback{width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#f2f4fb,#e7eaf6);color:#243a8b;font-size:12px;font-weight:800;text-align:center;padding:18px}
 .ky-focus-product-meta{padding:9px 1px 2px}.ky-focus-product-name{font-size:12px;font-weight:700;color:#192454;line-height:1.35;min-height:32px}.ky-focus-price{margin-top:4px;font-size:11px;color:#667085}
 .ky-focus-badge-overlay{position:absolute;z-index:3;top:10px;left:10px;max-width:calc(100% - 20px)}.ky-focus-card.pos-top-center .ky-focus-badge-overlay{left:50%;transform:translateX(-50%)}.ky-focus-card.pos-top-right .ky-focus-badge-overlay{left:auto;right:10px}.ky-focus-card.pos-middle-left .ky-focus-badge-overlay{top:50%;transform:translateY(-50%)}.ky-focus-card.pos-center .ky-focus-badge-overlay{top:50%;left:50%;transform:translate(-50%,-50%)}.ky-focus-card.pos-middle-right .ky-focus-badge-overlay{top:50%;left:auto;right:10px;transform:translateY(-50%)}.ky-focus-card.pos-bottom-left .ky-focus-badge-overlay{top:auto;bottom:10px}.ky-focus-card.pos-bottom-center .ky-focus-badge-overlay{top:auto;bottom:10px;left:50%;transform:translateX(-50%)}.ky-focus-card.pos-bottom-right .ky-focus-badge-overlay{top:auto;bottom:10px;left:auto;right:10px}
 .ky-focus-underbar{margin-top:0;min-height:34px;display:flex;align-items:center;justify-content:center;border-radius:0 0 9px 9px;overflow:hidden}.ky-focus-underbar .ky-v3-badge:not([class*="tpl-premium-elite-"]){width:100%!important;justify-content:center!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
 .ky-focus-insidebar{position:absolute;z-index:3;left:0;right:0;bottom:0;min-height:34px;display:flex;align-items:center;justify-content:center;overflow:hidden}.ky-focus-insidebar .ky-v3-badge:not([class*="tpl-premium-elite-"]){width:100%!important;justify-content:center!important;border-radius:0!important;box-shadow:none!important;transform:none!important}.ky-focus-insidebar .ky-badge-text,.ky-focus-underbar .ky-badge-text{display:inline!important;visibility:visible!important;opacity:1!important;color:inherit!important}
 .ky-focus-pdp{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.8fr);gap:44px;align-items:start}.ky-focus-pdp-media{aspect-ratio:1/1;background:#f5f5f3;border-radius:12px;overflow:hidden}.ky-focus-pdp-media img{width:100%;height:100%;object-fit:cover}.ky-focus-pdp-info{padding-top:8px}.ky-focus-pdp-context{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#202124;font-size:13px;margin-bottom:22px}.ky-focus-pdp-context a{color:#202124;text-decoration:underline;text-underline-offset:3px}.ky-ref-medal{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;flex:none}.ky-focus-pdp-badge{display:inline-flex;align-items:center;gap:5px;border:1px solid #7dd3fc;border-radius:10px;padding:4px;background:#fff}.ky-focus-pdp-badge .ky-v3-badge{box-shadow:none!important;margin:0!important}.ky-focus-pdp h1{font-size:28px;color:#17213a;line-height:1.15;margin:0 0 12px}.ky-focus-pdp-price{font-size:18px;font-weight:800;color:#243a8b;margin-bottom:22px}.ky-focus-divider{height:1px;background:#eceff5;margin:18px 0}.ky-focus-qty{display:flex;align-items:center;gap:12px;margin-bottom:12px}.ky-focus-qty button{width:34px;height:34px;border:1px solid #dce1ec;background:#fff;border-radius:8px}.ky-focus-add{width:100%;height:44px;border:0;border-radius:8px;background:#243a8b;color:#fff;font-weight:800}
 .ky-focus-note{margin-top:18px;padding-top:14px;border-top:1px solid #eef0f5;color:#8a92ac;font-size:10px;text-align:center}
 .mobile-view .ky-focus-wrap{max-width:390px;padding:16px}.mobile-view .ky-focus-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mobile-view .ky-focus-head h2{font-size:21px}.mobile-view .ky-focus-pdp{grid-template-columns:1fr;gap:20px}.mobile-view .ky-focus-pdp h1{font-size:22px}
 @media(max-width:900px){.ky-focus-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
 `;document.head.appendChild(st);
}

function removeThemeControl(){
 qsa('.ky-theme-adapter').forEach(el=>el.remove());
 const help=qs('#panelTemplates .ky-inline-help');
 if(help&&/tema/i.test(help.textContent||''))help.textContent='Rozet şablonunu seçin. Sağdaki örnek kategori ve ürün sayfasında sonucu anında görün.';
}

async function loadCatalog(){
 try{const r=await fetch(`/api/admin/settings?shop=${encodeURIComponent(shop)}&preview=1`,{cache:'no-store'});const d=await r.json();if(r.ok&&Array.isArray(d.categories))catalog=d.categories;}catch(e){console.warn('[Preview] catalog:',e.message);}
}
function selectedSample(){
 const cats=catalog||[],openId=qs('#v3Categories .ky-category-card.open[data-category-id]')?.dataset.categoryId,selectIndex=Number(qs('#previewCategorySelect')?.value||0);
 const cat=cats.find(c=>String(c.id)===String(selectedCategoryId||openId))||cats[selectIndex]||cats[0]||null;
 const product=[...(cat?.products||[])].sort((a,b)=>Number(a.rank||99)-Number(b.rank||99)||Number(b.sales||0)-Number(a.sales||0))[0]||null;
 return {cat,product};
}
function captureLiveSettings(canvas){
 const badge=canvas.querySelector('.ky-v3-badge');if(badge)lastBadge=badge.outerHTML;
 syncPlacement();
}
function syncPlacement(){
 const location=qs('#v3CardLocation')?.value||'image_overlay';
 if(location==='image_bottom_bar')lastPlacement='under';
 else if(location==='image_inside_bottom_bar')lastPlacement='inside';
 else{
  const active=qs('#v3NineGrid [data-pos].active')?.dataset.pos||'top_left';
  lastPlacement=active.replaceAll('_','-');
 }
}
function cloneBadge(text){
 if(!lastBadge)return `<span class="ky-v3-badge pill" style="--badge-bg:#243a8b;--badge-text:#fff;--badge-radius:999px;--badge-px:10px;--badge-py:6px;font-size:11px"><span class="ky-badge-text">${esc(text)}</span></span>`;
 const tpl=document.createElement('template');tpl.innerHTML=lastBadge.trim();const el=tpl.content.firstElementChild;if(!el)return lastBadge;
 let label=[...el.children].reverse().find(child=>child.tagName==='SPAN'&&!/(icon|premium)/i.test(child.className));
 if(!label){label=document.createElement('span');el.appendChild(label);}label.classList.add('ky-badge-text');label.textContent=text;return el.outerHTML;
}
function image(p){return p?.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ky-focus-fallback',textContent:'${esc(p.name)}'}))">`:`<div class="ky-focus-fallback">${esc(p?.name||'Ürün')}</div>`;}
function productText(p,cat){const t=qs('#v3ProductText')?.value||'En Çok Satan {rank}. Ürün';return fill(t,p,cat||selectedSample().cat);}
function positionClass(){return lastPlacement==='under'||lastPlacement==='inside'?'':` pos-${lastPlacement}`;}
function medal(){return `<svg class="ky-ref-medal" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M9.5 12 8 21l4-2 4 2-1.5-9"></path></svg>`;}

function categoryPreview(cat){
 const items=(cat?.products||[]).slice(0,12);
 return `<div class="ky-focus-wrap"><div class="ky-focus-head"><div><h2>${esc(cat?.name||'Kategori')}</h2><p>Önizleme • ilk ${Math.min(items.length,12)} ürün</p></div><div class="ky-focus-pill">Örnek kategori sayfası</div></div><div class="ky-focus-grid">${items.map(p=>{const show=Number(p.rank||99)<=Number(qs('#v3MaxRank')?.value||20)&&!p.hidden;const badge=show?cloneBadge(productText(p,cat)):'';return `<article class="ky-focus-card${positionClass()}"><div class="ky-focus-media">${image(p)}${show&&lastPlacement==='inside'?`<div class="ky-focus-insidebar">${badge}</div>`:show&&lastPlacement!=='under'?`<div class="ky-focus-badge-overlay">${badge}</div>`:''}</div>${show&&lastPlacement==='under'?`<div class="ky-focus-underbar">${badge}</div>`:''}<div class="ky-focus-product-meta"><div class="ky-focus-product-name">${esc(p.name)}</div><div class="ky-focus-price">${esc(money(p.price))}</div></div></article>`}).join('')}</div><div class="ky-focus-note">Yalnızca rozetin ürün kartındaki görünümü önizlenir.</div></div>`;
}
function pdpPreview(cat,p){
 const prefix=qs('#v3PdpPrefix')?.value||'{category} Kategorisinde';
 const catLabel=fill(prefix,p,cat).replace(/\s*Kategorisinde\s*$/i,'').trim()||cat?.name||'Kategori';
 const badgeText=fill(qs('#v3PdpBadge')?.value||'En Çok Satan {rank}. Ürün',p,cat);
 return `<div class="ky-focus-wrap"><div class="ky-focus-head"><div><h2>Ürün detay önizlemesi</h2><p>Mağazanın gerçek en çok satan ürünü örnek alınır</p></div><div class="ky-focus-pill">${esc(cat?.name||'Kategori')}</div></div><div class="ky-focus-pdp"><div class="ky-focus-pdp-media">${image(p)}</div><div class="ky-focus-pdp-info"><div class="ky-focus-pdp-context">${medal()}<a>${esc(catLabel)}</a><span>Kategorisinde</span><span class="ky-focus-pdp-badge">${cloneBadge(badgeText)}</span></div><h1>${esc(p?.name||'Ürün')}</h1><div class="ky-focus-pdp-price">${esc(money(p?.price))}</div><div class="ky-focus-divider"></div><div class="ky-focus-qty"><button>−</button><strong>1</strong><button>+</button></div><button class="ky-focus-add">Sepete Ekle</button></div></div></div>`;
}
function renderFocused(){
 const canvas=qs('#stageCanvas');if(!canvas||replacing||document.body.classList.contains('ky-profile-preview')||!catalog?.length)return;
 const sample=selectedSample();if(!sample.cat||!sample.product)return;
 syncPlacement();
 replacing=true;canvas.innerHTML=mode()==='pdp'?pdpPreview(sample.cat,sample.product):categoryPreview(sample.cat);replacing=false;
}
function handleCanvasMutation(){const canvas=qs('#stageCanvas');if(!canvas||replacing)return;if(canvas.querySelector('.ky-focus-wrap'))return;captureLiveSettings(canvas);requestAnimationFrame(renderFocused);}
function refreshPreviewOnly(){injectStyles();removeThemeControl();handleCanvasMutation();}

const observer=new MutationObserver(()=>refreshPreviewOnly());
observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('.ky-view-tab,.ky-device-btn,[data-template],#v3TemplateEditor,.ky-slider,.ky-switch,.ky-color-row,.ky-grid-btn'))setTimeout(handleCanvasMutation,40);},true);
document.addEventListener('input',e=>{if(e.target.closest('#panelTexts,#panelTypography,#panelIcons,#panelColors,#panelBorders,#panelSizing,#panelPosition,#panelAnimation,#panelResponsive'))setTimeout(handleCanvasMutation,40);},true);
document.addEventListener('change',e=>{if(e.target.closest('#panelTexts,#panelPosition,#panelResponsive,#panelTemplates')){syncPlacement();setTimeout(()=>{handleCanvasMutation();renderFocused()},40);}},true);
document.addEventListener('ky:categories-updated',e=>{if(Array.isArray(e.detail?.categories)){catalog=e.detail.categories;requestAnimationFrame(renderFocused);}});
document.addEventListener('ky:preview-category-selected',e=>{selectedCategoryId=String(e.detail?.categoryId||'');if(e.detail?.category&&catalog){const i=catalog.findIndex(c=>String(c.id)===selectedCategoryId);if(i>=0)catalog[i]=e.detail.category;}requestAnimationFrame(renderFocused);});
document.addEventListener('ky:premium-template-applied',e=>{if(!e.detail?.html)return;lastBadge=e.detail.html;requestAnimationFrame(renderFocused);});

(async()=>{injectStyles();removeThemeControl();await loadCatalog();setTimeout(handleCanvasMutation,80);setTimeout(handleCanvasMutation,500);})();
})();
