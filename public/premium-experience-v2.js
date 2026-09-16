/* Kategori Yildizi — Premium Experience v5
   Legacy premium designs are now standard; twenty elite designs form the premium collection. */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const LEGACY=[
 {id:'premium-aurora',name:'Aurora Halo',bg:'#18204a',text:'#ffffff',accent:'#a855f7'},
 {id:'premium-prism',name:'Prizma Akışı',bg:'#16265f',text:'#ffffff',accent:'#ff3366'},
 {id:'premium-nebula',name:'Nebula Pulse',bg:'#171235',text:'#ffffff',accent:'#e879f9'},
 {id:'premium-liquid',name:'Sıvı Krom',bg:'#243a8b',text:'#ffffff',accent:'#22d3ee'},
 {id:'premium-photon',name:'Foton Rayı',bg:'#0f1f4d',text:'#ffffff',accent:'#06b6d4'},
 {id:'premium-hologram',name:'Hologram Shift',bg:'#f3f4ff',text:'#243a8b',accent:'#d946ef'},
 {id:'premium-comet',name:'Comet Orbit',bg:'#172554',text:'#ffffff',accent:'#22d3ee'},
 {id:'premium-spectrum',name:'Spektrum Taç',bg:'#243a8b',text:'#ffffff',accent:'#f43f5e'},
 {id:'premium-quantum',name:'Kuantum Cam',bg:'#36457d',text:'#ffffff',accent:'#a78bfa'},
 {id:'premium-electric',name:'Elektrik Çerçeve',bg:'#101b45',text:'#ffffff',accent:'#00f5ff'}
];
const PREMIUM=[
 {id:'premium-elite-lumen',name:'Maison Kurdele',bg:'#182142',text:'#ffffff',accent:'#d9b76e',mark:'M'},
 {id:'premium-elite-cosmos',name:'Kraliyet Mührü',bg:'#321744',text:'#ffffff',accent:'#f3cf78',mark:'♛'},
 {id:'premium-elite-opal',name:'Opal Editorial',bg:'#fffaf7',text:'#243a8b',accent:'#d77bb5',mark:'O'},
 {id:'premium-elite-vortex',name:'Neon Tabela',bg:'#090c1d',text:'#ffffff',accent:'#42ffe8',mark:'✦'},
 {id:'premium-elite-sapphire',name:'Safir Çift Etiket',bg:'#102c61',text:'#ffffff',accent:'#75c7ff',mark:'S'},
 {id:'premium-elite-solar',name:'Güneş Madalyonu',bg:'#5a240d',text:'#fff8df',accent:'#ffc75b',mark:'☀'},
 {id:'premium-elite-crystal',name:'Kristal Bilet',bg:'#222c64',text:'#ffffff',accent:'#9ceeff',mark:'◆'},
 {id:'premium-elite-midnight',name:'Gece İmzası',bg:'#080b15',text:'#ffffff',accent:'#7387ff',mark:'✧'},
 {id:'premium-elite-silk',name:'İpek Moda Etiketi',bg:'#17333a',text:'#ffffff',accent:'#8bf1c7',mark:'S'},
 {id:'premium-elite-plasma',name:'Plazma Monogram',bg:'#310a39',text:'#ffffff',accent:'#ff68dd',mark:'P'},
 {id:'premium-elite-galaxy',name:'Galaksi Rozeti',bg:'#16184b',text:'#ffffff',accent:'#ad8cff',mark:'✺'},
 {id:'premium-elite-chrome',name:'Krom Heykel',bg:'#34517a',text:'#ffffff',accent:'#c6f3ff',mark:'C'},
 {id:'premium-elite-zenith',name:'Zenit Ok',bg:'#123651',text:'#ffffff',accent:'#48dcff',mark:'Z'},
 {id:'premium-elite-diamond',name:'Art Deco Elmas',bg:'#25204c',text:'#ffffff',accent:'#f0c66d',mark:'♦'},
 {id:'premium-elite-firefly',name:'Botanik Işık',bg:'#17311f',text:'#ffffff',accent:'#d7ef82',mark:'✣'},
 {id:'premium-elite-polar',name:'Kutup Katmanı',bg:'#0c3940',text:'#ffffff',accent:'#6fffd4',mark:'⌁'},
 {id:'premium-elite-digital',name:'Dijital Plaka',bg:'#101936',text:'#ffffff',accent:'#41e8ff',mark:'⌘'},
 {id:'premium-elite-pearl',name:'İnci Çerçeve',bg:'#fffafc',text:'#243a8b',accent:'#d895e8',mark:'○'},
 {id:'premium-elite-meteor',name:'Meteor Kurdele',bg:'#24182d',text:'#ffffff',accent:'#ff876b',mark:'☄'},
 {id:'premium-elite-infinity',name:'Sonsuzluk Cam Kart',bg:'#153449',text:'#ffffff',accent:'#75e6ff',mark:'∞'},
 {id:'premium-elite-ivory',name:'Fildişi Atelier',bg:'#fffdf7',text:'#243a8b',accent:'#c9a55d',mark:'A'},
 {id:'premium-elite-champagne',name:'Şampanya Kurdele',bg:'#fff7df',text:'#5a4520',accent:'#d8ad4f',mark:'✦'},
 {id:'premium-elite-rose',name:'Rose Quartz',bg:'#fff1f5',text:'#66304a',accent:'#e287ad',mark:'◇'},
 {id:'premium-elite-porcelain',name:'Porselen Mavi',bg:'#f5f9ff',text:'#243a8b',accent:'#78a9e8',mark:'P'},
 {id:'premium-elite-mint',name:'Mint İpek',bg:'#effbf7',text:'#205348',accent:'#70c9ad',mark:'S'},
 {id:'premium-elite-paper',name:'Paper Luxe',bg:'#fffefb',text:'#262f4d',accent:'#d56b61',mark:'L'},
 {id:'premium-elite-lavender',name:'Lavanta Cam',bg:'#f7f3ff',text:'#493c70',accent:'#a98be8',mark:'○'},
 {id:'premium-elite-porcelain-seal',name:'Porselen Mühür',bg:'#fffefe',text:'#264b72',accent:'#79b8d8',mark:'❋'}
];
const PREMIUM_IDS=new Set(PREMIUM.map(x=>x.id));
const CUSTOM=[...LEGACY,...PREMIUM];
const CUSTOM_IDS=new Set(CUSTOM.map(x=>x.id));
const LEGACY_VARIANTS=['atelier','contour','editorial','medallion','sage','frame','frosted','luxe','stamp','arc','ranktab','signature','fold','colorblock','understated','ticket','pill'];
const palettes=Object.fromEntries(CUSTOM.map(x=>[x.id,{bg:x.bg,text:x.text,accent:x.accent}]));
let iconTab=sessionStorage.getItem('ky-premium-icon-tab')||'basic';
let templateTab=sessionStorage.getItem('ky-premium-template-tab')||'basic';
let currentTemplateId='';
let wrapped=false,uiScheduled=false,previewScheduled=false,processing=false,stageObserver=null,templateObserver=null;

function makeTabs(kind,firstLabel,secondLabel){const tabs=document.createElement('div');tabs.className='ky-premium-tabs';tabs.dataset.premiumTabs=kind;tabs.innerHTML=`<button type="button" data-premium-tab="basic">${firstLabel}</button><button type="button" class="premium" data-premium-tab="premium"><span class="ky-premium-tab-crown">♛</span>${secondLabel}</button>`;return tabs}
function setTabActive(tabs,mode){qa('[data-premium-tab]',tabs).forEach(b=>b.classList.toggle('active',b.dataset.premiumTab===mode))}
function linkCss(){if(!q('link[data-ky-premium-template-v3]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/premium-templates-v3.css?v=20260916-1';l.dataset.kyPremiumTemplateV3='1';document.head.appendChild(l)}if(!q('link[data-ky-premium-elite]')){const e=document.createElement('link');e.rel='stylesheet';e.href='/premium-templates-elite.css?v=20260916-3';e.dataset.kyPremiumElite='1';document.head.appendChild(e)}}

function applyIconTab(){const wrap=q('#v3Icons .ky-icon-sections');if(!wrap)return;const basic=q('.ky-icon-basic',wrap),premium=q('.ky-icon-premium',wrap),tabs=q('[data-premium-tabs="icons"]');if(!basic||!premium||!tabs)return;basic.hidden=iconTab!=='basic';premium.hidden=iconTab!=='premium';setTabActive(tabs,iconTab)}
function ensureIconTabs(){const host=q('#v3Icons'),wrap=q('#v3Icons .ky-icon-sections');if(!host||!wrap)return;const basic=q('.ky-icon-basic',wrap),premium=q('.ky-icon-premium',wrap);if(!basic||!premium)return;const bt=q('.ky-icon-section-head strong',basic);if(bt)bt.textContent='Rozetler';let tabs=q('[data-premium-tabs="icons"]');if(!tabs){tabs=makeTabs('icons','Rozetler','Premium');host.parentNode.insertBefore(tabs,host);tabs.addEventListener('click',e=>{const b=e.target.closest('[data-premium-tab]');if(!b)return;iconTab=b.dataset.premiumTab;sessionStorage.setItem('ky-premium-icon-tab',iconTab);applyIconTab()})}applyIconTab()}

function premiumCard(t){const c=palettes[t.id],paid=PREMIUM_IDS.has(t.id),card=document.createElement('button'),mark=t.mark||'✦';card.type='button';card.className='ky-template-card-v3 '+(paid?'ky-premium-template-v3 ky-elite-template-card':'ky-legacy-template-v3');card.dataset.template=t.id;card.dataset.premiumV3=paid?'1':'0';card.innerHTML=`<span class="preview"><span class="ky-v3-badge tpl-${t.id}" style="--badge-bg:${c.bg};--badge-text:${c.text};--badge-accent:${c.accent};font-size:9px;padding:6px 9px"><span class="ky-premium-emblem" aria-hidden="true">${mark}</span><span class="ky-badge-text">#1 Çok Satan</span></span></span><span class="name">${t.name}</span>${paid?'<span class="ky-premium-v3-mark">♛ Premium</span>':''}`;card.addEventListener('click',()=>selectPremium(t.id));return card}
function ensurePremiumCards(){const host=q('#v3Templates');if(!host)return;CUSTOM.forEach(t=>{if(!q(`[data-template="${t.id}"]`,host))host.appendChild(premiumCard(t))})}
function cleanStandardCards(){const host=q('#v3Templates');if(!host)return;qa('.ky-template-card-v3[data-template]',host).forEach(card=>{if(PREMIUM_IDS.has(card.dataset.template))return;card.classList.remove('ky-premium-template-choice','ky-premium-template-v3','ky-elite-template-card');qa('.ky-premium-template-mark,.ky-premium-v3-mark',card).forEach(x=>x.remove())})}
function applyTemplateTab(){const host=q('#v3Templates'),tabs=q('[data-premium-tabs="templates"]');if(!host||!tabs)return;cleanStandardCards();ensurePremiumCards();qa('.ky-template-card-v3[data-template]',host).forEach(card=>{const premium=PREMIUM_IDS.has(card.dataset.template);card.hidden=templateTab==='premium'?!premium:premium;card.classList.toggle('active',card.dataset.template===currentTemplateId)});setTabActive(tabs,templateTab);host.classList.toggle('premium-open',templateTab==='premium')}
function ensureTemplateTabs(){const host=q('#v3Templates');if(!host)return;let tabs=q('[data-premium-tabs="templates"]');if(!tabs){tabs=makeTabs('templates','Şablonlar','Premium Şablonlar');host.parentNode.insertBefore(tabs,host);tabs.addEventListener('click',e=>{const b=e.target.closest('[data-premium-tab]');if(!b)return;templateTab=b.dataset.premiumTab==='premium'?'premium':'basic';sessionStorage.setItem('ky-premium-template-tab',templateTab);applyTemplateTab()})}ensurePremiumCards();applyTemplateTab()}

function editorHtml(id){const t=CUSTOM.find(x=>x.id===id),c=palettes[id],paid=PREMIUM_IDS.has(id);return `<div class="ky-template-editor ky-premium-editor-v3"><div class="ky-template-editor-title"><strong>${t.name} renkleri</strong><span>${paid?'Bu Premium şablona özel':'Standart şablon renkleri'}</span></div>${colorField('tplBg','Ana Renk',c.bg)}${colorField('tplText','Metin',c.text)}${colorField('tplAccent','Vurgu / Işık Rengi',c.accent)}</div>`}
function colorField(id,label,value){return `<div class="ky-field"><label class="ky-label">${label}</label><div class="ky-color-row"><input id="${id}Picker" type="color" value="${value}"><input id="${id}Hex" class="ky-input" value="${value}" maxlength="7"></div></div>`}
function renderPremiumEditor(force=false){
 if(!CUSTOM_IDS.has(currentTemplateId))return;
 const host=q('#v3TemplateEditor');if(!host)return;
 if(!force&&host.dataset.kyPremiumEditorId===currentTemplateId&&q('.ky-premium-editor-v3',host))return;
 host.dataset.kyPremiumEditorId=currentTemplateId;
 host.innerHTML=editorHtml(currentTemplateId);
 for(const [key,field] of [['Bg','bg'],['Text','text'],['Accent','accent']]){
  const p=q('#tpl'+key+'Picker'),h=q('#tpl'+key+'Hex');
  const apply=v=>{if(!/^#[0-9a-f]{6}$/i.test(v))return;palettes[currentTemplateId][field]=v;const c=palettes[currentTemplateId];window.handleInput?.(`templateColors.${currentTemplateId}`,{...c});updatePremiumCard(currentTemplateId);schedulePreview()};
  p.oninput=()=>{h.value=p.value;apply(p.value)};
  h.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(h.value)){p.value=h.value;apply(h.value)}};
 }
}
function updatePremiumCard(id){const card=q(`#v3Templates [data-template="${id}"]`),badge=q('.ky-v3-badge',card),c=palettes[id];applyPremiumIdentity(badge,id,c,false)}
function applyPremiumIdentity(el,id,c,storefront=false){
 if(!el)return;
 const prefix=storefront?'ky-tpl-':'tpl-',target=prefix+id;
 for(const cls of [...el.classList]){
  if(cls.startsWith(prefix+'premium-')&&cls!==target)el.classList.remove(cls);
  if(!storefront&&LEGACY_VARIANTS.includes(cls))el.classList.remove(cls);
 }
 el.classList.add(target);
 for(const [name,value] of [['--badge-bg',c.bg],['--badge-text',c.text],['--badge-accent',c.accent],['--p-bg',c.bg],['--p-text',c.text],['--p-accent',c.accent]]){
  if(el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);
 }
}
function selectPremium(id){
 if(!CUSTOM_IDS.has(id))return;
 currentTemplateId=id;templateTab=PREMIUM_IDS.has(id)?'premium':'basic';sessionStorage.setItem('ky-premium-template-tab',templateTab);
 applyTemplateTab();renderPremiumEditor(true);
 window.handleInput?.('templateId',id);
 const path=`templateColors.${id}`,value={...palettes[id]};
 if(typeof window.__KY_QUEUE_CONFIG_WRITE__==='function')window.__KY_QUEUE_CONFIG_WRITE__(path,value);else window.handleInput?.(path,value);
 schedulePreview();
}

function applyPreviewPremium(){
 if(processing||!CUSTOM_IDS.has(currentTemplateId))return;
 processing=true;
 try{
  const c=palettes[currentTemplateId];
  const source=q(`#v3Templates [data-template="${CSS.escape(currentTemplateId)}"] .ky-v3-badge`);
  applyPremiumIdentity(source,currentTemplateId,c,false);
  qa('#stageCanvas .ky-v3-badge').forEach(b=>{
   applyPremiumIdentity(b,currentTemplateId,c,false);
   if(b.style.color!==c.text)b.style.setProperty('color',c.text);
  });
  qa('#stageCanvas .ky-badge-root').forEach(b=>applyPremiumIdentity(b,currentTemplateId,c,true));
  const live=q('#stageCanvas .ky-v3-badge');
  if(live)document.dispatchEvent(new CustomEvent('ky:premium-template-applied',{detail:{id:currentTemplateId,html:live.outerHTML}}));
 }finally{processing=false}
}
function schedulePreview(){if(previewScheduled)return;previewScheduled=true;requestAnimationFrame(()=>{previewScheduled=false;applyPreviewPremium()})}
function observeStage(){const stage=q('#stageCanvas');if(!stage)return;stageObserver?.disconnect();stageObserver=new MutationObserver(records=>{if(processing||!CUSTOM_IDS.has(currentTemplateId))return;if(records.some(r=>r.addedNodes?.length||r.removedNodes?.length))schedulePreview()});stageObserver.observe(stage,{childList:true,subtree:true})}

function mergePaletteMap(map){if(!map||typeof map!=='object')return;CUSTOM.forEach(t=>{const c=map[t.id];if(c&&typeof c==='object')palettes[t.id]={...palettes[t.id],...c}})}
function wrapHandleInput(){
 if(wrapped||typeof window.handleInput!=='function')return;
 const original=window.handleInput;
 window.handleInput=function(path,val){
  if(path==='templateId'){
   currentTemplateId=String(val||'');
   if(PREMIUM_IDS.has(currentTemplateId)){templateTab='premium';sessionStorage.setItem('ky-premium-template-tab','premium')}else if(currentTemplateId)templateTab='basic';
  }else if(path==='templateColors')mergePaletteMap(val);
  else if(/^templateColors\./.test(path)){const id=path.slice('templateColors.'.length);if(CUSTOM_IDS.has(id)&&val&&typeof val==='object')palettes[id]={...palettes[id],...val}}
  const out=original.apply(this,arguments);
  queueUi();
  if(CUSTOM_IDS.has(currentTemplateId)){renderPremiumEditor();schedulePreview()}
  return out;
 };
 wrapped=true;
}
function captureStandardClick(e){const card=e.target.closest('#v3Templates .ky-template-card-v3[data-template]');if(!card)return;const id=card.dataset.template;if(PREMIUM_IDS.has(id))return;currentTemplateId=id;templateTab='basic';sessionStorage.setItem('ky-premium-template-tab','basic');requestAnimationFrame(applyTemplateTab)}

function queueUi(){if(uiScheduled)return;uiScheduled=true;requestAnimationFrame(()=>{uiScheduled=false;linkCss();wrapHandleInput();ensureIconTabs();ensureTemplateTabs();observeStage();if(CUSTOM_IDS.has(currentTemplateId)){renderPremiumEditor();schedulePreview()}})}
function observeTemplates(){const host=q('#v3Templates');if(!host)return;templateObserver?.disconnect();templateObserver=new MutationObserver(()=>queueUi());templateObserver.observe(host,{childList:true})}

const style=document.createElement('style');style.id='kyPremiumExperienceV3';style.textContent=`
@keyframes kyGoldBorderFlow{0%{background-position:0 50%,0 50%}100%{background-position:0 50%,220% 50%}}
.ky-premium-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 10px;padding:3px;border:1px solid rgba(36,58,139,.10);border-radius:11px;background:#f7f8fc}
.ky-premium-tabs button{min-height:38px;border:1px solid transparent;border-radius:8px;background:transparent;color:#243a8b;font:800 12px/1.15 inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:.16s ease}
.ky-premium-tabs button.active:not(.premium){background:#fff;border-color:rgba(36,58,139,.12);box-shadow:0 1px 5px rgba(36,58,139,.07)}
.ky-premium-tabs button.premium{color:#a56b00;border:1px solid transparent;background:linear-gradient(#fffaf0,#fffaf0) padding-box,linear-gradient(90deg,#9c6500,#ffd86f,#fff1a8,#b77800,#ffd86f) border-box;background-size:100% 100%,220% 100%;animation:kyGoldBorderFlow 3.2s linear infinite}
.ky-premium-tabs button.premium.active{background:linear-gradient(#fff6dc,#fff8e9) padding-box,linear-gradient(90deg,#9c6500,#ffe08a,#fff8c9,#b77800,#ffe08a) border-box;box-shadow:0 4px 14px rgba(199,145,30,.12)}
.ky-premium-tab-crown{color:#e2a61e!important;font-size:15px!important;line-height:1!important;margin:0!important}.ky-icon-section[hidden],.ky-template-card-v3[hidden]{display:none!important}
.ky-premium-editor-v3{border:1px solid rgba(124,58,237,.14)!important;background:linear-gradient(145deg,#fff,#f8f7ff)!important}
@media(prefers-reduced-motion:reduce){.ky-premium-tabs button.premium{animation:none!important}}
`;document.head.appendChild(style);

function start(){linkCss();document.addEventListener('click',captureStandardClick,true);queueUi();observeTemplates();setTimeout(()=>{queueUi();observeTemplates()},250);setTimeout(queueUi,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
