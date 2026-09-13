(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let repairing=false,scheduled=false;

function injectStyles(){
  if(qs('#kySidebarHotfixStyles')) return;
  const style=document.createElement('style');
  style.id='kySidebarHotfixStyles';
  style.textContent=`
    .ky-sidebar-content{overflow-y:auto!important;overflow-x:hidden!important}
    #menuList.ky-menu-list{display:flex!important;flex-direction:column!important;gap:8px!important;width:100%!important}
    #menuList>.ky-menu-card{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;flex:0 0 auto!important;width:100%!important;cursor:pointer!important}
    #menuList>.ky-menu-card[hidden]{display:flex!important}
    #menuList>.ky-accordion-panel{position:relative!important;width:100%!important;margin:-5px 0 3px!important;padding:13px!important;border:1px solid rgba(36,58,139,.12)!important;border-radius:0 0 12px 12px!important;background:#f8faff!important;box-shadow:inset 3px 0 0 #243a8b!important}
    #menuList>.ky-accordion-panel:not(.active){display:none!important}
    #menuList>.ky-accordion-panel.active{display:block!important;visibility:visible!important;opacity:1!important;min-height:40px!important}
    #menuList>.ky-accordion-panel .ky-subpanel-header{display:none!important}
    #menuList>.ky-menu-card.active{background:linear-gradient(135deg,#eef2ff,#f8f9ff)!important;border-color:rgba(36,58,139,.28)!important}
    #menuList>.ky-menu-card>.ky-accordion-indicator{display:flex!important;width:24px!important;height:24px!important;border-radius:7px!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:3px!important;background:#f1f4fb!important;border:1px solid rgba(36,58,139,.11)!important}
    #menuList>.ky-menu-card>.ky-accordion-indicator i{display:block!important;width:10px!important;height:1.5px!important;background:#243a8b!important;border-radius:2px!important}
    #menuList>.ky-menu-card.active>.ky-accordion-indicator{background:#243a8b!important;transform:rotate(90deg)!important}
    #menuList>.ky-menu-card.active>.ky-accordion-indicator i{background:#fff!important}
  `;
  document.head.appendChild(style);
}
function ensureIndicator(card){let indicator=card.querySelector(':scope > .ky-accordion-indicator');if(!indicator){indicator=card.lastElementChild;if(indicator){indicator.className='ky-accordion-indicator';indicator.innerHTML='<i></i><i></i><i></i>';}}}
function normalizeStructure(){const menu=qs('#menuList');if(!menu)return null;injectStyles();menu.style.setProperty('display','flex','important');menu.classList.add('ky-menu-list');qsa('#kySidebarNavHead,.ky-sidebar-navhead').forEach(el=>el.remove());qs('.ky-sidebar')?.classList.remove('ky-menu-open','ky-nav-ready');document.body.classList.remove('ky-panel-open');qsa('.ky-menu-card',menu).forEach(card=>{card.style.removeProperty('display');card.style.removeProperty('visibility');card.removeAttribute('hidden');ensureIndicator(card);const id=card.dataset.target;const panel=id?qs('#'+CSS.escape(id)):null;if(!panel)return;panel.classList.add('ky-accordion-panel');if(panel.parentElement!==menu||panel.previousElementSibling!==card)menu.insertBefore(panel,card.nextSibling);});return menu;}
function closeAll(){const menu=qs('#menuList');if(!menu)return;qsa(':scope > .ky-menu-card',menu).forEach(card=>{card.classList.remove('active');card.setAttribute('aria-expanded','false');});qsa(':scope > .ky-accordion-panel',menu).forEach(panel=>panel.classList.remove('active'));sessionStorage.removeItem('ky-active-panel');}
function togglePanel(id){const menu=normalizeStructure();if(!menu||!id)return;const panel=qs('#'+CSS.escape(id));const card=qs(`.ky-menu-card[data-target="${CSS.escape(id)}"]`,menu);if(!panel||!card)return;const wasOpen=panel.classList.contains('active');qsa(':scope > .ky-menu-card',menu).forEach(c=>{c.classList.remove('active');c.setAttribute('aria-expanded','false');});qsa(':scope > .ky-accordion-panel',menu).forEach(p=>p.classList.remove('active'));if(wasOpen){sessionStorage.removeItem('ky-active-panel');return;}panel.classList.add('active');card.classList.add('active');card.setAttribute('aria-expanded','true');sessionStorage.setItem('ky-active-panel',id);requestAnimationFrame(()=>panel.scrollIntoView({block:'nearest',behavior:'smooth'}));}
function repair(){if(repairing)return;repairing=true;try{const menu=normalizeStructure();if(!menu)return;const active=qsa(':scope > .ky-accordion-panel.active',menu);if(active.length>1)active.slice(1).forEach(p=>p.classList.remove('active'));const activeId=active[0]?.id||'';qsa(':scope > .ky-menu-card',menu).forEach(card=>{const isActive=card.dataset.target===activeId;card.classList.toggle('active',isActive);card.setAttribute('aria-expanded',isActive?'true':'false');});}finally{repairing=false;}}
function bind(){const menu=normalizeStructure();if(!menu||menu.dataset.kyHotfixBound)return;menu.dataset.kyHotfixBound='1';menu.addEventListener('click',e=>{const card=e.target.closest('.ky-menu-card');if(!card||!menu.contains(card))return;e.preventDefault();e.stopImmediatePropagation();togglePanel(card.dataset.target);},true);menu.addEventListener('keydown',e=>{const card=e.target.closest('.ky-menu-card');if(!card||!menu.contains(card)||(e.key!=='Enter'&&e.key!==' '))return;e.preventDefault();e.stopImmediatePropagation();togglePanel(card.dataset.target);},true);closeAll();}
function schedule(){if(scheduled||repairing)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;repair();});}
function loadIconPacks(){
  let s=document.querySelector('script[data-ky-custom-icons]');
  if(!s){s=document.createElement('script');s.src='/custom-bestseller-icons.js?v=20260913-2';s.dataset.kyCustomIcons='1';document.body.appendChild(s);}
  if(!document.querySelector('script[data-ky-custom-preview]')){
    const p=document.createElement('script');p.src='/custom-icon-preview-fix.js?v=20260913-1';p.dataset.kyCustomPreview='1';document.body.appendChild(p);
  }
  if(!document.querySelector('script[data-ky-premium-icons]')){
    const p=document.createElement('script');p.src='/premium-icon-pack.js?v=20260913-1';p.dataset.kyPremiumIcons='1';document.body.appendChild(p);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();repair();loadIconPacks();},{once:true});else{bind();repair();loadIconPacks();}
setTimeout(()=>{bind();repair();loadIconPacks();},200);setTimeout(()=>{bind();repair();loadIconPacks();},800);setTimeout(()=>{bind();repair();},1600);
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
})();
