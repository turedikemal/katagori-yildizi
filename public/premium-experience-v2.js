/* Kategori Yıldızı — Premium UI v2
   Separates Rozetler/Premium and Şablonlar/Premium Şablonlar without changing storefront semantics. */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const PREMIUM_TEMPLATES=new Set(['gradient-pill','split-pill','modern-outline','glass-pill','arc-pill','ribbon-fold','signature-pill','ticket-line']);
let iconTab=sessionStorage.getItem('ky-premium-icon-tab')||'basic';
let templateTab=sessionStorage.getItem('ky-premium-template-tab')||'';
let iconObserver=null,templateObserver=null,scheduled=false;

function makeTabs(kind,firstLabel,secondLabel){
  const tabs=document.createElement('div');
  tabs.className='ky-premium-tabs';
  tabs.dataset.premiumTabs=kind;
  tabs.innerHTML=`<button type="button" data-premium-tab="basic">${firstLabel}</button><button type="button" class="premium" data-premium-tab="premium"><span class="ky-premium-tab-crown">♛</span>${secondLabel}</button>`;
  return tabs;
}
function setTabActive(tabs,mode){qa('[data-premium-tab]',tabs).forEach(b=>b.classList.toggle('active',b.dataset.premiumTab===mode));}

function applyIconTab(){
  const wrap=q('#v3Icons .ky-icon-sections');if(!wrap)return;
  const basic=q('.ky-icon-basic',wrap),premium=q('.ky-icon-premium',wrap);if(!basic||!premium)return;
  const tabs=q('[data-premium-tabs="icons"]');if(!tabs)return;
  basic.hidden=iconTab!=='basic';premium.hidden=iconTab!=='premium';
  wrap.classList.toggle('premium-open',iconTab==='premium');
  setTabActive(tabs,iconTab);
}
function ensureIconTabs(){
  const host=q('#v3Icons'),wrap=q('#v3Icons .ky-icon-sections');if(!host||!wrap)return;
  const basic=q('.ky-icon-basic',wrap),premium=q('.ky-icon-premium',wrap);if(!basic||!premium)return;
  const basicTitle=q('.ky-icon-section-head strong',basic);if(basicTitle)basicTitle.textContent='Rozetler';
  const basicSub=q('.ky-icon-section-head strong + span',basic);if(basicSub)basicSub.textContent='Sade ve günlük kullanım için rozet ikonları';
  const premiumTitle=q('.ky-icon-section-head strong',premium);if(premiumTitle)premiumTitle.innerHTML='Premium Rozetler <span class="ky-premium-crown">♛</span>';
  const premiumSub=q('.ky-icon-section-head strong + span',premium);if(premiumSub)premiumSub.textContent='Hareketli, iki renkli ve yüksek görsel kalite';
  let tabs=q('[data-premium-tabs="icons"]');
  if(!tabs){
    tabs=makeTabs('icons','Rozetler','Premium');
    host.parentNode.insertBefore(tabs,host);
    tabs.addEventListener('click',e=>{const b=e.target.closest('[data-premium-tab]');if(!b)return;iconTab=b.dataset.premiumTab;sessionStorage.setItem('ky-premium-icon-tab',iconTab);applyIconTab();});
  }
  qa('.ky-premium-choice',premium).forEach(choice=>choice.classList.add('ky-premium-gold-frame'));
  applyIconTab();
}

function applyTemplateTab(){
  const host=q('#v3Templates'),tabs=q('[data-premium-tabs="templates"]');if(!host||!tabs)return;
  qa('.ky-template-card-v3[data-template]',host).forEach(card=>{
    const premium=PREMIUM_TEMPLATES.has(card.dataset.template);
    card.classList.toggle('ky-premium-template-choice',premium);
    card.hidden=templateTab==='premium'?!premium:premium;
    if(premium&&!q('.ky-premium-template-mark',card)){
      const mark=document.createElement('span');mark.className='ky-premium-template-mark';mark.innerHTML='<span>♛</span> Premium';card.appendChild(mark);
    }
  });
  setTabActive(tabs,templateTab==='premium'?'premium':'basic');
  host.classList.toggle('premium-open',templateTab==='premium');
}
function ensureTemplateTabs(){
  const host=q('#v3Templates');if(!host)return;
  let tabs=q('[data-premium-tabs="templates"]');
  if(!tabs){
    tabs=makeTabs('templates','Şablonlar','Premium Şablonlar');
    host.parentNode.insertBefore(tabs,host);
    tabs.addEventListener('click',e=>{const b=e.target.closest('[data-premium-tab]');if(!b)return;templateTab=b.dataset.premiumTab==='premium'?'premium':'basic';sessionStorage.setItem('ky-premium-template-tab',templateTab);applyTemplateTab();});
  }
  if(!templateTab){
    const active=q('.ky-template-card-v3.active[data-template]',host);
    templateTab=active&&PREMIUM_TEMPLATES.has(active.dataset.template)?'premium':'basic';
  }
  applyTemplateTab();
}

function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensureIconTabs();ensureTemplateTabs();});}
function observe(){
  const icons=q('#v3Icons'),templates=q('#v3Templates');
  if(icons){iconObserver?.disconnect();iconObserver=new MutationObserver(queue);iconObserver.observe(icons,{childList:true,subtree:true});}
  if(templates){templateObserver?.disconnect();templateObserver=new MutationObserver(queue);templateObserver.observe(templates,{childList:true});}
}

const style=document.createElement('style');style.id='kyPremiumExperienceV2';style.textContent=`
@keyframes kyGoldBorderFlow{0%{background-position:0 50%,0 50%}100%{background-position:0 50%,220% 50%}}
@keyframes kyPremiumCardLift{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
.ky-premium-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 10px;padding:3px;border:1px solid rgba(36,58,139,.10);border-radius:11px;background:#f7f8fc}
.ky-premium-tabs button{min-height:32px;border:1px solid transparent;border-radius:8px;background:transparent;color:#243a8b;font:800 9.5px/1.1 inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:.16s ease}
.ky-premium-tabs button.active:not(.premium){background:#fff;border-color:rgba(36,58,139,.12);box-shadow:0 1px 5px rgba(36,58,139,.07)}
.ky-premium-tabs button.premium{color:#a56b00;border:1px solid transparent;background:linear-gradient(#fffaf0,#fffaf0) padding-box,linear-gradient(90deg,#9c6500,#ffd86f,#fff1a8,#b77800,#ffd86f) border-box;background-size:100% 100%,220% 100%;animation:kyGoldBorderFlow 3.2s linear infinite}
.ky-premium-tabs button.premium.active{background:linear-gradient(#fff6dc,#fff8e9) padding-box,linear-gradient(90deg,#9c6500,#ffe08a,#fff8c9,#b77800,#ffe08a) border-box;box-shadow:0 4px 14px rgba(199,145,30,.12)}
.ky-premium-tab-crown,.ky-premium-crown{color:#e2a61e!important;font-size:14px!important;line-height:1!important;margin:0!important;display:inline-block!important}
.ky-icon-section[hidden],.ky-template-card-v3[hidden]{display:none!important}
#v3Icons .ky-icon-sections{display:block!important}.ky-icon-section{margin:0!important}.ky-icon-basic,.ky-icon-premium{padding:10px!important}
.ky-icon-section-head{margin-bottom:9px!important}.ky-icon-section-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
.ky-icon-premium{background:#fff!important;border-color:rgba(210,160,45,.24)!important}
.ky-icon-premium .ky-icon-choice{min-height:90px!important;padding:9px 7px!important;border-radius:12px!important}
.ky-icon-premium .ky-icon-choice b{width:46px!important;height:46px!important;display:grid!important;place-items:center!important;background:transparent!important}
.ky-icon-premium .ky-premium-icon{font-size:36px!important;width:1.35em!important;height:1.35em!important}
.ky-icon-premium .ky-icon-choice>span:last-of-type{font-size:9px!important;max-width:100%!important;color:#243a8b!important;font-weight:800!important;margin-top:3px!important}
.ky-premium-gold-frame{border:1px solid transparent!important;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#8d5d00,#ffd86f,#fff2b5,#b87800,#ffd86f,#8d5d00) border-box!important;background-size:100% 100%,240% 100%!important;animation:kyGoldBorderFlow 3.4s linear infinite!important;overflow:visible!important}
.ky-premium-gold-frame.active{box-shadow:0 0 0 2px rgba(225,169,45,.18),0 8px 18px rgba(36,58,139,.06)!important}
.ky-premium-choice>i{background:#fff5cf!important;color:#9b6800!important;border:1px solid rgba(215,164,48,.25)!important}
.ky-template-gallery-v3.premium-open .ky-template-card-v3{animation:kyPremiumCardLift 4s ease-in-out infinite}
.ky-premium-template-choice{position:relative!important;border:1px solid transparent!important;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(100deg,#a16a00,#ffd86f,#fff0a4,#b97800,#ffd86f) border-box!important;background-size:100% 100%,230% 100%!important;animation:kyGoldBorderFlow 4s linear infinite!important}
.ky-premium-template-choice .preview{height:72px!important;background:linear-gradient(180deg,#fff,#f6f8ff)!important}
.ky-premium-template-choice .name{padding-right:42px!important}
.ky-premium-template-mark{position:absolute;right:6px;bottom:6px;display:inline-flex!important;align-items:center!important;gap:3px;padding:3px 5px;border-radius:999px;background:#fff7dc;color:#946200;font-size:6.8px;font-weight:900;letter-spacing:.02em;border:1px solid rgba(210,158,36,.22);pointer-events:none}
.ky-premium-template-mark span{color:#e0a31d;font-size:9px}
@media(prefers-reduced-motion:reduce){.ky-premium-tabs button.premium,.ky-premium-gold-frame,.ky-premium-template-choice,.ky-template-gallery-v3.premium-open .ky-template-card-v3{animation:none!important}}
`;document.head.appendChild(style);

function start(){queue();observe();setTimeout(()=>{queue();observe();},180);setTimeout(queue,700);document.addEventListener('click',e=>{if(e.target.closest('[data-template],[data-icon],.ky-device-btn,[data-edit-device]'))setTimeout(queue,40);},true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();