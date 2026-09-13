(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const params=new URLSearchParams(location.search);
const shop=(params.get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'').toLowerCase();
let catalog=null;
let replacing=false;
let menuBound=false;
let lastBadge='';
let lastPlacement='overlay';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fill(t,p,c){return String(t||'').replaceAll('{rank}',p?.rank??1).replaceAll('{category}',c?.name||'').replaceAll('{product}',p?.name||'').replaceAll('{sales}',p?.sales||0);}
function money(v){const n=Number(String(v||'').replace(/[^0-9.,-]/g,'').replace(',','.'));return Number.isFinite(n)&&n>0?`${n.toLocaleString('tr-TR',{maximumFractionDigits:0})} TL`:'';}
function mode(){return qs('.ky-view-tab.active')?.dataset.view==='pdp'?'pdp':'category';}

function injectStyles(){
 if(qs('#kyFocusedPreviewV2'))return;
 const st=document.createElement('style');st.id='kyFocusedPreviewV2';st.textContent=`
 .ky-theme-adapter,#kySidebarNavHead,.ky-sidebar-navhead{display:none!important}
 #menuList{display:flex!important;flex-direction:column!important;gap:8px!important}
 body.ky-panel-open #menuList{display:none!important}
 .ky-subpanel{display:none!important}.ky-subpanel.active{display:block!important}
 .ky-subpanel-header{display:flex!important;align-items:center!important;gap:8px!important;padding:14px 16px!important;position:sticky!important;top:0!important;z-index:9!important;background:#fff!important;border-bottom:1px solid rgba(36,58,139,.08)!important}
 .ky-subpanel-header .ky-btn-back{display:inline-flex!important;align-items:center!important;justify-content:center!important}
 .ky-preview-selectors{display:none!important}
 .ky-preview-stage{padding:16px!important;background:#f4f5f8!important}.ky-stage-canvas{background:transparent!important;border:0!important;box-shadow:none!important;overflow:auto!important}
 .ky-focus-wrap{max-width:1120px;margin:0 auto;background:#fff;border:1px solid rgba(36,58,139,.10);border-radius:16px;padding:26px;box-shadow:0 18px 42px rgba(36,58,139,.07)}
 .ky-focus-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:20px}.ky-focus-head h2{margin:0;color:#182a68;font-size:26px;line-height:1.1}.ky-focus-head p{margin:6px 0 0;color:#8a92ac;font-size:12px}.ky-focus-pill{font-size:10px;font-weight:800;color:#243a8b;background:#eef2ff;border:1px solid #dbe4ff;border-radius:999px;padding:7px 10px;white-space:nowrap}
 .ky-focus-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.ky-focus-card{min-width:0}.ky-focus-media{position:relative;aspect-ratio:1/1;background:#f5f5f3;border-radius:10px;overflow:hidden}.ky-focus-media img{width:100%;height:100%;display:block;object-fit:cover}.ky-focus-fallback{width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#f2f4fb,#e7eaf6);color:#243a8b;font-size:12px;font-weight:800;text-align:center;padding:18px}
 .ky-focus-product-meta{padding:9px 1px 2px}.ky-focus-product-name{font-size:12px;font-weight:700;color:#192454;line-height:1.35;min-height:32px}.ky-focus-price{margin-top:4px;font-size:11px;color:#667085}
 .ky-focus-badge-overlay{position:absolute;z-index:3;top:10px;left:10px;max-width:calc(100% - 20px)}.ky-focus-card.pos-top-center .ky-focus-badge-overlay{left:50%;transform:translateX(-50%)}.ky-focus-card.pos-top-right .ky-focus-badge-overlay{left:auto;right:10px}.ky-focus-card.pos-center-left .ky-focus-badge-overlay{top:50%;transform:translateY(-50%)}.ky-focus-card.pos-center .ky-focus-badge-overlay{top:50%;left:50%;transform:translate(-50%,-50%)}.ky-focus-card.pos-center-right .ky-focus-badge-overlay{top:50%;left:auto;right:10px;transform:translateY(-50%)}.ky-focus-card.pos-bottom-left .ky-focus-badge-overlay{top:auto;bottom:10px}.ky-focus-card.pos-bottom-center .ky-focus-badge-overlay{top:auto;bottom:10px;left:50%;transform:translateX(-50%)}.ky-focus-card.pos-bottom-right .ky-focus-badge-overlay{top:auto;bottom:10px;left:auto;right:10px}
 .ky-focus-underbar{margin-top:0;min-height:34px;display:flex;align-items:center;justify-content:center;border-radius:0 0 9px 9px;overflow:hidden}.ky-focus-underbar .ky-v3-badge{width:100%!important;justify-content:center!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
 .ky-focus-pdp{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.8fr);gap:44px;align-items:start}.ky-focus-pdp-media{aspect-ratio:1/1;background:#f5f5f3;border-radius:12px;overflow:hidden}.ky-focus-pdp-media img{width:100%;height:100%;object-fit:cover}.ky-focus-pdp-info{padding-top:8px}.ky-focus-pdp-context{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#202124;font-size:13px;margin-bottom:22px}.ky-focus-pdp-context a{color:#202124;text-decoration:underline;text-underline-offset:3px}.ky-ref-medal{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;flex:none}.ky-focus-pdp-badge{display:inline-flex;align-items:center;gap:5px;border:1px solid #7dd3fc;border-radius:10px;padding:4px;background:#fff}.ky-focus-pdp-badge .ky-v3-badge{box-shadow:none!important;margin:0!important}.ky-focus-pdp-arrow{font-size:18px;line-height:1;padding-right:3px}.ky-focus-pdp h1{font-size:28px;color:#17213a;line-height:1.15;margin:0 0 12px}.ky-focus-pdp-price{font-size:18px;font-weight:800;color:#243a8b;margin-bottom:22px}.ky-focus-divider{height:1px;background:#eceff5;margin:18px 0}.ky-focus-qty{display:flex;align-items:center;gap:12px;margin-bottom:12px}.ky-focus-qty button{width:34px;height:34px;border:1px solid #dce1ec;background:#fff;border-radius:8px}.ky-focus-add{width:100%;height:44px;border:0;border-radius:8px;background:#243a8b;color:#fff;font-weight:800}
 .ky-focus-note{margin-top:18px;padding-top:14px;border-top:1px solid #eef0f5;color:#8a92ac;font-size:10px;text-align:center}
 .mobile-view .ky-focus-wrap{max-width:390px;padding:16px}.mobile-view .ky-focus-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mobile-view .ky-focus-head h2{font-size:21px}.mobile-view .ky-focus-pdp{grid-template-columns:1fr;gap:20px}.mobile-view .ky-focus-pdp h1{font-size:22px}
 @media(max-width:900px){.ky-focus-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
 `;document.head.appendChild(st);
}

function restoreClassicSidebar(){
 const menu=qs('#menuList'),content=qs('.ky-sidebar-content');if(!menu||!content)return;
 qsa('#kySidebarNavHead,.ky-sidebar-navhead').forEach(el=>el.remove());
 qsa('.ky-subpanel').forEach(p=>{p.classList.remove('ky-accordion-panel');if(p.parentElement===menu)content.appendChild(p);});
 if(menuBound)return;menuBound=true;
 document.addEventListener('click',e=>{
   const card=e.target.closest('.ky-menu-card');
   if(card){e.preventDefault();e.stopImmediatePropagation();document.body.classList.add('ky-panel-open');qsa('.ky-subpanel').forEach(p=>p.classList.toggle('active',p.id===card.dataset.target));qsa('.ky-menu-card').forEach(c=>c.classList.toggle('active',c===card));sessionStorage.setItem('ky-active-panel',card.dataset.target);return;}
   const back=e.target.closest('.ky-btn-back');
   if(back){e.preventDefault();e.stopImmediatePropagation();document.body.classList.remove('ky-panel-open');qsa('.ky-subpanel').forEach(p=>p.classList.remove('active'));qsa('.ky-menu-card').forEach(c=>c.classList.remove('active'));sessionStorage.removeItem('ky-active-panel');}
 },true);
 const saved=sessionStorage.getItem('ky-active-panel');if(saved&&qs('#'+CSS.escape(saved))){document.body.classList.add('ky-panel-open');qsa('.ky-subpanel').forEach(p=>p.classList.toggle('active',p.id===saved));}else document.body.classList.remove('ky-panel-open');
}

function removeThemeControl(){qsa('.ky-theme-adapter').forEach(el=>el.remove());const help=qs('#panelTemplates .ky-inline-help');if(help&&/tema/i.test(help.textContent||''))help.textContent='Rozet şablonunu seçin. Sağdaki örnek kategori ve ürün sayfasında sonucu anında görün.';}

async function loadCatalog(){
 try{const r=await fetch(`/api/admin/settings?shop=${encodeURIComponent(shop)}&preview=1`,{cache:'no-store'});const d=await r.json();if(r.ok&&Array.isArray(d.categories))catalog=d.categories;}catch(e){console.warn('[Preview] catalog:',e.message);}
}
function globalSample(){
 const cats=catalog||[];let chosenCat=null,chosenProduct=null;
 for(const cat of cats){for(const p of cat.products||[]){if(!chosenProduct||Number(p.sales||0)>Number(chosenProduct.sales||0)||(Number(p.sales||0)===Number(chosenProduct.sales||0)&&Number(p.rank||99)<Number(chosenProduct.rank||99))){chosenProduct=p;chosenCat=cat;}}}
 return {cat:chosenCat||cats[0]||null,product:chosenProduct||(cats[0]?.products||[])[0]||null};
}
function captureLiveSettings(canvas){
 const badge=canvas.querySelector('.ky-v3-badge');if(badge)lastBadge=badge.outerHTML;
 const pos=canvas.querySelector('.ky-v3-badge-position');if(pos){if(pos.classList.contains('pos-bottom-bar'))lastPlacement='under';else{const cls=[...pos.classList].find(x=>x.startsWith('pos-'));lastPlacement=cls?cls.replace('pos-',''):'top-left';}}
}
function cloneBadge(text){
 if(!lastBadge)return `<span class="ky-v3-badge pill" style="--badge-bg:#243a8b;--badge-text:#fff;--badge-radius:999px;--badge-px:10px;--badge-py:6px;font-size:11px"><span>${esc(text)}</span></span>`;
 const tpl=document.createElement('template');tpl.innerHTML=lastBadge.trim();const el=tpl.content.firstElementChild;const spans=el?.querySelectorAll('span');if(spans?.length)spans[spans.length-1].textContent=text;return el?.outerHTML||lastBadge;
}
function image(p){return p?.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ky-focus-fallback',textContent:'${esc(p.name)}'}))">`:`<div class="ky-focus-fallback">${esc(p?.name||'Ürün')}</div>`;}
function productText(p){const t=qs('#v3ProductText')?.value||'En Çok Satan {rank}. Ürün';return fill(t,p,globalSample().cat);}
function positionClass(){return lastPlacement==='under'?'':` pos-${lastPlacement}`;}
function medal(){return `<svg class="ky-ref-medal" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M9.5 12 8 21l4-2 4 2-1.5-9"></path></svg>`;}

function categoryPreview(cat,top){
 const items=(cat?.products||[]).slice(0,12);return `<div class="ky-focus-wrap"><div class="ky-focus-head"><div><h2>${esc(cat?.name||'Kategori')}</h2><p>Önizleme • ilk ${Math.min(items.length,12)} ürün</p></div><div class="ky-focus-pill">Örnek kategori sayfası</div></div><div class="ky-focus-grid">${items.map(p=>{const show=Number(p.rank||99)<=Number(qs('#v3MaxRank')?.value||20)&&!p.hidden;const badge=show?cloneBadge(productText(p)):'';return `<article class="ky-focus-card${positionClass()}"><div class="ky-focus-media">${image(p)}${show&&lastPlacement!=='under'?`<div class="ky-focus-badge-overlay">${badge}</div>`:''}</div>${show&&lastPlacement==='under'?`<div class="ky-focus-underbar">${badge}</div>`:''}<div class="ky-focus-product-meta"><div class="ky-focus-product-name">${esc(p.name)}</div><div class="ky-focus-price">${esc(money(p.price))}</div></div></article>`}).join('')}</div><div class="ky-focus-note">Header, footer ve diğer mağaza bileşenleri bilinçli olarak gösterilmez. Yalnızca rozetin ürün kartında nasıl durduğu önizlenir.</div></div>`;
}
function pdpPreview(cat,p){
 const prefix=qs('#v3PdpPrefix')?.value||'{category} Kategorisinde';const catLabel=fill(prefix,p,cat).replace(/\s*Kategorisinde\s*$/i,'').trim()||cat?.name||'Kategori';const badgeText=fill(qs('#v3PdpBadge')?.value||'En Çok Satan {rank}. Ürün',p,cat);return `<div class="ky-focus-wrap"><div class="ky-focus-head"><div><h2>Ürün detay önizlemesi</h2><p>Mağazanın gerçek en çok satan ürünü örnek alınır</p></div><div class="ky-focus-pill">${esc(cat?.name||'Kategori')}</div></div><div class="ky-focus-pdp"><div class="ky-focus-pdp-media">${image(p)}</div><div class="ky-focus-pdp-info"><div class="ky-focus-pdp-context">${medal()}<a>${esc(catLabel)}</a><span>Kategorisinde</span><span class="ky-focus-pdp-badge">${cloneBadge(badgeText)}<span class="ky-focus-pdp-arrow">›</span></span></div><h1>${esc(p?.name||'Ürün')}</h1><div class="ky-focus-pdp-price">${esc(money(p?.price))}</div><div class="ky-focus-divider"></div><div class="ky-focus-qty"><button>−</button><strong>1</strong><button>+</button></div><button class="ky-focus-add">Sepete Ekle</button></div></div><div class="ky-focus-note">Bu ekran yalnızca ürün sayfasındaki rozet yerleşimini değerlendirmek içindir; header ve footer gösterilmez.</div></div>`;}

function renderFocused(){
 const canvas=qs('#stageCanvas');if(!canvas||replacing||document.body.classList.contains('ky-profile-preview'))return;
 if(!catalog?.length)return;
 const sample=globalSample();if(!sample.cat||!sample.product)return;
 replacing=true;canvas.innerHTML=mode()==='pdp'?pdpPreview(sample.cat,sample.product):categoryPreview(sample.cat,sample.product);replacing=false;
}
function handleCanvasMutation(){const canvas=qs('#stageCanvas');if(!canvas||replacing)return;if(canvas.querySelector('.ky-focus-wrap'))return;captureLiveSettings(canvas);requestAnimationFrame(renderFocused);}
function refresh(){injectStyles();restoreClassicSidebar();removeThemeControl();handleCanvasMutation();}

const observer=new MutationObserver(()=>refresh());observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('.ky-view-tab,.ky-device-btn,[data-template],#v3TemplateEditor,.ky-slider,.ky-switch,.ky-color-row,.ky-grid-btn'))setTimeout(handleCanvasMutation,40);},true);
document.addEventListener('input',e=>{if(e.target.closest('#panelTexts,#panelTypography,#panelIcons,#panelColors,#panelBorders,#panelSizing,#panelPosition,#panelAnimation,#panelResponsive'))setTimeout(handleCanvasMutation,40);},true);
document.addEventListener('change',e=>{if(e.target.closest('#panelTexts,#panelPosition,#panelResponsive,#panelTemplates'))setTimeout(handleCanvasMutation,40);},true);

(async()=>{injectStyles();restoreClassicSidebar();removeThemeControl();await loadCatalog();setTimeout(handleCanvasMutation,80);setTimeout(handleCanvasMutation,500);})();
})();
