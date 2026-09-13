(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

function ensureStyles(){
  if(qs('#kyClassicSidebarStyles')) return;
  const style=document.createElement('style');
  style.id='kyClassicSidebarStyles';
  style.textContent=`
    #kySidebarNavHead,.ky-sidebar-navhead{display:none!important}
    #menuList{display:flex!important;flex-direction:column!important;gap:8px!important}
    body.ky-panel-open #menuList{display:none!important}
    .ky-subpanel{display:none!important}
    .ky-subpanel.active{display:block!important}
    .ky-subpanel-header{display:flex!important;align-items:center!important;gap:8px!important;padding:14px 16px!important;position:sticky!important;top:0!important;z-index:5!important;background:#fff!important;border-bottom:1px solid rgba(36,58,139,.08)!important}
    .ky-subpanel-header .ky-btn-back{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important}
    .ky-menu-card .ky-accordion-indicator{margin-left:auto!important}
    .ky-menu-card .ky-accordion-indicator i{display:none!important}
    .ky-menu-card .ky-accordion-indicator:after{content:'›';font-size:18px;color:rgba(36,58,139,.45)}
  `;
  document.head.appendChild(style);
}

function movePanelsOut(){
  const menu=qs('#menuList');
  const content=qs('.ky-sidebar-content');
  if(!menu||!content) return;
  const panels=qsa('.ky-subpanel');
  panels.forEach(panel=>{
    panel.classList.remove('ky-accordion-panel');
    if(panel.parentElement===menu) content.appendChild(panel);
  });
}

function showMenu(){
  document.body.classList.remove('ky-panel-open');
  qsa('.ky-subpanel').forEach(p=>p.classList.remove('active'));
  qsa('.ky-menu-card').forEach(c=>{c.classList.remove('active');c.setAttribute('aria-expanded','false');});
  sessionStorage.removeItem('ky-active-panel');
}

function openPanel(id){
  const panel=qs('#'+CSS.escape(id));
  if(!panel) return;
  document.body.classList.add('ky-panel-open');
  qsa('.ky-subpanel').forEach(p=>p.classList.toggle('active',p===panel));
  qsa('.ky-menu-card').forEach(c=>{
    const active=c.dataset.target===id;
    c.classList.toggle('active',active);
    c.setAttribute('aria-expanded',active?'true':'false');
  });
  sessionStorage.setItem('ky-active-panel',id);
}

function bind(){
  ensureStyles();
  movePanelsOut();
  const menu=qs('#menuList');
  if(!menu||menu.dataset.kyClassicBound) return;
  menu.dataset.kyClassicBound='1';
  menu.addEventListener('click',e=>{
    const card=e.target.closest('.ky-menu-card');
    if(!card) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openPanel(card.dataset.target);
  },true);
  document.addEventListener('click',e=>{
    const back=e.target.closest('.ky-btn-back');
    if(!back) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showMenu();
  },true);

  const saved=sessionStorage.getItem('ky-active-panel');
  if(saved&&qs('#'+CSS.escape(saved))) openPanel(saved); else showMenu();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
setTimeout(bind,200);
setTimeout(bind,800);
})();
