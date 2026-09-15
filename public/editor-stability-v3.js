/* Kategori Yildizi — authoritative editor stability layer v4 */
(function(){
'use strict';
window.__KY_EDITOR_STABILITY_V4__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const shop=(new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');
const RELAY='https://review-hub-production-9515.up.railway.app/api/support-relay';
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
const BASIC_GRADIENT=new Set(['navy-pill','split-pill','eco-clean','arc-pill','rank-tab','color-block','understated']);
const RANGE_PATHS={
 v3PadX:'styling.paddingX',v3PadY:'styling.paddingY',v3Scale:'styling.scale',
 v3OffsetX:'placements.offsetX',v3OffsetY:'placements.offsetY',
 v3Duration:'animation.durationMs',v3Radius:'styling.borderRadius',
 v3BorderWidth:'styling.borderWidth',v3Opacity:'styling.opacity',
 v3IconSize:'icon.size'
};

let scheduled=false;
let expandMode=null;
let openCategories=new Set();
let stripPlayPending=false;
let visibility={category:{desktop:true,mobile:true},product:{desktop:true,mobile:true}};
let catalog=[];
let observing=false;

const surface=()=>q('.ky-view-tab.active')?.dataset.view==='pdp'?'product':'category';
const device=()=>q('.ky-device-btn.active[data-device]')?.dataset.device||'desktop';
const placement=()=>q('#v3CardLocation')?.value||'image_overlay';
const num=(id,fallback)=>{const v=Number(q('#'+id)?.value);return Number.isFinite(v)?v:fallback};
const templateId=()=>{
 const card=q('#v3Templates [data-template].active');
 if(card?.dataset.template)return card.dataset.template;
 const badge=q('#stageCanvas .ky-v3-badge[class*="tpl-"]');
 const cls=badge&&[...badge.classList].find(x=>x.startsWith('tpl-'));
 return cls?cls.slice(4):'navy-pill';
};
const premium=()=>PREMIUM_TEMPLATES.has(templateId());

function injectStyle(){
 let s=q('#kyEditorStabilityV4');
 if(!s){s=document.createElement('style');s.id='kyEditorStabilityV4';document.head.appendChild(s)}
 s.textContent=`
 .ky-v4-note{margin:8px 0 0;padding:8px 9px;border:1px solid rgba(36,58,139,.11);border-radius:8px;background:#f5f7ff;color:#66739d;font-size:8.8px;line-height:1.45}
 .ky-v4-note.premium{background:#fffaf0;border-color:rgba(211,155,33,.26);color:#8b6510}
 .ky-v4-disabled{opacity:.43!important;pointer-events:none!important}
 #v3Icons .ky-premium-choice{min-height:88px!important}
 #v3Icons .ky-premium-choice b{width:40px!important;height:40px!important;display:grid!important;place-items:center!important}
 #v3Icons .ky-premium-choice .ky-premium-icon{font-size:29px!important;width:1.42em!important;height:1.42em!important}
 #v3Icons .ky-premium-choice>span{font-size:8.8px!important;max-width:96px!important}
 .ky-category-global-tools{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 9px;padding:7px;border:1px solid rgba(36,58,139,.10);border-radius:10px;background:#f7f9ff}
 .ky-category-global-tools button,.ky-v4-category-bulk button{height:30px;border:1px solid rgba(36,58,139,.16);border-radius:8px;background:#eef1f7;color:#65708e;font-size:8.5px;font-weight:800;cursor:pointer}
 .ky-category-global-tools button:hover,.ky-v4-category-bulk button:hover{border-color:#243a8b}
 .ky-category-global-tools button.is-active,.ky-v4-category-bulk button.is-active{background:#243a8b;color:#fff;border-color:#243a8b}
 .ky-v4-category-bulk{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:5px;margin:7px 8px;padding:7px;border:1px solid rgba(36,58,139,.10);border-radius:9px;background:#f7f9ff}
 .ky-v4-category-bulk span{font-size:8.5px;font-weight:800;color:#243a8b}
 .ky-v4-category-bulk.is-busy{opacity:.6;pointer-events:none}
 .ky-category-head>.ky-category-arrow,.ky-category-head>.ky-v4-category-arrow{margin-left:auto;width:24px;height:24px;display:grid;place-items:center;border-radius:7px;background:#f1f4fb;border:1px solid rgba(36,58,139,.10);color:#243a8b;font-size:12px;transition:transform .16s ease}
 .ky-category-card.open>.ky-category-head>.ky-v4-category-arrow{transform:rotate(180deg)}
 #v3Categories input[data-hide-product][data-ky-v4-visible="1"]:checked + .ky-switch-slider{background:#243a8b!important}
 #v3Categories input[data-hide-product][data-ky-v4-visible="1"]:not(:checked) + .ky-switch-slider{background:#d5dbe8!important}
 #stageCanvas .ky-focus-badge-overlay,#stageCanvas .ky-focus-underbar,#stageCanvas .ky-focus-insidebar{translate:var(--ky-v4-x,0px) var(--ky-v4-y,0px)!important}
 @keyframes kyV4StripDrop{from{opacity:0;translate:0 -14px}to{opacity:1;translate:0 0}}
 @keyframes kyV4StripRise{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
 #stageCanvas .ky-v4-strip-drop{animation:kyV4StripDrop var(--ky-v4-duration,320ms) cubic-bezier(.22,1,.36,1) both!important}
 #stageCanvas .ky-v4-strip-rise{animation:kyV4StripRise var(--ky-v4-duration,320ms) cubic-bezier(.22,1,.36,1) both!important}
 #stageCanvas .ky-v3-badge-position.pos-bottom-bar:not(.ky-v4-strip-drop),
 #stageCanvas .ky-v3-badge-position.pos-bottom-inside:not(.ky-v4-strip-rise),
 #stageCanvas .ky-focus-underbar:not(.ky-v4-strip-drop),
 #stageCanvas .ky-focus-insidebar:not(.ky-v4-strip-rise){animation:none!important}
 #stageCanvas.mobile-view .ky-v3-badge{max-width:100%!important;box-sizing:border-box!important;transform-origin:center!important}
 #stageCanvas.ky-v4-page-hidden>*:not(.ky-v4-page-message){display:none!important}
 .ky-v4-page-message{display:grid;place-items:center;min-height:360px;border:1px dashed rgba(36,58,139,.20);border-radius:14px;background:#fbfcff;color:#66739d;text-align:center;font-size:11px}
 .ky-v4-page-message strong{display:block;color:#243a8b;font-size:15px;margin-bottom:5px}
 .ky-v4-rule-hidden{display:none!important}
 .ky-v4-rule-math{margin-top:8px;padding:7px 8px;border:1px solid rgba(36,58,139,.09);border-radius:8px;background:#f7f9ff;color:#66739d;font-size:8.6px;line-height:1.4}
 `;
}

function cleanupLegacyNotes(){
 [
  'kySizingTemplateNote','kyPremiumGradientNote','kyGradientNote','kySizingNote',
  'kyStripNote','kyStripAnimationNote'
 ].forEach(id=>q('#'+id)?.remove());
 qa('.ky-final-note').forEach(x=>x.remove());
}

function note(host,id,text,isPremium=false){
 if(!host)return;
 let el=q('#'+id,host);
 if(!el){el=document.createElement('div');el.id=id;el.className='ky-v4-note';host.appendChild(el)}
 el.classList.toggle('premium',isPremium);
 el.textContent=text;
}

function setDisabled(ids,on){
 for(const id of ids){
  const el=q('#'+id); if(!el)continue;
  const wrap=el.closest('.ky-field,.ky-toggle-wrap');
  el.disabled=!!on;
  wrap?.classList.toggle('ky-v4-disabled',!!on);
 }
}

function enforceTemplateRules(){
 cleanupLegacyNotes();
 const p=premium();
 setDisabled(['v3PadX','v3PadY'],p);
 setDisabled(['v3Scale'],false);
 if(p)note(q('#panelSizing .ky-group'),'kyV4SizingNote','Premium şablonun iç boşlukları tasarım tarafından korunur. Şablon Boyutu masaüstü ve mobil için ayrı ayrı ayarlanabilir.',true);
 else q('#kyV4SizingNote')?.remove();

 const gradientAllowed=!p&&BASIC_GRADIENT.has(templateId());
 setDisabled(['v3Gradient','v3Grad1Picker','v3Grad1Hex','v3Grad2Picker','v3Grad2Hex','v3GradAngle'],!gradientAllowed);
 if(p)note(q('#panelColors .ky-group'),'kyV4GradientNote','Premium şablonlarda standart gradyan kullanılmaz. Her premium şablon kendi hareketli renk, ışık ve çerçeve sistemini kullanır; Ana Renk, Metin ve Vurgu / Işık Rengi değiştirilebilir.',true);
 else q('#kyV4GradientNote')?.remove();

 const loc=placement();
 const strip=loc==='image_bottom_bar'||loc==='image_inside_bottom_bar';
 const entry=q('#v3Entry'),hover=q('#v3Hover');
 if(strip){
  const forced=loc==='image_bottom_bar'?'slide-down':'slide-up';
  if(entry){entry.value=forced;entry.disabled=true;entry.closest('.ky-field')?.classList.add('ky-v4-disabled')}
  if(hover){hover.value='none';hover.disabled=true;hover.closest('.ky-field')?.classList.add('ky-v4-disabled')}
  note(q('#panelAnimation .ky-group'),'kyV4StripNote',loc==='image_bottom_bar'
   ?'Görsel Alt Şeridi yalnızca yukarıdan aşağı iner. Başka giriş veya hover efekti uygulanmaz.'
   :'Görsel İçinde Alt Şerit yalnızca aşağıdan yukarı çıkar. Başka giriş veya hover efekti uygulanmaz.');
 }else{
  if(entry){entry.disabled=false;entry.closest('.ky-field')?.classList.remove('ky-v4-disabled')}
  if(hover){hover.disabled=false;hover.closest('.ky-field')?.classList.remove('ky-v4-disabled')}
  q('#kyV4StripNote')?.remove();
 }
}

function shadowValue(){
 const type=q('#v3Shadow')?.value||'none';
 const accent=q('#v3AccentHex')?.value||'#ce3f44';
 if(type==='soft')return '0 5px 12px rgba(16,24,40,.12)';
 if(type==='medium')return '0 9px 20px rgba(16,24,40,.18)';
 if(type==='strong')return '0 12px 28px rgba(16,24,40,.26)';
 if(type==='glow')return `0 0 18px ${accent}77`;
 return 'none';
}

function applyVisualControls(){
 const canvas=q('#stageCanvas'); if(!canvas)return;
 const x=num('v3OffsetX',0),y=num('v3OffsetY',0);
 const px=num('v3PadX',10),py=num('v3PadY',5),scale=num('v3Scale',100)/100;
 const radius=num('v3Radius',9),width=num('v3BorderWidth',0),opacity=num('v3Opacity',100)/100;
 const border=q('#v3BorderColorHex')?.value||'#243a8b';
 const shadow=shadowValue();
 const iconSize=num('v3IconSize',14);
 const dur=num('v3Duration',320);
 const isPremium=premium();

 qa('.ky-focus-badge-overlay,.ky-focus-underbar,.ky-focus-insidebar',canvas).forEach(w=>{
  w.style.setProperty('--ky-v4-x',x+'px');
  w.style.setProperty('--ky-v4-y',y+'px');
  w.style.setProperty('--ky-v4-duration',dur+'ms');
 });
 qa('.ky-v3-badge-position',canvas).forEach(w=>{
  w.style.setProperty('--ox',x+'px');
  w.style.setProperty('--oy',y+'px');
  w.style.setProperty('--ky-v4-duration',dur+'ms');
 });

 qa('.ky-v3-badge',canvas).forEach(b=>{
  b.style.setProperty('--badge-opacity',String(opacity));
  b.style.setProperty('opacity',String(opacity),'important');
  if(!isPremium){
   b.style.setProperty('--badge-radius',radius+'px');
   b.style.setProperty('--badge-border-width',width+'px');
   b.style.setProperty('--badge-border',border);
   b.style.setProperty('border-radius',radius+'px','important');
   b.style.setProperty('border-width',width+'px','important');
   b.style.setProperty('border-style','solid','important');
   b.style.setProperty('border-color',border,'important');
   b.style.setProperty('--badge-px',px+'px');
   b.style.setProperty('--badge-py',py+'px');
   b.style.setProperty('--badge-scale',String(scale));
   b.style.removeProperty('scale');
   b.style.setProperty('--badge-shadow',shadow);
   b.style.setProperty('box-shadow',shadow,'important');
  }else{
   b.style.removeProperty('--badge-radius');
   b.style.removeProperty('--badge-border-width');
   b.style.removeProperty('--badge-border');
   b.style.removeProperty('border-radius');
   b.style.removeProperty('border-width');
   b.style.removeProperty('border-style');
   b.style.removeProperty('border-color');
   b.style.setProperty('--badge-scale','1');
   b.style.setProperty('scale',String(scale),'important');
   b.style.setProperty('--badge-shadow',shadow);
  }
  qa('.ky-premium-icon',b).forEach(i=>i.style.setProperty('font-size',iconSize+'px','important'));
  qa('svg',b).forEach(i=>{i.style.setProperty('width',iconSize+'px','important');i.style.setProperty('height',iconSize+'px','important')});
 });

 applyStripMotion();
}

function bindScaleWithoutPreviewRebuild(){
 const el=q('#v3Scale');if(!el||el.dataset.kyLiveScaleBound==='1')return;
 el.dataset.kyLiveScaleBound='1';
 el.oninput=()=>{
  const label=q('#v3ScaleVal');if(label)label.textContent=el.value+'%';
  schedule();
 };
 el.onchange=()=>schedule();
}

function removeBadgeEffects(badge){
 if(!badge)return;
 for(const cls of [...badge.classList]){
  if(cls.startsWith('ky-entry-')||cls.startsWith('ky-hover-'))badge.classList.remove(cls);
 }
 badge.style.setProperty('animation','none','important');
 badge.style.setProperty('transition','none','important');
}

function applyStripMotion(){
 const canvas=q('#stageCanvas'); if(!canvas)return;
 const loc=placement();
 const dropWrappers=qa('.ky-focus-underbar,.ky-v3-badge-position.pos-bottom-bar',canvas);
 const riseWrappers=qa('.ky-focus-insidebar,.ky-v3-badge-position.pos-bottom-inside',canvas);
 [...dropWrappers,...riseWrappers].forEach(w=>{
  removeBadgeEffects(q('.ky-v3-badge',w));
  if(!w.classList.contains('ky-v4-strip-drop')&&!w.classList.contains('ky-v4-strip-rise')){
   w.style.setProperty('animation','none','important');
  }
 });
 if(!stripPlayPending)return;
 const target=loc==='image_bottom_bar'?dropWrappers[0]:loc==='image_inside_bottom_bar'?riseWrappers[0]:null;
 if(!target){stripPlayPending=false;return}
 target.style.removeProperty('animation');
 target.classList.add(loc==='image_bottom_bar'?'ky-v4-strip-drop':'ky-v4-strip-rise');
 stripPlayPending=false;
 setTimeout(()=>{
  target.classList.remove('ky-v4-strip-drop','ky-v4-strip-rise');
  target.style.setProperty('animation','none','important');
 },Math.max(180,num('v3Duration',320))+80);
}

function stylePremiumGallery(){
 for(const [type,pal] of Object.entries(PREMIUM_ICON_PALETTES)){
  const btn=q(`#v3Icons [data-icon="${CSS.escape(type)}"]`);
  const icon=q('.ky-premium-icon',btn);
  if(!icon)continue;
  icon.style.setProperty('--ky-icon-main',pal[0]);
  icon.style.setProperty('--ky-icon-accent',pal[1]);
 }
}

function applyPremiumIconDefault(type){
 const pal=PREMIUM_ICON_PALETTES[type]; if(!pal)return;
 window.handleInput?.('icon.enabled',true);
 window.handleInput?.('icon.type',type);
 window.handleInput?.('icon.mode','color');
 window.handleInput?.('icon.color',pal[0]);
 window.handleInput?.('icon.accentColor',pal[1]);
 setTimeout(()=>{
  q('#v3IconColor')?.classList.add('active');
  q('#v3IconMono')?.classList.remove('active');
  for(const [id,val] of [['v3IconC1',pal[0]],['v3IconC2',pal[1]]]){
   const picker=q('#'+id+'Picker'),hex=q('#'+id+'Hex');
   if(picker)picker.value=val;
   if(hex){hex.value=val;hex.dispatchEvent(new Event('input',{bubbles:true}))}
  }
  schedule();
 },20);
}

function ensureCategoryBody(card){
 let body=q(':scope > .ky-category-body',card);
 if(!body){
  body=document.createElement('div');body.className='ky-category-body';
  qa(':scope > .ky-rank-row',card).forEach(row=>body.appendChild(row));
  card.appendChild(body);
 }
 return body;
}

function normalizeVisibilitySwitch(input){
 if(!input||input.dataset.kyV4Visible==='1')return;
 const nativeHidden=!!input.checked;
 input.checked=!nativeHidden;
 input.dataset.kyV4Visible='1';
 input.title='Mavi: rozet açık • Gri: rozet kapalı';
}

function refreshBulkState(card){
 const boxes=qa('input[data-hide-product][data-ky-v4-visible="1"]',card);
 const open=q('.ky-v4-bulk-open',card),close=q('.ky-v4-bulk-close',card);
 const allOn=boxes.length>0&&boxes.every(x=>x.checked);
 const allOff=boxes.length>0&&boxes.every(x=>!x.checked);
 open?.classList.toggle('is-active',allOn);
 close?.classList.toggle('is-active',allOff);
}

function bindCategoryCard(card,index){
 const id=String(card.dataset.categoryId||'');
 const body=ensureCategoryBody(card);
 card.dataset.kyCollapsible='1';

 let oldHead=q(':scope > .ky-category-head',card);
 if(!oldHead)return;
 if(oldHead.dataset.kyV4Bound!=='1'){
  const head=oldHead.cloneNode(true);
  oldHead.replaceWith(head);
  oldHead=head;
  while(oldHead.children.length>1)oldHead.lastElementChild.remove();
  const arrow=document.createElement('span');arrow.className='ky-v4-category-arrow';arrow.textContent='⌄';oldHead.appendChild(arrow);
  oldHead.dataset.kyV4Bound='1';oldHead.setAttribute('role','button');oldHead.tabIndex=0;
 }

 if(expandMode==='all'||openCategories.has(id)||(expandMode===null&&openCategories.size===0&&index===0))card.classList.add('open');
 if(expandMode==='none')card.classList.remove('open');

 oldHead.onclick=e=>{
  e.preventDefault();e.stopPropagation();
  expandMode=null;
  const opening=!card.classList.contains('open');
  card.classList.toggle('open',opening);
  if(opening){openCategories.add(id);window.selectPreviewCategory?.(id)}else openCategories.delete(id);
 };
 oldHead.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();oldHead.click()}};

 qa('input[data-hide-product]',body).forEach(normalizeVisibilitySwitch);
 qa('select[data-rank-product]',body).forEach(sel=>sel.onchange=async function(){const catId=this.dataset.rankCat,prodId=this.dataset.rankProduct,val=this.value;if(!catId||!prodId)return;const manualRank=val?Number(val):null;try{const r=await fetch(`/api/admin/categories/override?shop=${encodeURIComponent(shop)}`,{method:'POST',body:JSON.stringify({categoryId:catId,productId:prodId,manualRank,hidden:undefined}),headers:{'Content-Type':'application/json'}});if(!r.ok)throw new Error((await r.json()).message||'Sıralama güncellenemedi');const data=await r.json();if(data.categories){state.categories=data.categories;renderCategories();renderPreview()}}catch(e){console.error('[Rank select]',e);this.value='';}});

 let bulk=q(':scope > .ky-v4-category-bulk',body);
 if(!bulk){
  bulk=document.createElement('div');bulk.className='ky-v4-category-bulk';
  bulk.innerHTML='<span>Kategori ürünleri</span><button type="button" class="ky-v4-bulk-btn-auto" data-bulk-op="auto" style="padding:4px 7px;background:#f0f1f3;border:1px solid #d0d5dd;border-radius:5px;cursor:pointer;font-weight:500;margin-left:8px">Hepsini Otomatik Yap</button><button type="button" class="ky-v4-bulk-btn-lock" data-bulk-op="lock" style="padding:4px 7px;background:#f0f1f3;border:1px solid #d0d5dd;border-radius:5px;cursor:pointer;font-weight:500">Otomatik Seçimini Kaldır</button><button type="button" class="ky-v4-bulk-open">Tümünü Aç</button><button type="button" class="ky-v4-bulk-close">Tümünü Kapat</button>';
  body.prepend(bulk);
  q('.ky-v4-bulk-open',bulk).onclick=e=>{e.stopPropagation();bulkCategory(card,true)};
  q('.ky-v4-bulk-close',bulk).onclick=e=>{e.stopPropagation();bulkCategory(card,false)};
  q('.ky-v4-bulk-btn-auto',bulk).onclick=async e=>{e.stopPropagation();const categoryId=String(card.dataset.categoryId||'');if(!categoryId)return;bulk.classList.add('is-busy');try{const r=await fetch(`/api/admin/categories/bulk-clear?shop=${encodeURIComponent(shop)}`,{method:'POST',body:JSON.stringify({categoryId}),headers:{'Content-Type':'application/json'}});if(!r.ok)throw new Error((await r.json()).message||'Otomatik yapılamadı');const data=await r.json();if(data.categories){state.categories=data.categories;renderCategories();renderPreview()}alert('Hepsini Otomatik Yap işlemi tamamlandı');}catch(e){alert('Hata: '+e.message)}finally{bulk.classList.remove('is-busy')}};
  q('.ky-v4-bulk-btn-lock',bulk).onclick=async e=>{e.stopPropagation();const categoryId=String(card.dataset.categoryId||'');if(!categoryId)return;bulk.classList.add('is-busy');try{const r=await fetch(`/api/admin/categories/bulk-lock?shop=${encodeURIComponent(shop)}`,{method:'POST',body:JSON.stringify({categoryId}),headers:{'Content-Type':'application/json'}});if(!r.ok)throw new Error((await r.json()).message||'Sabitlenemiyor');const data=await r.json();if(data.categories){state.categories=data.categories;renderCategories();renderPreview()}alert('Otomatik Seçimini Kaldır işlemi tamamlandı');}catch(e){alert('Hata: '+e.message)}finally{bulk.classList.remove('is-busy')}};
 }
 refreshBulkState(card);
}

function normalizeCategories(){
 const host=q('#v3Categories'); if(!host)return;
 let tools=q(':scope > .ky-category-global-tools',host);
 if(!tools){
  tools=document.createElement('div');tools.className='ky-category-global-tools';
  tools.innerHTML='<button type="button" data-ky-v4-open-all>Kategorilerin tümünü aç</button><button type="button" data-ky-v4-close-all>Tümünü kapat</button>';
  host.prepend(tools);
  q('[data-ky-v4-open-all]',tools).onclick=e=>{e.stopPropagation();expandMode='all';qa('.ky-category-card',host).forEach(c=>{c.classList.add('open');openCategories.add(String(c.dataset.categoryId||''))})};
  q('[data-ky-v4-close-all]',tools).onclick=e=>{e.stopPropagation();expandMode='none';openCategories.clear();qa('.ky-category-card',host).forEach(c=>c.classList.remove('open'))};
 }
 qa('.ky-category-card',host).forEach(bindCategoryCard);
}

async function bulkCategory(card,show){
 if(!card||card.dataset.kyV4Busy==='1')return;
 const categoryId=String(card.dataset.categoryId||''); if(!categoryId)return;
 const bulk=q('.ky-v4-category-bulk',card); bulk?.classList.add('is-busy');card.dataset.kyV4Busy='1';
 try{
  const r=await fetch(`/api/admin/settings?shop=${encodeURIComponent(shop)}&bulkV4=1`,{cache:'no-store'});
  const data=await r.json(); if(!r.ok)throw new Error(data.message||'Kategori ürünleri alınamadı.');
  const cat=(data.categories||[]).find(c=>String(c.id)===categoryId);
  const products=cat?.products||[]; if(!products.length)throw new Error('Bu kategoride ürün bulunamadı.');
  const hidden=!show;
  const rest=products.slice(1);
  await Promise.all(rest.map(async p=>{
   const rr=await fetch(`/api/admin/categories/override?shop=${encodeURIComponent(shop)}`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({categoryId,productId:p.id,manualRank:p.manual?Number(p.rank):null,hidden})
   });
   if(!rr.ok){const d=await rr.json().catch(()=>({}));throw new Error(d.message||'Kategori güncellenemedi.')}
  }));
  const first=products[0];
  const input=q(`input[data-hide-product="${CSS.escape(String(first.id))}"]`,card);
  if(input){
   input.checked=show;
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }else{
   const rr=await fetch(`/api/admin/categories/override?shop=${encodeURIComponent(shop)}`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({categoryId,productId:first.id,manualRank:first.manual?Number(first.rank):null,hidden})
   });
   if(!rr.ok)throw new Error('Kategori güncellenemedi.');
   q('#v3Sync')?.click();
  }
  openCategories.add(categoryId);expandMode=null;
 }catch(err){
  console.error('[Kategori toplu görünürlük]',err);
  const label=q('.ky-v4-category-bulk span',card);
  if(label){const old=label.textContent;label.textContent='İşlem tamamlanamadı';setTimeout(()=>{if(label.isConnected)label.textContent=old},1800)}
 }finally{
  card.dataset.kyV4Busy='0';bulk?.classList.remove('is-busy');setTimeout(schedule,120);
 }
}

async function loadConfigSnapshot(){
 try{
  const r=await fetch(`/api/admin/settings?shop=${encodeURIComponent(shop)}&v4=1`,{cache:'no-store'});
  const d=await r.json(); if(!r.ok)return;
  const cfg=d.draftConfig||{};
  catalog=Array.isArray(d.categories)?d.categories:[];
  const pv=cfg.pageVisibility;
  const legacyD=cfg.responsive?.desktopEnabled!==false,legacyM=cfg.responsive?.mobileEnabled!==false;
  visibility={
   category:{desktop:pv?.category?.desktop??legacyD,mobile:pv?.category?.mobile??legacyM},
   product:{desktop:pv?.product?.desktop??legacyD,mobile:pv?.product?.mobile??legacyM}
  };
  if(cfg.responsive?.desktopEnabled===false)window.handleInput?.('responsive.desktopEnabled',true);
  if(cfg.responsive?.mobileEnabled===false)window.handleInput?.('responsive.mobileEnabled',true);
 }catch{}
 syncVisibilityControls();
 schedule();
}

function syncVisibilityControls(){
 const s=surface();
 const d=q('#v3Desktop'),m=q('#v3Mobile');
 if(d)d.checked=visibility[s].desktop!==false;
 if(m)m.checked=visibility[s].mobile!==false;
}

function setVisibility(kind,val){
 const s=surface();visibility[s][kind]=!!val;
 window.handleInput?.(`pageVisibility.${s}.${kind}`,!!val);
 window.handleInput?.(`responsive.${kind}Enabled`,true);
 syncVisibilityControls();
 applyPageVisibility();
}

function applyPageVisibility(){
 const canvas=q('#stageCanvas'); if(!canvas)return;
 const on=visibility[surface()][device()]!==false;
 canvas.classList.toggle('ky-v4-page-hidden',!on);
 let msg=q(':scope > .ky-v4-page-message',canvas);
 if(on){msg?.remove();return}
 if(!msg){msg=document.createElement('div');msg.className='ky-v4-page-message';canvas.appendChild(msg)}
 msg.innerHTML=`<div><strong>${device()==='desktop'?'Masaüstü':'Mobil'} gösterimi kapalı</strong>${surface()==='product'?'Ürün':'Kategori'} sayfası için Cihaz Görünürlüğü bölümünden tekrar açabilirsiniz.</div>`;
}

function parseMoney(v){
 const cleaned=String(v??'').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.');
 const n=Number(cleaned);return Number.isFinite(n)?n:null;
}
function productMetaByName(name){
 const target=String(name||'').trim().toLocaleLowerCase('tr');
 for(const cat of catalog)for(const p of (cat.products||[]))if(String(p.name||'').trim().toLocaleLowerCase('tr')===target)return p;
 return null;
}
function isDiscounted(p){
 if(!p)return false;if(p.discounted===true||p.isDiscounted===true||Number(p.discount||0)>0)return true;
 const price=parseMoney(p.price),compare=parseMoney(p.compareAtPrice??p.comparePrice??p.listPrice);
 return price!=null&&compare!=null&&compare>price;
}
function isNewProduct(p){
 if(!p)return false;if(p.isNew===true||p.newProduct===true)return true;
 const raw=p.createdAt||p.created_at||p.creationDate;if(!raw)return false;
 const ts=Date.parse(raw);return Number.isFinite(ts)&&(Date.now()-ts)<30*24*60*60*1000;
}

function applyVisibilityRules(){
 const canvas=q('#stageCanvas');if(!canvas)return;
 const maxRank=Math.max(1,num('v3MaxRank',20));
 const hideRank=Math.max(1,num('v3HideRank',20));
 const effective=Math.min(maxRank,hideRank);
 const minSales=Math.max(0,num('v3MinSales',0));
 const hideDiscount=!!q('#v3HideDiscount')?.checked;
 const hideNew=!!q('#v3HideNew')?.checked;
 let math=q('#kyV4RuleMath');
 const group=q('#panelRules .ky-group');
 if(group&&!math){math=document.createElement('div');math.id='kyV4RuleMath';math.className='ky-v4-rule-math';group.appendChild(math)}
 if(math)math.textContent=`Etkin rozet sınırı: #${effective} = min(Maksimum Rozet Limiti #${maxRank}, Görünürlük Sınırı #${hideRank}). Minimum satış: ${minSales}.`;

 qa('.ky-mock-card',canvas).forEach(card=>{
  const name=q('.ky-mock-title',card)?.textContent||'';
  const p=productMetaByName(name);
  const badge=q('.ky-v3-badge-position,.ky-focus-badge-overlay,.ky-focus-underbar,.ky-focus-insidebar',card);
  if(!badge)return;
  const rank=Number(p?.rank||String(q('.ky-badge-text',badge)?.textContent||'').match(/\d+/)?.[0]||999);
  const sales=Number(p?.sales??p?.quantity??0);
  const hide=rank>effective||sales<minSales||hideDiscount&&isDiscounted(p)||hideNew&&isNewProduct(p)||p?.hidden===true;
  badge.classList.toggle('ky-v4-rule-hidden',hide);
 });
 if(surface()==='product'){
  const name=q('.ky-pdp-h1,#stageCanvas .ky-focus-pdp-title,#stageCanvas h1')?.textContent||'';
  const p=productMetaByName(name);
  const badge=q('#stageCanvas .ky-pdp-info .ky-v3-badge,#stageCanvas .ky-focus-pdp-context .ky-v3-badge,#stageCanvas .ky-focus-pdp-badge .ky-v3-badge');
  if(badge){
   const rank=Number(p?.rank||String(q('.ky-badge-text',badge)?.textContent||'').match(/\d+/)?.[0]||999);
   const sales=Number(p?.sales??p?.quantity??0);
   const hide=rank>effective||sales<minSales||hideDiscount&&isDiscounted(p)||hideNew&&isNewProduct(p)||p?.hidden===true;
   badge.classList.toggle('ky-v4-rule-hidden',hide);
  }
 }
}

async function profile(){
 const r=await fetch(`/api/profile?shop=${encodeURIComponent(shop)}`,{cache:'no-store'});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||'Profil bilgileri alınamadı.');
 return d.profile||d.data?.profile||{};
}
async function support(){
 const err=q('#v3SupportError'),btn=q('#v3SupportSend');
 if(err){err.classList.remove('show');err.textContent=''}
 try{
  const subject=q('#v3SupportSubject')?.value.trim()||'',message=q('#v3SupportMessage')?.value.trim()||'',category=q('#v3SupportCategory')?.value||'OTHER';
  if(subject.length<3)throw new Error('Konu en az 3 karakter olmalı.');
  if(message.length<10)throw new Error('Mesaj en az 10 karakter olmalı.');
  if(btn){btn.disabled=true;btn.textContent='Gönderiliyor…'}
  let local={},lr=await fetch(`/api/support?shop=${encodeURIComponent(shop)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shop,category,subject,message})}).catch(()=>null);
  if(lr)local=await lr.json().catch(()=>({}));
  if(lr?.ok&&local.emailDelivered===true){q('#supportDialog')?.close();toast('Destek talebi e-posta ile gönderildi.');return}
  if(lr&&!lr.ok&&lr.status<500)throw new Error(local.message||'Destek talebi gönderilemedi.');
  const p=await profile();if(!p.email)throw new Error('Önce Profilim alanından e-posta adresinizi kaydedin.');
  const rr=await fetch(RELAY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   app:'Kategori Yıldızı',shop,category,subject,message,contactName:p.contactName||'',email:p.email,phone:p.phone||'',role:p.role||'',ticketNumber:local.ticketNumber||''
  })});
  const rd=await rr.json().catch(()=>({}));
  if(!rr.ok||rd.emailDelivered!==true)throw new Error(rd.message||'Destek e-postası gönderilemedi.');
  q('#supportDialog')?.close();toast(`Destek talebi e-posta ile gönderildi${rd.ticketNumber?': '+rd.ticketNumber:''}`);
 }catch(e){
  if(err){err.textContent=e.message||'Destek talebi gönderilemedi.';err.classList.add('show')}
 }finally{if(btn){btn.disabled=false;btn.textContent='Destek talebi gönder'}}
}
function toast(text){
 let x=q('#kyV4Toast');if(!x){x=document.createElement('div');x.id='kyV4Toast';x.className='ky-toast';document.body.appendChild(x)}
 x.textContent=text;x.style.background='#17213a';x.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>x.style.display='none',3200);
}

function sync(){
 injectStyle();
 enforceTemplateRules();
 bindScaleWithoutPreviewRebuild();
 stylePremiumGallery();
 normalizeCategories();
 applyVisualControls();
 syncVisibilityControls();
 applyPageVisibility();
 applyVisibilityRules();
}
function schedule(){
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()});
}

function captureVisibleToggle(e){
 const input=e.target;
 if(!(input instanceof HTMLInputElement)||!input.matches('input[data-hide-product][data-ky-v4-visible="1"]'))return;
 const desiredVisible=!!input.checked;
 input.checked=!desiredVisible;
 queueMicrotask(()=>{if(input.isConnected){input.checked=desiredVisible;refreshBulkState(input.closest('.ky-category-card'))}});
}

function bind(){
 document.addEventListener('change',e=>{
  if(e.target?.matches?.('input[data-hide-product][data-ky-v4-visible="1"]')){captureVisibleToggle(e);return}
  const id=e.target?.id||'';
  if(id==='v3Desktop'||id==='v3Mobile'){
   e.preventDefault();e.stopImmediatePropagation();
   setVisibility(id==='v3Desktop'?'desktop':'mobile',e.target.checked);
   return;
  }
  if(id==='v3CardLocation'){
   stripPlayPending=true;
   const loc=e.target.value,entry=q('#v3Entry'),hover=q('#v3Hover');
   if(loc==='image_bottom_bar'||loc==='image_inside_bottom_bar'){
    if(entry)entry.value=loc==='image_bottom_bar'?'slide-down':'slide-up';
    if(hover)hover.value='none';
   }
   setTimeout(schedule,0);return;
  }
  if(RANGE_PATHS[id])setTimeout(schedule,0);
  if(e.target.closest?.('#panelBorders,#panelSizing,#panelPosition,#panelAnimation,#panelRules,#panelColors'))setTimeout(schedule,0);
 },true);

 document.addEventListener('input',e=>{
  const id=e.target?.id||'';
  if(RANGE_PATHS[id]){schedule();return}
  if(e.target.closest?.('#panelBorders,#panelSizing,#panelPosition,#panelAnimation,#panelRules,#panelColors'))schedule();
 },true);

 document.addEventListener('click',e=>{
  if(e.target.closest('#v3SupportSend')){e.preventDefault();e.stopImmediatePropagation();support();return}
  const icon=e.target.closest('#v3Icons [data-icon^="premium-"]');
  if(icon)setTimeout(()=>applyPremiumIconDefault(icon.dataset.icon),0);
  if(e.target.closest('.ky-view-tab,.ky-device-btn,[data-edit-surface],[data-edit-device],[data-template]'))setTimeout(schedule,40);
 },true);
}

function observe(){
 if(observing)return;observing=true;
 const canvas=q('#stageCanvas'),cats=q('#v3Categories'),icons=q('#v3Icons');
 if(canvas)new MutationObserver(schedule).observe(canvas,{childList:true,subtree:true});
 if(cats)new MutationObserver(schedule).observe(cats,{childList:true,subtree:true});
 if(icons)new MutationObserver(schedule).observe(icons,{childList:true,subtree:true});
}

function start(){
 injectStyle();bind();observe();loadConfigSnapshot();schedule();
 setTimeout(schedule,250);setTimeout(schedule,800);setTimeout(schedule,1600);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
