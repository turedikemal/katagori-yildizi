(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

function panelLabel(target){
  const card=qs(`.ky-menu-card[data-target="${target}"]`);
  return card?.querySelector('.ky-menu-title')?.textContent?.trim() || 'Rozet ayarları';
}

function currentTarget(){
  const active=qs('.ky-subpanel.active');
  return active?.id || sessionStorage.getItem('ky-active-panel') || 'panelDashboard';
}

function syncCurrentCard(target){
  qsa('.ky-menu-card').forEach(card=>card.classList.toggle('ky-current',card.dataset.target===target));
  const title=qs('#kySidebarCurrentTitle');
  if(title) title.textContent=panelLabel(target);
}

function closeMenu(){
  const sidebar=qs('.ky-sidebar');
  if(!sidebar)return;
  sidebar.classList.remove('ky-menu-open');
  qs('#kySidebarMenuButton')?.setAttribute('aria-expanded','false');
}

function toggleMenu(){
  const sidebar=qs('.ky-sidebar');
  if(!sidebar)return;
  const open=!sidebar.classList.contains('ky-menu-open');
  sidebar.classList.toggle('ky-menu-open',open);
  qs('#kySidebarMenuButton')?.setAttribute('aria-expanded',open?'true':'false');
}

function mountNavigation(){
  const sidebar=qs('.ky-sidebar');
  const content=qs('.ky-sidebar-content');
  const menu=qs('#menuList');
  if(!sidebar||!content||!menu)return;

  if(!qs('#kySidebarNavHead')){
    const head=document.createElement('div');
    head.id='kySidebarNavHead';
    head.className='ky-sidebar-navhead';
    head.innerHTML=`<div class="ky-sidebar-navcopy"><span class="ky-sidebar-eyebrow">Rozet ayarları</span><strong id="kySidebarCurrentTitle"></strong></div><button id="kySidebarMenuButton" class="ky-sidebar-menu-btn" type="button" aria-label="Tüm ayar menülerini aç" aria-expanded="false"><span></span><span></span><span></span></button>`;
    content.insertBefore(head,menu);
    qs('#kySidebarMenuButton').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleMenu();});
  }

  const target=currentTarget();
  syncCurrentCard(target);

  if(!qs('.ky-subpanel.active')){
    const card=qs(`.ky-menu-card[data-target="${target}"]`)||qs('.ky-menu-card[data-target="panelDashboard"]');
    if(card) card.click();
  }

  menu.addEventListener('click',e=>{
    const card=e.target.closest('.ky-menu-card');
    if(!card)return;
    syncCurrentCard(card.dataset.target);
    setTimeout(closeMenu,0);
  });

  document.addEventListener('click',e=>{
    if(!sidebar.classList.contains('ky-menu-open'))return;
    if(!e.target.closest('.ky-sidebar'))closeMenu();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

  const observer=new MutationObserver(()=>{
    const active=qs('.ky-subpanel.active');
    if(active) syncCurrentCard(active.id);
  });
  qsa('.ky-subpanel').forEach(panel=>observer.observe(panel,{attributes:true,attributeFilter:['class']}));
}

function repairProductImages(){
  qsa('.ky-mock-img-wrap>img,.ky-pdp-gallery>img').forEach(img=>{
    const reveal=()=>{
      if(!img.getAttribute('src')||!img.naturalWidth)return;
      img.style.removeProperty('display');
      img.style.removeProperty('visibility');
      img.parentElement?.querySelector('.ky-img-fallback')?.remove();
    };
    if(!img.dataset.kyV5ImageBound){
      img.dataset.kyV5ImageBound='1';
      img.addEventListener('load',reveal);
    }
    if(img.complete) reveal();
  });
}

function boot(){mountNavigation();repairProductImages();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,250);
setTimeout(boot,900);
setInterval(repairProductImages,2500);
})();
