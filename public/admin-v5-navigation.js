(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function panelLabel(target){return qs(`.ky-menu-card[data-target="${target}"] .ky-menu-title`)?.textContent?.trim()||'Genel görünüm';}
function activePanelId(){return qs('.ky-subpanel.active')?.id||sessionStorage.getItem('ky-active-panel')||'panelDashboard';}
function sync(target){qsa('.ky-menu-card').forEach(c=>c.classList.toggle('ky-current',c.dataset.target===target));const t=qs('#kySidebarCurrentTitle');if(t)t.textContent=panelLabel(target);}
function closeMenu(){const s=qs('.ky-sidebar');if(!s)return;s.classList.remove('ky-menu-open');qs('#kySidebarMenuButton')?.setAttribute('aria-expanded','false');}
function toggleMenu(){const s=qs('.ky-sidebar');if(!s)return;const open=!s.classList.contains('ky-menu-open');s.classList.toggle('ky-menu-open',open);qs('#kySidebarMenuButton')?.setAttribute('aria-expanded',open?'true':'false');}
function mount(){
 const sidebar=qs('.ky-sidebar'),content=qs('.ky-sidebar-content'),menu=qs('#menuList');if(!sidebar||!content||!menu)return;
 if(!qs('#kySidebarNavHead')){const h=document.createElement('div');h.id='kySidebarNavHead';h.className='ky-sidebar-navhead';h.innerHTML='<div class="ky-sidebar-navcopy"><span class="ky-sidebar-eyebrow">Rozet ayarları</span><strong id="kySidebarCurrentTitle">Genel görünüm</strong></div><button id="kySidebarMenuButton" class="ky-sidebar-menu-btn" type="button" aria-label="Tüm ayarları aç" aria-expanded="false"><span></span><span></span><span></span></button>';content.insertBefore(h,menu);qs('#kySidebarMenuButton').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleMenu();});}
 sidebar.classList.add('ky-nav-ready');sync(activePanelId());
 if(!menu.dataset.kyNavBound){menu.dataset.kyNavBound='1';menu.addEventListener('click',e=>{const card=e.target.closest('.ky-menu-card');if(!card)return;sync(card.dataset.target);setTimeout(closeMenu,0);});document.addEventListener('click',e=>{if(sidebar.classList.contains('ky-menu-open')&&!e.target.closest('.ky-sidebar'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});}
 qsa('.ky-subpanel').forEach(p=>{if(p.dataset.kyNavObserved)return;p.dataset.kyNavObserved='1';new MutationObserver(()=>{if(p.classList.contains('active'))sync(p.id);}).observe(p,{attributes:true,attributeFilter:['class']});});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();setTimeout(mount,250);setTimeout(mount,900);
})();
