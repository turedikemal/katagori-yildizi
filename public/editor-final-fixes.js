/* Kategori Yildizi — final interaction/stability fixes */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const shop=(new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');
const PREMIUM_TEMPLATES=new Set(['premium-aurora','premium-prism','premium-nebula','premium-liquid','premium-photon','premium-hologram','premium-comet','premium-spectrum','premium-quantum','premium-electric']);
const PREMIUM_ICON_PALETTES={
 'premium-crown-orbit':['#243a8b','#f2b84b'],
 'premium-trophy-glow':['#1f3a8a','#ffd166'],
 'premium-medal-spin':['#2447a8','#f4b942'],
 'premium-flame-winner':['#d9472b','#ffb23e'],
 'premium-diamond-shine':['#4f46e5','#67e8f9'],
 'premium-rocket-rank':['#243a8b','#f97316'],
 'premium-shield-spark':['#2347a2','#38bdf8'],
 'premium-laurel-star':['#243a8b','#eab308'],
 'premium-bolt-ring':['#3b47a8','#22d3ee'],
 'premium-gift-pop':['#3b4aa5','#ef5da8'],
 'premium-heart-crown':['#243a8b','#f59e0b'],
 'premium-check-burst':['#243a8b','#f2b84b']
};
let syncing=false,scheduled=false,categoryBusy=false;
let visibility={category:{desktop:true,mobile:true},product:{desktop:true,mobile:true}};

function activeSurface(){return q('.ky-view-tab.active')?.dataset.view==='pdp'?'product':'category'}
function activeDevice(){return q('.ky-device-btn.active[data-device]')?.dataset.device||'desktop'}
function activeTemplate(){
 const card=q('#v3Templates .ky-template-card-v3.active[data-template]');
 if(card)return card.dataset.template||'';
 const badge=q('#stageCanvas .ky-v3-badge[class*="tpl-"]');
 const cls=badge&&[...badge.classList].find(x=>x.startsWith('tpl-'));
 return cls?cls.slice(4):'';
}
function premiumSelected(){return PREMIUM_TEMPLATES.has(activeTemplate())}
function placement(){return q('#v3CardLocation')?.value||'image_overlay'}
function number(id,fallback){const n=Number(q('#'+id)?.value);return Number.isFinite(n)?n:fallback}
function htmlEscape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function injectStyle(){
 if(q('#kyFinalFixesStyle'))return;
 const s=document.createElement('style');s.id='kyFinalFixesStyle';s.textContent=`
 .ky-final-note{margin:8px 0 0;padding:7px 9px;border-radius:8px;background:#f5f7ff;border:1px solid rgba(36,58,139,.10);color:#66739d;font-size:8.7px;line-height:1.45}
 .ky-final-note.premium{background:#fffaf0;border-color:rgba(211,155,33,.24);color:#8b6510}
 .ky-final-disabled{opacity:.42!important;pointer-events:none!important}
 .ky-premium-choice b{width:38px!important;height:38px!important}.ky-premium-choice .ky-premium-icon{font-size:27px!important}.ky-premium-choice{min-height:80px!important}
 .ky-category-global-tools{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 9px;padding:7px;border:1px solid rgba(36,58,139,.10);border-radius:10px;background:#f7f9ff}
 .ky-category-global-tools button{height:30px;border:1px solid rgba(36,58,139,.16);border-radius:8px;background:#fff;color:#243a8b;font-size:8.5px;font-weight:800;cursor:pointer}.ky-category-global-tools button:hover{background:#eef2ff;border-color:#243a8b}
 .ky-category-bulk.ky-final-busy{opacity:.68;pointer-events:none}
 .ky-focus-badge-overlay,.ky-focus-underbar,.ky-focus-insidebar{translate:var(--ky-final-ox,0px) var(--ky-final-oy,0px)!important}
 .ky-focus-underbar .ky-v3-badge,.ky-focus-insidebar .ky-v3-badge{transform:scale(var(--badge-scale,1))!important;transform-origin:center!important;max-width:100%!important}
 .mobile-view .ky-focus-underbar .ky-v3-badge,.mobile-view .ky-focus-insidebar .ky-v3-badge,.mobile-view .ky-focus-badge-overlay .ky-v3-badge{max-width:100%!important;box-sizing:border-box!important}
 @keyframes kyFinalUnderDrop{from{opacity:0;translate:0 -18px}to{opacity:1;translate:0 0}}
 @keyframes kyFinalInsideRise{from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}}
 .ky-focus-underbar.ky-strip-motion{animation:kyFinalUnderDrop var(--ky-final-duration,320ms) cubic-bezier(.22,1,.36,1) both!important}
 .ky-focus-insidebar.ky-strip-motion{animation:kyFinalInsideRise var(--ky-final-duration,320ms) cubic-bezier(.22,1,.36,1) both!important}
 .ky-page-visibility-message{display:grid;place-items:center;min-height:360px;border:1px dashed rgba(36,58,139,.20);border-radius:14px;background:#fbfcff;color:#66739d;text-align:center;font-size:11px}.ky-page-visibility-message strong{display:block;color:#243a8b;font-size:15px;margin-bottom:5px}
 `;document.head.appendChild(s);
}

function note(host,id,text,premium=false){
 if(!host)return;let n=q('#'+id,host);if(!n){n=document.createElement('div');n.id=id;n.className='ky-final-note';host.appendChild(n)}n.classList.toggle('premium',premium);n.textContent=text;
}
function setDisabled(ids,disabled){ids.forEach(id=>{const el=q('#'+id);if(!el)return;el.disabled=disabled;el.closest('.ky-field,.ky-toggle-wrap')?.classList.toggle('ky-final-disabled',disabled)})}

function enforcePlacementRules(){
 const loc=placement(),strip=loc==='image_bottom_bar'||loc==='image_inside_bottom_bar';
 const entry=q('#v3Entry'),hover=q('#v3Hover');
 if(strip){
  const forced=loc==='image_bottom_bar'?'slide-down':'slide-up';
  if(entry&&entry.value!==forced){entry.value=forced;window.handleInput?.('animation.entry',forced)}
  if(hover&&hover.value!=='none'){hover.value='none';window.handleInput?.('animation.hover','none')}
  if(entry)entry.disabled=true;if(hover)hover.disabled=true;
  entry?.closest('.ky-field')?.classList.add('ky-final-disabled');hover?.closest('.ky-field')?.classList.add('ky-final-disabled');
  note(q('#panelAnimation .ky-group'),'kyStripAnimationNote',loc==='image_bottom_bar'?'Görsel Alt Şeridi yalnızca yukarıdan aşağı giriş yapar. Hover efekti uygulanmaz.':'Görsel İçinde Alt Şerit yalnızca aşağıdan yukarı giriş yapar. Hover efekti uygulanmaz.');
 }else{
  if(entry)entry.disabled=false;if(hover)hover.disabled=false;
  entry?.closest('.ky-field')?.classList.remove('ky-final-disabled');hover?.closest('.ky-field')?.classList.remove('ky-final-disabled');
  q('#kyStripAnimationNote')?.remove();
 }
}

function enforceTemplateRules(){
 const premium=premiumSelected();
 setDisabled(['v3PadX','v3PadY','v3Scale'],premium);
 const sizing=q('#panelSizing .ky-group');
 if(premium)note(sizing,'kySizingTemplateNote','Boyutlar & boşluklar yalnızca normal şablonlarda kullanılabilir. Premium şablonların oranları kendi tasarım sistemleri tarafından korunur.',true);else q('#kySizingTemplateNote')?.remove();
 const colors=q('#panelColors .ky-group');
 if(premium){
  setDisabled(['v3Gradient','v3Grad1Picker','v3Grad1Hex','v3Grad2Picker','v3Grad2Hex','v3GradAngle'],true);
  note(colors,'kyPremiumGradientNote','Premium şablonlarda standart gradyan kullanılmaz. Her premium şablon kendi hareketli renk/ışık sistemini kullanır; Ana Renk, Metin ve Vurgu / Işık Rengi alanları kullanılabilir.',true);
 }else{
  q('#kyPremiumGradientNote')?.remove();
  // Normal şablonlardaki destek durumu mevcut şablon yetenek sistemi tarafından yönetilir.
 }
}

function applyFocusedPreviewSettings(){
 const canvas=q('#stageCanvas');if(!canvas)return;
 const ox=number('v3OffsetX',0),oy=number('v3OffsetY',0),px=number('v3PadX',10),py=number('v3PadY',5),scale=number('v3Scale',100)/100,duration=number('v3Duration',320);
 qa('.ky-focus-badge-overlay,.ky-focus-underbar,.ky-focus-insidebar',canvas).forEach(w=>{w.style.setProperty('--ky-final-ox',ox+'px');w.style.setProperty('--ky-final-oy',oy+'px');w.style.setProperty('--ky-final-duration',duration+'ms')});
 const premium=premiumSelected();
 qa('.ky-focus-wrap .ky-v3-badge',canvas).forEach(b=>{
  if(!premium){b.style.setProperty('--badge-px',px+'px');b.style.setProperty('--badge-py',py+'px');b.style.setProperty('--badge-scale',String(scale))}
 });
 const loc=placement();
 qa('.ky-focus-underbar,.ky-focus-insidebar',canvas).forEach(w=>w.classList.remove('ky-strip-motion'));
 if(loc==='image_bottom_bar')qa('.ky-focus-underbar',canvas).forEach(w=>{w.classList.add('ky-strip-motion');const b=q('.ky-v3-badge',w);if(b){[...b.classList].filter(x=>x.startsWith('ky-entry-')||x.startsWith('ky-hover-')).forEach(x=>b.classList.remove(x))}});
 if(loc==='image_inside_bottom_bar')qa('.ky-focus-insidebar',canvas).forEach(w=>{w.classList.add('ky-strip-motion');const b=q('.ky-v3-badge',w);if(b){[...b.classList].filter(x=>x.startsWith('ky-entry-')||x.startsWith('ky-hover-')).forEach(x=>b.classList.remove(x))}});
}

function applyPremiumIconDefault(type){
 const palette=PREMIUM_ICON_PALETTES[type];if(!palette)return;
 window.handleInput?.('icon.mode','color');window.handleInput?.('icon.color',palette[0]);window.handleInput?.('icon.accentColor',palette[1]);
 setTimeout(()=>{
  q('#v3IconColor')?.classList.add('active');q('#v3IconMono')?.classList.remove('active');
  const set=(id,v)=>{const p=q('#'+id+'Picker'),h=q('#'+id+'Hex');if(p)p.value=v;if(h)h.value=v};set('v3IconC1',palette[0]);set('v3IconC2',palette[1]);
 },35);
}

function enhanceCategoryUi(){
 const host=q('#v3Categories');if(!host)return;
 let tools=q(':scope > .ky-category-global-tools',host);if(!tools){tools=document.createElement('div');tools.className='ky-category-global-tools';tools.innerHTML='<button type="button" data-ky-open-all-categories>Tüm kategorileri aç</button><button type="button" data-ky-close-all-categories>Tümünü kapat</button>';host.prepend(tools)}
 qa('.ky-category-card',host).forEach(card=>{const head=q('.ky-category-head',card);if(!head)return;if(!q('.ky-category-arrow',head)){const a=document.createElement('span');a.className='ky-category-arrow';a.textContent='⌄';head.appendChild(a)}head.setAttribute('role','button');head.tabIndex=0});
}
async function setCategoryProducts(card,show){
 if(!card||categoryBusy)return;const boxes=qa('input[data-hide-product]',card);if(!boxes.length)return;
 categoryBusy=true;const bar=q('.ky-category-bulk',card);bar?.classList.add('ky-final-busy');
 try{
  for(const box of boxes){const targetHidden=!show;if(box.checked===targetHidden)continue;box.checked=targetHidden;box.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,35));}
 }finally{categoryBusy=false;bar?.classList.remove('ky-final-busy')}
}

async function loadVisibility(){
 try{const r=await fetch(`/api/admin/settings?shop=${encodeURIComponent(shop)}&visibility=1`,{cache:'no-store'}),d=await r.json();const v=d?.draftConfig?.pageVisibility;if(v)visibility={category:{desktop:v.category?.desktop!==false,mobile:v.category?.mobile!==false},product:{desktop:v.product?.desktop!==false,mobile:v.product?.mobile!==false}}}catch{}
 syncVisibilityControls();applyPageVisibility();
}
function syncVisibilityControls(){
 const s=activeSurface();const d=q('#v3Desktop'),m=q('#v3Mobile');if(d)d.checked=visibility[s].desktop!==false;if(m)m.checked=visibility[s].mobile!==false;
}
function setVisibility(kind,value){const s=activeSurface();visibility[s][kind]=!!value;window.handleInput?.(`pageVisibility.${s}.${kind}`,!!value);applyPageVisibility()}
function applyPageVisibility(){
 const canvas=q('#stageCanvas');if(!canvas)return;const enabled=visibility[activeSurface()][activeDevice()]!==false;let msg=q('.ky-page-visibility-message',canvas);
 qa(':scope > .ky-focus-wrap',canvas).forEach(el=>el.style.display=enabled?'':'none');
 if(enabled){msg?.remove();return}
 if(!msg){msg=document.createElement('div');msg.className='ky-page-visibility-message';canvas.appendChild(msg)}msg.innerHTML=`<div><strong>${activeDevice()==='desktop'?'Masaüstü':'Mobil'} gösterimi kapalı</strong>${activeSurface()==='product'?'Ürün':'Kategori'} sayfası için Cihaz Görünürlüğü bölümünden tekrar açabilirsiniz.</div>`;
}

async function sendSupportAuthoritative(){
 const err=q('#v3SupportError'),btn=q('#v3SupportSend');if(err){err.classList.remove('show');err.textContent=''}
 try{
  const subject=q('#v3SupportSubject')?.value.trim()||'',message=q('#v3SupportMessage')?.value.trim()||'',category=q('#v3SupportCategory')?.value||'OTHER';
  if(subject.length<3)throw new Error('Konu en az 3 karakter olmalı.');if(message.length<10)throw new Error('Mesaj en az 10 karakter olmalı.');
  if(btn){btn.disabled=true;btn.textContent='Gönderiliyor…'}
  const r=await fetch(`/api/support?shop=${encodeURIComponent(shop)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shop,category,subject,message})});const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.message||'Destek talebi gönderilemedi.');
  if(d.emailDelivered!==true)throw new Error('Talep kaydedildi ancak e-posta hello@thegoatzstudio.com adresine teslim edilemedi. SMTP bağlantısı henüz tamamlanmamış.');
  q('#supportDialog')?.close();showToast(d.ticketNumber?`Destek talebi e-posta ile gönderildi: ${d.ticketNumber}`:'Destek talebi e-posta ile gönderildi.');
 }catch(e){if(err){err.textContent=e.message;err.classList.add('show')}}finally{if(btn){btn.disabled=false;btn.textContent='Destek talebi gönder'}}
}
function showToast(text){let t=q('#kyFinalToast');if(!t){t=document.createElement('div');t.id='kyFinalToast';t.className='ky-toast';document.body.appendChild(t)}t.textContent=text;t.style.background='#17213a';t.style.display='block';clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.style.display='none',3200)}

function sync(){if(syncing)return;syncing=true;try{injectStyle();enforcePlacementRules();enforceTemplateRules();enhanceCategoryUi();applyFocusedPreviewSettings();syncVisibilityControls();applyPageVisibility()}finally{syncing=false}}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}

function bind(){
 document.addEventListener('click',e=>{
  const premium=e.target.closest('#v3Icons [data-icon^="premium-"]');if(premium)setTimeout(()=>applyPremiumIconDefault(premium.dataset.icon),0);
  const head=e.target.closest('#v3Categories .ky-category-head');if(head){e.preventDefault();e.stopImmediatePropagation();const card=head.closest('.ky-category-card');card?.classList.toggle('open');if(card?.classList.contains('open'))window.selectPreviewCategory?.(card.dataset.categoryId);return}
  if(e.target.closest('[data-ky-open-all-categories]')){e.preventDefault();e.stopImmediatePropagation();qa('#v3Categories .ky-category-card').forEach(c=>c.classList.add('open'));return}
  if(e.target.closest('[data-ky-close-all-categories]')){e.preventDefault();e.stopImmediatePropagation();qa('#v3Categories .ky-category-card').forEach(c=>c.classList.remove('open'));return}
  const bulk=e.target.closest('.ky-category-bulk-btn');if(bulk){e.preventDefault();e.stopImmediatePropagation();const card=bulk.closest('.ky-category-card');setCategoryProducts(card,bulk.classList.contains('open'));return}
  if(e.target.closest('.ky-view-tab,.ky-device-btn,[data-edit-surface],[data-edit-device],[data-template],#v3Icons [data-icon]'))setTimeout(schedule,55);
 },true);
 document.addEventListener('keydown',e=>{const head=e.target.closest?.('#v3Categories .ky-category-head');if(head&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopImmediatePropagation();head.closest('.ky-category-card')?.classList.toggle('open')}},true);
 document.addEventListener('input',e=>{if(e.target.closest('#panelPosition,#panelSizing,#panelAnimation,#panelTemplates,#panelIcons,#panelColors'))schedule()},true);
 document.addEventListener('change',e=>{
  if(e.target?.id==='v3Desktop'||e.target?.id==='v3Mobile'){e.preventDefault();e.stopImmediatePropagation();setVisibility(e.target.id==='v3Desktop'?'desktop':'mobile',e.target.checked);return}
  if(e.target.closest('#panelPosition,#panelSizing,#panelAnimation,#panelTemplates,#panelIcons,#panelColors'))setTimeout(schedule,25);
 },true);
}
function observe(){const canvas=q('#stageCanvas'),cats=q('#v3Categories');if(canvas)new MutationObserver(schedule).observe(canvas,{childList:true,subtree:true});if(cats)new MutationObserver(schedule).observe(cats,{childList:true,subtree:true})}
function start(){injectStyle();bind();observe();loadVisibility();schedule();setTimeout(schedule,250);setTimeout(schedule,800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
