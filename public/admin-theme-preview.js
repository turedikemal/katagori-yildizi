(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const params=new URLSearchParams(location.search);
const shop=(params.get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'').toLowerCase();
const storeUrl=shop==='thegoatz'?'https://thegoatz.co':`https://${shop}.myikas.com`;
let replacing=false;

function restoreClassicSidebar(){
  qsa('#kySidebarNavHead,.ky-sidebar-navhead').forEach(el=>el.remove());
  const menu=qs('#menuList');
  if(!menu)return;
  menu.style.removeProperty('display');
  menu.classList.remove('ky-menu-open');
  const sidebar=qs('.ky-sidebar');
  sidebar?.classList.remove('ky-menu-open');
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
    help.textContent='Rozet şablonunu seçin. Sağdaki canlı önizleme mağazanızın aktif temasını kullanır.';
  }
}

function getMode(){
  return qs('.ky-view-tab.active')?.dataset.view==='pdp'?'pdp':'category';
}

function sampleTexts(){
  const category=qs('#previewCategorySelect option:checked')?.textContent?.trim()||'Kategori';
  const mockTitle=qs('.ky-mock-title')?.textContent?.trim()||'Ürün';
  const badge=qs('.ky-v3-badge')?.textContent?.trim()||'En Çok Satan 1. Ürün';
  return {category,mockTitle,badge};
}

function categoryDemo(text){
  return `<div class="ky-live-demo ky-live-category-demo"><div class="ky-live-product-image"></div><div class="ky-live-category-ribbon"><span class="ky-live-medal">♙</span><span>${escapeHtml(text||'En Çok Satan 1. Ürün')}</span></div></div>`;
}

function pdpDemo(category){
  return `<div class="ky-live-demo ky-live-pdp-demo"><span class="ky-live-pdp-icon">♙</span><a>${escapeHtml(category)}</a><span>Kategorisinde</span><span class="ky-live-pdp-badge"><span>✓</span> En çok satan #1. ürün <b>›</b></span></div>`;
}

function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function renderLivePreview(){
  const canvas=qs('#stageCanvas');
  if(!canvas||replacing||document.body.classList.contains('ky-profile-preview'))return;
  if(canvas.querySelector('.ky-live-theme-preview'))return;
  const mode=getMode();
  const texts=sampleTexts();
  replacing=true;
  canvas.innerHTML=`<div class="ky-live-theme-preview ${mode==='pdp'?'is-pdp':'is-category'}"><div class="ky-live-theme-label"><span class="ky-live-dot"></span><strong>Mağazanın aktif teması</strong><span>${escapeHtml(storeUrl.replace(/^https?:\/\//,''))}</span></div><div class="ky-live-browser"><iframe class="ky-live-store-frame" src="${escapeHtml(storeUrl)}" title="Mağaza teması canlı önizleme" loading="eager"></iframe><div class="ky-live-overlay">${mode==='pdp'?pdpDemo(texts.category):categoryDemo(texts.badge)}</div></div></div>`;
  replacing=false;
}

function refresh(){
  restoreClassicSidebar();
  removeFakeThemeSelector();
  renderLivePreview();
}

const observer=new MutationObserver(()=>{
  if(replacing)return;
  requestAnimationFrame(refresh);
});
observer.observe(document.body,{childList:true,subtree:true});

document.addEventListener('click',e=>{
  if(e.target.closest('.ky-view-tab,.ky-device-btn,.ky-menu-card,[data-template],#v3TemplateEditor,.ky-slider,.ky-switch,.ky-color-row')){
    setTimeout(()=>{const canvas=qs('#stageCanvas');if(canvas)canvas.querySelector('.ky-live-theme-preview')?.remove();renderLivePreview();},30);
  }
},true);

document.addEventListener('change',e=>{
  if(e.target.closest('#previewCategorySelect,#panelTexts,#panelPosition,#panelResponsive')){
    setTimeout(()=>{const canvas=qs('#stageCanvas');if(canvas)canvas.querySelector('.ky-live-theme-preview')?.remove();renderLivePreview();},30);
  }
},true);

refresh();
setTimeout(refresh,250);
setTimeout(refresh,900);
})();
