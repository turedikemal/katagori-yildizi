/**
 * Kategori Yıldızı - ikas Storefront Engine
 * Device-aware badge runtime with independent desktop/mobile profiles.
 */
(function(){
'use strict';
if(window.__KategoriYildiziLoaded)return;
window.__KategoriYildiziLoaded=true;

const ICONS={
 ribbon:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/><path d="m8.21 13.89-1.96 7.61 5.75-3.05 5.75 3.05-1.96-7.61"/></svg>`,
 medal:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
 cup:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/><path d="M6 3h12v7a6 6 0 0 1-12 0V3Z"/></svg>`,
 crown:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`,
 star:`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
 check:`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
 trend:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
 fire:`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
 heart:`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
 award:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
 leaf:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`
};
const API_HOST=window.__KY_API_HOST||'https://katagori-yildizi-production.up.railway.app';
const SIMPLE_GRADIENT_TEMPLATES=new Set(['navy-pill','split-pill','eco-clean','arc-pill','rank-tab','color-block','understated']);
const RADIUS_TEMPLATES=new Set(['navy-pill','gradient-pill','split-pill','eco-clean','modern-outline','glass-pill','luxury-label','soft-stamp','arc-pill','rank-tab','signature-pill','understated','ticket-line']);
const BORDER_TEMPLATES=new Set(['navy-pill','gradient-pill','modern-outline','glass-pill','luxury-label','soft-stamp','understated','ticket-line']);
let appConfig=null,productsMap={};
let lastMobile=matchMedia('(max-width:768px)').matches;

function injectRuntimeStyles(){
 if(document.getElementById('ky-runtime-v2'))return;
 const s=document.createElement('style');s.id='ky-runtime-v2';s.textContent=`
 @keyframes ky-slide-right{from{transform:translateX(-14px);opacity:0}to{transform:translateX(0);opacity:1}}
 @keyframes ky-flip{from{transform:perspective(480px) rotateY(-88deg);opacity:0}to{transform:perspective(480px) rotateY(0);opacity:1}}
 .ky-anim-slide-right{animation:ky-slide-right var(--ky-anim-dur,.3s) cubic-bezier(.16,1,.3,1) forwards}
 .ky-anim-flip{animation:ky-flip var(--ky-anim-dur,.42s) cubic-bezier(.2,.75,.25,1) forwards;backface-visibility:hidden}
 .ky-hover-tilt:hover{rotate:-3deg;scale:1.02}.ky-hover-pulse:hover{animation:ky-pulse .7s ease-in-out infinite alternate}
 .ky-hover-slide-left:hover{translate:-5px 0}.ky-hover-slide-right:hover{translate:5px 0}
 .ky-offset-shell{display:inline-flex;max-width:100%}
 .ky-pos-bottom-full>.ky-offset-shell{display:flex;width:100%}.ky-pos-bottom-full .ky-badge-root{width:100%;justify-content:center;border-radius:0!important}
 .ky-tpl-category-context .ky-detail-badge-wrap{display:inline-flex;align-items:center;margin-left:2px;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;padding:0!important}
 @media(max-width:768px){.ky-badge-root{font-size:var(--ky-font-size)!important;padding:var(--ky-padding-y) var(--ky-padding-x)!important}}
 `;document.head.appendChild(s);
}
function isMobile(){return matchMedia('(max-width:768px)').matches;}
function merge(base,extra){const out={...base};for(const [k,v] of Object.entries(extra||{})){out[k]=v&&typeof v==='object'&&!Array.isArray(v)?merge(base?.[k]||{},v):v;}return out;}
function effectiveConfig(){
 if(!appConfig)return null;
 const device=isMobile()?'mobile':'desktop';
 const profile=appConfig.deviceSettings?.[device];
 if(profile)return merge(appConfig,profile);
 const c=merge({},appConfig);
 if(device==='mobile'){
   c.styling={...(c.styling||{})};const r=c.responsive||{};
   c.styling.fontSize=Math.max(7,Number(c.styling.fontSize||12)+Number(r.mobileFontSizeOffset||0));
   c.styling.scale=Math.round(Number(c.styling.scale||100)*Number(r.mobileBadgeScale||100)/100);
   c.styling.paddingX=Number(r.mobilePaddingX??c.styling.paddingX??10);c.styling.paddingY=Number(r.mobilePaddingY??c.styling.paddingY??5);
 }
 return c;
}
function cleanCss(v){return String(v??'').replace(/[;"'<>]/g,'');}
function templateColors(c,tpl){return (c.templateColors&&c.templateColors[tpl])||{};}
function iconSvg(c){const icon=c.icon||{};if(!icon.enabled||icon.type==='none')return '';if(icon.type==='custom_svg'&&icon.customSvg)return icon.customSvg;return ICONS[icon.type]||'';}
function animationClasses(c){const a=c.animation||{};return `${a.entry&&a.entry!=='none'?'ky-anim-'+a.entry:''} ${a.hover&&a.hover!=='none'?'ky-hover-'+a.hover:''}`.trim();}
function shadowValue(v,accent){return v==='soft'?'0 5px 12px rgba(16,24,40,.12)':v==='medium'?'0 9px 20px rgba(16,24,40,.18)':v==='strong'?'0 12px 28px rgba(16,24,40,.26)':v==='glow'?`0 0 18px ${accent}77`:'none';}
function badgeMarkup(data,c,text){
 const tpl=c.templateId||'navy-pill',st=c.styling||{},tc=templateColors(c,tpl);
 const bg=cleanCss(tc.bg||st.bgColor||'#243a8b'),fg=cleanCss(tc.text||st.textColor||'#fff'),accent=cleanCss(tc.accent||st.accentColor||'#ce3f44');
 const gradient=!!st.gradientEnabled&&SIMPLE_GRADIENT_TEMPLATES.has(tpl);
 const radius=RADIUS_TEMPLATES.has(tpl)?Number(st.borderRadius??8):null;
 const borderWidth=BORDER_TEMPLATES.has(tpl)?Number(st.borderWidth||0):0;
 const styles=[`--ky-primary-bg:${bg}`,`--ky-primary-text:${fg}`,`--ky-accent:${accent}`,`--ky-border-color:${cleanCss(st.borderColor||'transparent')}`,`--ky-border-width:${borderWidth}px`,`--ky-font-size:${Number(st.fontSize||12)}px`,`--ky-font-weight:${Number(st.fontWeight||700)}`,`--ky-padding-x:${Number(st.paddingX||10)}px`,`--ky-padding-y:${Number(st.paddingY||5)}px`,`--ky-scale:${Number(st.scale||100)/100}`,`--ky-opacity:${Number(st.opacity||100)/100}`,`--ky-shadow:${shadowValue(st.shadow,accent)}`,`--ky-anim-dur:${Number(c.animation?.durationMs||320)/1000}s`];
 if(radius!==null)styles.push(`border-radius:${radius}px`);
 if(gradient)styles.push(`background:linear-gradient(${Number(st.gradientAngle||135)}deg,${cleanCss(st.gradientColor1||bg)},${cleanCss(st.gradientColor2||accent)})`);
 if(st.shadow)styles.push(`box-shadow:${shadowValue(st.shadow,accent)}`);
 const icon=iconSvg(c);
 return `<span class="ky-badge-root ky-tpl-${cleanCss(tpl)} ${animationClasses(c)}" style="${styles.join(';')}" data-ky-product="${cleanCss(data.productId||'')}">${icon}<span>${escapeHtml(text)}</span></span>`;
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function fill(t,d){return String(t||'').replaceAll('{rank}',d.rank??'').replaceAll('{category}',d.categoryName||'').replaceAll('{product}',d.productName||'').replaceAll('{sales}',d.sales||0);}
function cardText(d,c){const t=c.texts||{};return fill(d.badgeText||t.productText||(d.rank===1?t.rank1Text:d.rank===2?t.rank2Text:t.rank3Text)||`En Çok Satan ${d.rank}. Ürün`,d);}
function detailText(d,c){const t=c.texts||{};return fill(d.pdpBadgeText||t.pdpBadgeText||`En Çok Satan ${d.rank}. Ürün`,d);}
function detailPrefix(d,c){const t=c.texts||{};return fill(d.pdpPrefix||t.pdpPrefixText||'{category} Kategorisinde',d);}

async function loadData(){
 try{
   const cached=sessionStorage.getItem('__ky_cache_v2');if(cached){const p=JSON.parse(cached);if(Date.now()-p.ts<120000){appConfig=p.config;productsMap=p.products||{};renderAll();return;}}
   const r=await fetch(`${API_HOST}/api/storefront/badges`,{cache:'no-store'}),d=await r.json();
   if(d.success){appConfig=d.config||{};productsMap=d.products||{};sessionStorage.setItem('__ky_cache_v2',JSON.stringify({ts:Date.now(),config:appConfig,products:productsMap}));renderAll();}
 }catch(e){console.warn('[Kategori Yıldızı] Load error:',e);}
}
function clearRendered(){document.querySelectorAll('.ky-badge-container[data-ky-runtime],.ky-tpl-category-context[data-ky-runtime]').forEach(el=>el.remove());}
function pickDataForCard(card,idx){const id=card.getAttribute('data-product-id')||card.dataset.productId||card.getAttribute('data-id');if(id&&productsMap[id])return productsMap[id];const vals=Object.values(productsMap);return vals[idx]||null;}
function positionClass(p){if(p.cardLocation==='image_bottom_bar')return 'ky-pos-bottom-full';return 'ky-pos-'+String(p.ninePointPosition||'top_left').replaceAll('_','-');}
function renderCategoryCards(){
 const c=effectiveConfig();if(!c||c.placements?.categoryCards===false)return;
 const cards=[...document.querySelectorAll('.product-card,.product-item,[data-product-id],article[class*="product"]')];
 cards.forEach((card,idx)=>{
   if(card.querySelector('.ky-badge-container[data-ky-runtime]'))return;
   let d=pickDataForCard(card,idx);if(!d){d={productId:'card_'+idx,rank:idx+1,categoryName:''};}
   const rank=Number(d.rank||idx+1);if(rank>Number(c.ranking?.maxRank||3))return;
   const img=card.querySelector('img'),host=img?(img.closest('.image-wrapper,.product-image,picture')||img.parentElement):card;if(!host)return;
   host.classList.add('ky-pos-parent');const wrap=document.createElement('div');wrap.dataset.kyRuntime='1';wrap.className='ky-badge-container '+positionClass(c.placements||{});
   const ox=Number(c.placements?.offsetX||0),oy=Number(c.placements?.offsetY||0);wrap.innerHTML=`<span class="ky-offset-shell" style="transform:translate(${ox}px,${oy}px)">${badgeMarkup(d,c,cardText(d,c))}</span>`;host.appendChild(wrap);
 });
}
function renderProductDetail(){
 const c=effectiveConfig();if(!c||c.placements?.productDetail===false)return;
 const title=document.querySelector('h1,.product-title,.product-detail-title');if(!title||document.querySelector('.ky-tpl-category-context[data-ky-runtime]'))return;
 const d=Object.values(productsMap)[0];if(!d)return;
 const wrap=document.createElement('div');wrap.className='ky-tpl-category-context';wrap.dataset.kyRuntime='1';wrap.style.margin='8px 0 14px';
 wrap.innerHTML=`<a href="/${escapeHtml(d.categoryId||'')}" class="ky-cat-anchor"><span>${escapeHtml(detailPrefix(d,c))}</span></a><span class="ky-detail-badge-wrap">${badgeMarkup(d,c,detailText(d,c))}</span>`;
 title.insertAdjacentElement('afterend',wrap);
}
function renderAll(){if(!appConfig)return;injectRuntimeStyles();clearRendered();renderProductDetail();renderCategoryCards();}
const observer=new MutationObserver(()=>{if(appConfig)requestAnimationFrame(()=>{renderProductDetail();renderCategoryCards();});});
function startObserver(){observer.observe(document.body,{childList:true,subtree:true});}
window.addEventListener('resize',()=>{const m=isMobile();if(m!==lastMobile){lastMobile=m;renderAll();}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{injectRuntimeStyles();loadData();startObserver();});else{injectRuntimeStyles();loadData();startObserver();}
window.KategoriYildizi={renderWithConfig(newConfig){appConfig=newConfig||{};renderAll();}};
})();
