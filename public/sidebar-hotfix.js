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
    #menuList>.ky-menu-card{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;flex:0 0 auto!important;width:100%!important}
    #menuList>.ky-menu-card[hidden]{display:flex!important}
    #menuList>.ky-accordion-panel{position:relative!important;width:100%!important;margin:-5px 0 3px!important;padding:13px!important;border:1px solid rgba(36,58,139,.12)!important;border-radius:0 0 12px 12px!important;background:#f8faff!important;box-shadow:inset 3px 0 0 #243a8b!important}
    #menuList>.ky-accordion-panel:not(.active){display:none!important}
    #menuList>.ky-accordion-panel.active{display:block!important}
    #menuList>.ky-accordion-panel .ky-subpanel-header{display:none!important}
    #menuList>.ky-menu-card.active{background:linear-gradient(135deg,#eef2ff,#f8f9ff)!important;border-color:rgba(36,58,139,.28)!important}
    #menuList>.ky-menu-card>.ky-accordion-indicator{display:flex!important;width:24px!important;height:24px!important;border-radius:7px!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:3px!important;background:#f1f4fb!important;border:1px solid rgba(36,58,139,.11)!important}
    #menuList>.ky-menu-card>.ky-accordion-indicator i{display:block!important;width:10px!important;height:1.5px!important;background:#243a8b!important;border-radius:2px!important}
    #menuList>.ky-menu-card.active>.ky-accordion-indicator{background:#243a8b!important;transform:rotate(90deg)!important}
    #menuList>.ky-menu-card.active>.ky-accordion-indicator i{background:#fff!important}
  `;
  document.head.appendChild(style);
}

function ensureIndicator(card){
  let indicator=card.querySelector(':scope > .ky-accordion-indicator');
  if(!indicator){
    indicator=card.lastElementChild;
    if(indicator){
      indicator.className='ky-accordion-indicator';
      indicator.innerHTML='<i></i><i></i><i></i>';
    }
  }
}

function repair(){
  if(repairing) return;
  const menu=qs('#menuList');
  if(!menu) return;
  repairing=true;
  try{
    injectStyles();
    menu.style.setProperty('display','flex','important');
    menu.classList.add('ky-menu-list');
    qsa('#kySidebarNavHead,.ky-sidebar-navhead').forEach(el=>el.remove());
    qs('.ky-sidebar')?.classList.remove('ky-menu-open','ky-nav-ready');

    const cards=qsa('.ky-menu-card',menu);
    cards.forEach(card=>{
      card.style.removeProperty('display');
      card.style.removeProperty('visibility');
      card.removeAttribute('hidden');
      ensureIndicator(card);
      const id=card.dataset.target;
      const panel=id?qs('#'+CSS.escape(id)):null;
      if(!panel) return;
      panel.classList.add('ky-accordion-panel');
      if(panel.parentElement!==menu || panel.previousElementSibling!==card){
        menu.insertBefore(panel,card.nextSibling);
      }
      card.setAttribute('aria-expanded',panel.classList.contains('active')?'true':'false');
      card.classList.toggle('active',panel.classList.contains('active'));
    });
  } finally {
    repairing=false;
  }
}

function schedule(){
  if(scheduled||repairing) return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;repair();});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',repair,{once:true});
else repair();
setTimeout(repair,150);
setTimeout(repair,700);
setTimeout(repair,1600);

const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
})();
