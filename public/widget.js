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
const LEGACY_PREMIUM={premium1:'premium-crown-orbit',premium2:'premium-trophy-glow',premium3:'premium-medal-spin',premium4:'premium-flame-winner',premium5:'premium-diamond-shine',premium6:'premium-rocket-rank',premium7:'premium-crown-orbit',premium8:'premium-trophy-glow',premium9:'premium-diamond-shine'};
const API_HOST=window.__KY_API_HOST||'https://katagori-yildizi-production.up.railway.app';
const SIMPLE_GRADIENT_TEMPLATES=new Set(['navy-pill','split-pill','eco-clean','arc-pill','rank-tab','color-block','understated']);
const RADIUS_TEMPLATES=new Set(['navy-pill','gradient-pill','split-pill','eco-clean','modern-outline','glass-pill','luxury-label','soft-stamp','arc-pill','rank-tab','signature-pill','understated','ticket-line']);
const BORDER_TEMPLATES=new Set(['navy-pill','gradient-pill','modern-outline','glass-pill','luxury-label','soft-stamp','understated','ticket-line']);
let appConfig=null,productsMap={};
let lastMobile=matchMedia('(max-width:768px)').matches;

function injectRuntimeStyles(){
 if(!document.querySelector('link[data-ky-color-integrity]')){
   const l=document.createElement('link');l.rel='stylesheet';l.href=`${API_HOST}/template-color-integrity.css?v=20260917-5`;l.dataset.kyColorIntegrity='1';document.head.appendChild(l);
 }
 if(!document.querySelector('link[data-ky-premium-templates-v3]')){
   const pv3=document.createElement('link');pv3.rel='stylesheet';pv3.href=`${API_HOST}/premium-templates-v3.css?v=20260917-1`;pv3.dataset.kyPremiumTemplatesV3='1';document.head.appendChild(pv3);
 }
 if(!document.querySelector('link[data-ky-premium-elite]')){
   const pe=document.createElement('link');pe.rel='stylesheet';pe.href=`${API_HOST}/premium-templates-elite.css?v=20260917-5`;pe.dataset.kyPremiumElite='1';document.head.appendChild(pe);
 }
 if(!document.querySelector('link[data-ky-legacy-static]')){
   const ls=document.createElement('link');ls.rel='stylesheet';ls.href=`${API_HOST}/legacy-templates-static.css?v=20260917-1`;ls.dataset.kyLegacyStatic='1';document.head.appendChild(ls);
 }
 if(!document.querySelector('link[data-ky-premium-icon-compat]')){
   const pic=document.createElement('link');pic.rel='stylesheet';pic.href=`${API_HOST}/premium-icon-template-compat.css?v=20260917-2`;pic.dataset.kyPremiumIconCompat='1';document.head.appendChild(pic);
 }
 if(document.getElementById('ky-runtime-v2'))return;
 const s=document.createElement('style');s.id='ky-runtime-v2';s.textContent=`
 @keyframes ky-slide-right{from{transform:translateX(-14px);opacity:0}to{transform:translateX(0);opacity:1}}
 .ky-anim-flip{animation:ky-flip var(--ky-anim-dur,.42s) cubic-bezier(.2,.75,.25,1) forwards;backface-visibility:hidden}
 .ky-offset-shell{display:inline-flex;max-width:100%}
 .ky-pos-bottom-full>.ky-offset-shell,.ky-pos-under-full>.ky-offset-shell{display:flex;width:100%;max-width:none;justify-content:center}.ky-pos-bottom-full .ky-badge-root:not([class*="ky-tpl-premium-elite-"]),.ky-pos-under-full .ky-badge-root:not([class*="ky-tpl-premium-elite-"]){width:100%;min-width:100%;max-width:none;justify-content:center;border-radius:0!important;transform:none!important}
 .ky-pos-under-full{position:relative;display:flex;width:100%;inset:auto!important;z-index:10;box-sizing:border-box}
 .ky-tpl-category-context .ky-detail-badge-wrap{display:inline-flex;align-items:center;margin-left:2px;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;padding:0!important}
 .ky-premium-icon{--p-main:#243a8b;--p-accent:#f2b84b;display:inline-flex!important;width:1.35em;height:1.35em;align-items:center;justify-content:center;flex:0 0 auto;background:transparent!important}.ky-premium-icon svg{width:100%;height:100%;display:block;overflow:visible}.ky-premium-icon .p-main{fill:var(--ky-icon-main,var(--p-main))}.ky-premium-icon .p-accent,.ky-premium-icon .p-star,.ky-premium-icon .p-spark{fill:var(--ky-icon-accent,var(--p-accent))}.ky-premium-icon .p-trail{fill:none;stroke:var(--ky-icon-accent,var(--p-accent));stroke-width:3;stroke-linecap:round}
 .ky-premium-bolt-ring .p-spin{fill:none;stroke:var(--ky-icon-accent,var(--p-accent))}
 @keyframes kyPremFloat{50%{transform:translateY(-3px)}}@keyframes kyPremSpark{50%{opacity:.2;transform:scale(.45)}}@keyframes kyPremPulse{50%{transform:scale(1.08)}}@keyframes kyPremSpin{to{transform:rotate(360deg)}}@keyframes kyPremSway{50%{transform:rotate(5deg)}}@keyframes kyPremFlame{50%{transform:scale(.92,1.08) translateY(-1px)}}@keyframes kyPremShine{0%,35%{transform:translateX(-25px);opacity:0}55%{opacity:.9}75%,100%{transform:translateX(25px);opacity:0}}@keyframes kyPremRocket{50%{transform:translate(2px,-3px)}}
 .ky-premium-crown-orbit .p-float,.ky-premium-gift-pop .p-float,.ky-premium-heart-crown .p-float{transform-origin:center;animation:kyPremFloat 1.8s ease-in-out infinite}.ky-premium-crown-orbit .p-spark{transform-box:fill-box;transform-origin:center;animation:kyPremSpark 1.1s ease-in-out infinite}.ky-premium-crown-orbit .p-s2{animation-delay:.55s}.ky-premium-trophy-glow .p-pulse,.ky-premium-shield-spark .p-pulse,.ky-premium-laurel-star .p-pulse,.ky-premium-bolt-ring .p-pulse,.ky-premium-heart-crown .p-pulse,.ky-premium-check-burst .p-pulse{transform-origin:center;animation:kyPremPulse 1.5s ease-in-out infinite}.ky-premium-trophy-glow .p-ray,.ky-premium-shield-spark .p-spark{animation:kyPremSpark 1.3s ease-in-out infinite}.ky-premium-medal-spin .p-star,.ky-premium-bolt-ring .p-spin,.ky-premium-check-burst .p-spin{transform-box:fill-box;transform-origin:center;animation:kyPremSpin 4s linear infinite}.ky-premium-medal-spin .p-ribbon-left,.ky-premium-medal-spin .p-ribbon-right,.ky-premium-laurel-star .p-ribbon-left,.ky-premium-laurel-star .p-ribbon-right,.ky-premium-gift-pop .p-sway{transform-origin:top center;animation:kyPremSway 1.4s ease-in-out infinite alternate}.ky-premium-flame-winner .p-flame,.ky-premium-flame-winner .p-flame-core{transform-origin:center bottom;animation:kyPremFlame .9s ease-in-out infinite}.ky-premium-flame-winner .p-flame-core{animation-delay:.2s}.ky-premium-diamond-shine svg{clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}.ky-premium-diamond-shine .p-shine{fill:#fff;opacity:0;animation:kyPremShine 2.4s ease-in-out infinite}.ky-premium-rocket-rank .p-rocket{animation:kyPremRocket 1.25s ease-in-out infinite}.ky-premium-rocket-rank .p-flare{transform-origin:center;animation:kyPremPulse .75s ease-in-out infinite}
 @media(prefers-reduced-motion:reduce){.ky-premium-icon *{animation:none!important}}
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
function normalizeIconType(type){return LEGACY_PREMIUM[type]||String(type||'award');}
function premiumIconSvg(type,icon){const key=normalizeIconType(type).replace('premium-',''),main=cleanCss(icon.color||'#243a8b'),accent=cleanCss(icon.accentColor||'#f2b84b'),size=Math.max(8,Math.min(48,Number(icon.size||14))),common='viewBox="0 0 48 48" aria-hidden="true"';let svg='';if(key==='crown-orbit')svg=`<path class="p-main p-float" d="m7 15 9 9 8-14 8 14 9-9-4 22H11Z"/><path class="p-accent" d="M12 39h24v4H12z"/><circle class="p-spark p-s1" cx="8" cy="8" r="2"/><circle class="p-spark p-s2" cx="40" cy="8" r="2"/>`;else if(key==='trophy-glow')svg=`<path class="p-accent p-ray" d="M23 2h3v7h-3zM5 11l2-2 5 5-2 2zm31 3 5-5 2 2-5 5z"/><path class="p-main p-pulse" d="M13 9h22v9c0 8-4 13-9 14v5h8v5H14v-5h8v-5c-5-1-9-6-9-14Zm-2 4H5v6c0 6 4 10 10 10v-5c-3 0-5-2-5-5v-2h3Zm26 0v4h3v2c0 3-2 5-5 5v5c6 0 10-4 10-10v-6Z"/>`;else if(key==='medal-spin')svg=`<path class="p-accent p-ribbon-left" d="m13 27-4 18 10-6 5 7 3-17Z"/><path class="p-accent p-ribbon-right" d="m35 27 4 18-10-6-5 7-3-17Z"/><circle class="p-main" cx="24" cy="19" r="15"/><path class="p-star" d="m24 8 3.4 6.9 7.6 1.1-5.5 5.3 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6L13 16l7.6-1.1Z"/>`;else if(key==='flame-winner')svg=`<path class="p-main p-flame" d="M27 3c2 10 12 13 12 26 0 9-7 16-16 16S7 38 7 29c0-7 4-13 10-18-1 8 3 11 6 12-2-8 0-15 4-20Z"/><path class="p-accent p-flame-core" d="M25 22c1 6 7 7 7 14 0 5-4 9-9 9s-9-4-9-9c0-4 2-7 6-10 0 4 2 6 4 7-1-4-1-8 1-11Z"/>`;else if(key==='diamond-shine')svg=`<path class="p-main" d="m8 16 8-11h16l8 11-16 28Z"/><path class="p-accent" d="M8 16h32L24 44Z" opacity=".55"/><path class="p-shine" d="m12 11 4-5 20 29-3 5Z"/>`;else if(key==='rocket-rank')svg=`<path class="p-trail" d="M14 35 8 43m12-6-5 8"/><path class="p-main p-rocket" d="M18 31 11 30l5-6C17 12 25 5 38 3c-2 13-9 21-21 22l-6 5Zm8-15a5 5 0 1 0 10 0 5 5 0 0 0-10 0Z"/><path class="p-accent p-flare" d="M15 33c-6 1-9 4-10 10 6-1 9-4 10-10Z"/>`;else if(key==='shield-spark')svg=`<path class="p-main p-pulse" d="M24 3 41 9v13c0 11-7 19-17 23C14 41 7 33 7 22V9Z"/><path class="p-accent" d="m16 23 5 5 11-12 4 4-15 15-9-8Z"/><circle class="p-spark" cx="39" cy="8" r="3"/>`;else if(key==='laurel-star')svg=`<path class="p-accent p-ribbon-left" d="M17 42C8 38 4 29 7 18l5 2c-2 8 1 14 8 18Zm14 0c9-4 13-13 10-24l-5 2c2 8-1 14-8 18Z"/><path class="p-main p-pulse" d="m24 5 5 10 11 2-8 8 2 12-10-6-10 6 2-12-8-8 11-2Z"/>`;else if(key==='bolt-ring')svg=`<circle class="p-accent p-spin" cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="22 8"/><path class="p-main p-pulse" d="M27 3 10 27h12l-2 18 18-27H26Z"/>`;else if(key==='gift-pop')svg=`<path class="p-main p-float" d="M6 20h36v23H6z"/><path class="p-accent" d="M21 18h6v25h-6zM4 13h40v9H4z"/><path class="p-main p-sway" d="M23 13C13 13 9 10 9 5c0-4 5-5 8-3 4 2 6 7 6 11Zm2 0c10 0 14-3 14-8 0-4-5-5-8-3-4 2-6 7-6 11Z"/>`;else if(key==='heart-crown')svg=`<path class="p-main p-pulse" d="M24 44 6 27C-2 18 4 7 14 7c5 0 8 3 10 6 2-3 5-6 10-6 10 0 16 11 8 20Z"/><path class="p-accent p-float" d="m11 11 4-8 9 7 9-7 4 8-4 7H15Z"/>`;else svg=`<path class="p-accent p-spin" d="m24 2 5 7 9-1 1 9 7 5-5 7 1 9-9 1-5 7-7-5-9 1-1-9-7-5 5-7-1-9 9-1Z"/><circle class="p-main p-pulse" cx="24" cy="24" r="14"/><path d="m16 24 5 5 11-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;return `<span class="ky-premium-icon ky-premium-${key}" style="font-size:${size}px;--ky-icon-main:${main};--ky-icon-accent:${accent}"><svg ${common}>${svg}</svg></span>`;}
function iconSvg(c){const icon=c.icon||{};if(!icon.enabled||icon.type==='none')return '';if(icon.type==='custom_svg'&&icon.customSvg)return icon.customSvg;const type=normalizeIconType(icon.type);return type.startsWith('premium-')?premiumIconSvg(type,icon):(ICONS[type]||'');}
function animationClasses(c){const a=c.animation||{};return a.entry&&a.entry!=='none'?'ky-anim-'+a.entry:'';}
function shadowValue(v,accent){return v==='soft'?'0 5px 12px rgba(16,24,40,.12)':v==='medium'?'0 9px 20px rgba(16,24,40,.18)':v==='strong'?'0 12px 28px rgba(16,24,40,.26)':v==='glow'?`0 0 18px ${accent}77`:'none';}
function outlineTextColor(text,bg){const contrast=v=>{const m=/^#([0-9a-f]{6})$/i.exec(String(v||''));if(!m)return 0;const rgb=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));const l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return 1.05/(l+.05)};return contrast(text)>=3?text:contrast(bg)>=3?bg:'#17213a';}
function badgeMarkup(data,c,text){
 const tpl=c.templateId||'navy-pill',st=c.styling||{},tc=templateColors(c,tpl);
 const bg=cleanCss(tc.bg||st.bgColor||'#243a8b'),rawFg=cleanCss(tc.text||st.textColor||'#fff'),fg=tpl==='gradient-pill'?outlineTextColor(rawFg,bg):rawFg,accent=cleanCss(tc.accent||st.accentColor||'#ce3f44');
 const gradient=!!st.gradientEnabled&&SIMPLE_GRADIENT_TEMPLATES.has(tpl);
 const radius=RADIUS_TEMPLATES.has(tpl)?Number(st.borderRadius??8):null;
 const borderWidth=BORDER_TEMPLATES.has(tpl)?Number(st.borderWidth||0):0;
 const styles=[`--ky-primary-bg:${bg}`,`--ky-primary-text:${fg}`,`--ky-accent:${accent}`,`--ky-border-color:${cleanCss(st.borderColor||'transparent')}`,`--ky-border-width:${borderWidth}px`,`--ky-font-size:${Number(st.fontSize||12)}px`,`--ky-font-weight:${Number(st.fontWeight||700)}`,`--ky-padding-x:${Number(st.paddingX||10)}px`,`--ky-padding-y:${Number(st.paddingY||5)}px`,`--ky-scale:${Number(st.scale||100)/100}`,`--ky-opacity:${Number(st.opacity||100)/100}`,`--ky-shadow:${shadowValue(st.shadow,accent)}`,`--ky-anim-dur:${Number(c.animation?.durationMs||320)/1000}s`];
 if(radius!==null)styles.push(`border-radius:${radius}px`);
 if(gradient)styles.push(`background:linear-gradient(${Number(st.gradientAngle||135)}deg,${cleanCss(st.gradientColor1||bg)},${cleanCss(st.gradientColor2||accent)})`);
 if(st.shadow)styles.push(`box-shadow:${shadowValue(st.shadow,accent)}`);
 const icon=iconSvg(c);
 return `<span class="ky-badge-root ky-tpl-${cleanCss(tpl)} ${animationClasses(c)}" style="${styles.join(';')}" data-ky-product="${cleanCss(data.productId||'')}" data-icon-type="${cleanCss(normalizeIconType(c.icon?.type))}">${icon}<span class="ky-badge-text">${escapeHtml(text)}</span></span>`;
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
function clearRendered(){document.querySelectorAll('.ky-badge-container[data-ky-runtime],.ky-tpl-category-context[data-ky-runtime]').forEach(el=>el.remove());document.querySelectorAll('[data-ky-badge-rendered]').forEach(el=>el.removeAttribute('data-ky-badge-rendered'));}
function pickDataForCard(card,idx){const id=card.getAttribute('data-product-id')||card.dataset.productId||card.getAttribute('data-id');if(id&&productsMap[id])return productsMap[id];const vals=Object.values(productsMap);return vals[idx]||null;}
function positionClass(p){if(p.cardLocation==='image_bottom_bar')return 'ky-pos-under-full';if(p.cardLocation==='image_inside_bottom_bar')return 'ky-pos-bottom-full';return 'ky-pos-'+String(p.ninePointPosition||'top_left').replaceAll('_','-');}
function renderCategoryCards(){
 const c=effectiveConfig();if(!c||c.placements?.categoryCards===false)return;
 const cards=[...document.querySelectorAll('.product-card,.product-item,[data-product-id],article[class*="product"]')];
 cards.forEach((card,idx)=>{
   if(card.dataset.kyBadgeRendered==='1'||card.querySelector('.ky-badge-container[data-ky-runtime]'))return;
   let d=pickDataForCard(card,idx);if(!d){d={productId:'card_'+idx,rank:idx+1,categoryName:''};}
   const rank=Number(d.rank||idx+1);if(rank>Number(c.ranking?.maxRank||3))return;
   const img=card.querySelector('img'),host=img?(img.closest('.image-wrapper,.product-image,picture')||img.parentElement):card;if(!host)return;
   const placement=c.placements||{},isUnder=placement.cardLocation==='image_bottom_bar',isFullBar=isUnder||placement.cardLocation==='image_inside_bottom_bar';
   if(!isUnder)host.classList.add('ky-pos-parent');const wrap=document.createElement('div');wrap.dataset.kyRuntime='1';wrap.className='ky-badge-container '+positionClass(placement);
   const ox=Number(placement.offsetX||0),oy=Number(placement.offsetY||0),transform=isFullBar?`translateY(${oy}px)`:`translate(${ox}px,${oy}px)`;wrap.innerHTML=`<span class="ky-offset-shell" style="transform:${transform}">${badgeMarkup(d,c,cardText(d,c))}</span>`;
   if(isUnder)host.insertAdjacentElement('afterend',wrap);else host.appendChild(wrap);card.dataset.kyBadgeRendered='1';
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

// Load premium-icon-motion-runtime once in storefront (dynamic load with duplicate prevention)
(function loadPremiumIconMotion() {
  const marker = '__ky-premium-motion-loaded';
  if (window[marker]) return;
  window[marker] = true;

  const script = document.createElement('script');
  script.src = `${window.__KY_API_HOST || 'https://katagori-yildizi-production.up.railway.app'}/premium-icon-motion-runtime.js?v=20260917-1`;
  script.async = true;
  document.head.appendChild(script);
})();
