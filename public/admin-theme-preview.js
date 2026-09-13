(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const params=new URLSearchParams(location.search);
const shop=(params.get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'').toLowerCase();
const storeUrl=shop==='thegoatz'?'https://thegoatz.co':`https://${shop}.myikas.com`;
let replacing=false;
let lastSample={category:'Kategori',product:'Ürün',badgeHtml:'',badgeText:'En Çok Satan 1. Ürün',pdpPrefix:''};

function slugify(value){
  return String(value||'')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/ı/g,'i')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

function restoreClassicSidebar(){
  qsa('#kySidebarNavHead,.ky-sidebar-navhead').forEach(el=>el.remove());
  const menu=qs('#menuList');
  if(!menu)return;
  menu.style.removeProperty('display');
  menu.classList.remove('ky-menu-open');
  const sidebar=qs('.ky-sidebar');
  sidebar?.classList.remove('ky-menu-open','ky-nav-ready');
  qsa('.ky-menu-card').forEach(card=>{
    card.style.removeProperty('display');
    card.style.removeProperty('visibility');
  });
}

function removeFakeThemeSelector(){
  qsa('.ky-theme-adapter').forEach(el=>el.remove());
  const panel=qs('#panelTemplates');
  const help=panel?.querySelector('.ky-inline-help');
  if(help && /tema kabuğunu|mağaza teması/i.test(help.textContent||'')){
    help.textContent='Rozet şablonunu seçin. Sağdaki alan seçili kategoriyi ve o kategorinin en çok satan ürününü müşterinin kendi mağaza teması üzerinde gösterir.';
  }
}

function getMode(){
  return qs('.ky-view-tab.active')?.dataset.view==='pdp'?'pdp':'category';
}

function captureSample(){
  const category=qs('#previewCategorySelect option:checked')?.textContent?.trim()||lastSample.category||'Kategori';
  const product=qs('.ky-mock-title')?.textContent?.trim()||lastSample.product||'Ürün';
  const badge=qs('.ky-v3-badge');
  const pdpPrefixInput=qs('#v3PdpPrefix');
  const next={
    category,
    product,
    badgeHtml:badge?.outerHTML||lastSample.badgeHtml||'',
    badgeText:badge?.textContent?.trim()||lastSample.badgeText||'En Çok Satan 1. Ürün',
    pdpPrefix:pdpPrefixInput?.value?.trim()||lastSample.pdpPrefix||`${category} Kategorisinde`
  };
  lastSample=next;
  return next;
}

function categoryPath(category){
  const normalized=String(category||'').trim().toLocaleLowerCase('tr-TR');
  if(shop==='thegoatz'){
    const known={
      'seramik ve stoneware tabaklar':'el-yapimi-seramik-tabaklar',
      'mutfak & sofra':'mutfak-sofra',
      'mutfak + sofra':'mutfak-sofra',
      'ev dekorasyon':'ev-dekorasyon',
      'seramik sunum standları':'seramik-sunum-standlari',
      'seramik sepetler':'seramik-sepetler',
      'bardaklar + kupalar':'seramik-bardak-kupa',
      'bardaklar & kupalar':'seramik-bardak-kupa'
    };
    if(known[normalized]) return known[normalized];
  }
  return slugify(category);
}

function targetUrl(mode,sample){
  const path=mode==='pdp'?slugify(sample.product):categoryPath(sample.category);
  return path?`${storeUrl}/${path}`:storeUrl;
}

function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function badgeMarkup(sample){
  if(sample.badgeHtml) return sample.badgeHtml;
  return `<span class="ky-v3-badge" style="--badge-bg:#243a8b;--badge-text:#fff;--badge-radius:999px;--badge-px:10px;--badge-py:6px"><span>${escapeHtml(sample.badgeText)}</span></span>`;
}

function categoryDemo(sample){
  return `<div class="ky-live-demo ky-live-category-demo"><div class="ky-live-category-ribbon">${badgeMarkup(sample)}</div></div>`;
}

function pdpDemo(sample){
  const prefix=sample.pdpPrefix||`${sample.category} Kategorisinde`;
  const categoryText=prefix.replace(/\s*Kategorisinde\s*$/i,'').trim()||sample.category;
  return `<div class="ky-live-demo ky-live-pdp-demo"><span class="ky-live-pdp-icon">♙</span><a>${escapeHtml(categoryText)}</a><span>Kategorisinde</span><span class="ky-live-pdp-badge">${badgeMarkup(sample)}<b>›</b></span></div>`;
}

function ensureFocusStyles(){
  if(qs('#kyFocusedPreviewStyles'))return;
  const style=document.createElement('style');
  style.id='kyFocusedPreviewStyles';
  style.textContent=`
    .ky-live-theme-label{justify-content:space-between!important;padding:0 4px 6px!important}
    .ky-live-theme-label .ky-preview-page-name{font-weight:800;color:#243a8b;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%}
    .ky-live-browser{min-height:720px!important}
    .ky-live-store-frame{width:100%!important;height:100%!important}
    .ky-live-category-demo{left:7%!important;right:auto!important;top:38%!important;width:28%!important;min-width:250px!important;height:250px!important;background:transparent!important;overflow:visible!important}
    .ky-live-category-ribbon{left:0!important;right:0!important;bottom:0!important;background:transparent!important;padding:0!important;display:block!important}
    .ky-live-category-ribbon .ky-v3-badge{width:100%!important;justify-content:center!important;transform-origin:center bottom!important}
    .ky-live-pdp-demo{top:40%!important;left:9%!important;max-width:78%!important}
    .ky-live-pdp-badge{padding:3px!important;border-color:rgba(36,58,139,.15)!important;background:rgba(255,255,255,.96)!important}
    .ky-live-pdp-badge .ky-v3-badge{box-shadow:none!important}
    .mobile-view .ky-live-category-demo{left:7%!important;top:42%!important;width:46%!important;min-width:145px!important;height:190px!important}
    .mobile-view .ky-live-pdp-demo{left:5%!important;top:43%!important;max-width:90%!important}
  `;
  document.head.appendChild(style);
}

function renderLivePreview(){
  const canvas=qs('#stageCanvas');
  if(!canvas||replacing||document.body.classList.contains('ky-profile-preview'))return;
  if(canvas.querySelector('.ky-live-theme-preview'))return;
  const mode=getMode();
  const sample=captureSample();
  const url=targetUrl(mode,sample);
  const pageName=mode==='pdp'?sample.product:sample.category;
  replacing=true;
  canvas.innerHTML=`<div class="ky-live-theme-preview ${mode==='pdp'?'is-pdp':'is-category'}"><div class="ky-live-theme-label"><span><span class="ky-live-dot"></span> <strong>${mode==='pdp'?'Ürün sayfası':'Kategori sayfası'}</strong></span><span class="ky-preview-page-name">${escapeHtml(pageName)}</span></div><div class="ky-live-browser"><iframe class="ky-live-store-frame" src="${escapeHtml(url)}" title="Seçili mağaza sayfası önizleme" loading="eager"></iframe><div class="ky-live-overlay">${mode==='pdp'?pdpDemo(sample):categoryDemo(sample)}</div></div></div>`;
  replacing=false;
}

function rebuildPreview(){
  const canvas=qs('#stageCanvas');
  if(!canvas)return;
  canvas.querySelector('.ky-live-theme-preview')?.remove();
  renderLivePreview();
}

function refresh(){
  restoreClassicSidebar();
  removeFakeThemeSelector();
  ensureFocusStyles();
  renderLivePreview();
}

const observer=new MutationObserver(()=>{
  if(replacing)return;
  requestAnimationFrame(refresh);
});
observer.observe(document.body,{childList:true,subtree:true});

document.addEventListener('click',e=>{
  if(e.target.closest('.ky-view-tab,.ky-device-btn,.ky-menu-card,[data-template],#v3TemplateEditor,.ky-slider,.ky-switch,.ky-color-row,.ky-grid-btn')){
    setTimeout(rebuildPreview,35);
  }
},true);

document.addEventListener('input',e=>{
  if(e.target.closest('#panelTexts,#panelTypography,#panelIcons,#panelColors,#panelBorders,#panelSizing,#panelPosition,#panelAnimation,#panelResponsive')){
    setTimeout(rebuildPreview,35);
  }
},true);

document.addEventListener('change',e=>{
  if(e.target.closest('#previewCategorySelect,#panelTexts,#panelPosition,#panelResponsive,#panelTemplates')){
    setTimeout(rebuildPreview,35);
  }
},true);

refresh();
setTimeout(refresh,250);
setTimeout(refresh,900);
})();
