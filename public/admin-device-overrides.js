(function(){
'use strict';

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const clone=v=>JSON.parse(JSON.stringify(v??{}));
const shop=(new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');
const API=location.origin;

const VISUAL_PANELS=['panelTemplates','panelTexts','panelTypography','panelIcons','panelColors','panelBorders','panelSizing','panelPosition','panelAnimation','panelPlacement'];
const SIMPLE_GRADIENT_TEMPLATES=new Set(['navy-pill','split-pill','eco-clean','arc-pill','rank-tab','color-block','understated']);
const RADIUS_TEMPLATES=new Set(['navy-pill','gradient-pill','split-pill','eco-clean','modern-outline','glass-pill','luxury-label','soft-stamp','arc-pill','rank-tab','signature-pill','understated','ticket-line']);
const BORDER_TEMPLATES=new Set(['navy-pill','gradient-pill','modern-outline','glass-pill','luxury-label','soft-stamp','understated','ticket-line']);

const PATHS={
  v3ProductText:'texts.productText',v3PdpPrefix:'texts.pdpPrefixText',v3PdpBadge:'texts.pdpBadgeText',
  v3ThemeFont:'styling.useStoreThemeFont',v3Font:'styling.fontFamily',v3FontSize:'styling.fontSize',v3FontWeight:'styling.fontWeight',
  v3IconEnabled:'icon.enabled',v3IconSize:'icon.size',v3Bg:'styling.bgColor',v3TextColor:'styling.textColor',v3Accent:'styling.accentColor',
  v3Gradient:'styling.gradientEnabled',v3Grad1:'styling.gradientColor1',v3Grad2:'styling.gradientColor2',v3GradAngle:'styling.gradientAngle',
  v3BorderColor:'styling.borderColor',v3Radius:'styling.borderRadius',v3BorderWidth:'styling.borderWidth',v3Shadow:'styling.shadow',v3Opacity:'styling.opacity',
  v3PadX:'styling.paddingX',v3PadY:'styling.paddingY',v3Scale:'styling.scale',v3CardLocation:'placements.cardLocation',v3OffsetX:'placements.offsetX',v3OffsetY:'placements.offsetY',
  v3Entry:'animation.entry',v3Hover:'animation.hover',v3Duration:'animation.durationMs',
  v3Home:'placements.homeCards',v3Category:'placements.categoryCards',v3Search:'placements.searchResults',v3Pdp:'placements.productDetail'
};

let activeDevice='desktop';
let deviceSettings={desktop:null,mobile:null};
let ready=false;
let internal=false;
let persistTimer=0;
let categoryTimer=0;
let categoryObserver=null;

function getPath(obj,path,fallback){try{return path.split('.').reduce((a,k)=>a?.[k],obj)??fallback}catch{return fallback}}
function setPath(obj,path,val){const parts=path.split('.');let t=obj;for(const k of parts.slice(0,-1))t=t[k]||(t[k]={});t[parts.at(-1)]=val;}
function castValue(el){if(el.type==='checkbox')return !!el.checked;if(el.type==='range'||el.type==='number')return Number(el.value);if(el.id==='v3FontWeight')return Number(el.value);return el.value;}
function cfgWrite(path,val){if(typeof window.handleInput==='function')window.handleInput(path,val);}
function activeTemplate(){return deviceSettings[activeDevice]?.templateId||q('[data-template].active')?.dataset.template||'navy-pill';}

function persistProfile(device=activeDevice){
  clearTimeout(persistTimer);
  if(!ready||!deviceSettings[device])return;
  cfgWrite(`deviceSettings.${device}`,clone(deviceSettings[device]));
}
function schedulePersist(delay=220){
  clearTimeout(persistTimer);
  persistTimer=setTimeout(()=>persistProfile(activeDevice),delay);
}

function legacySnapshot(raw){
  const c=raw||{};
  return {templateId:c.templateId||'navy-pill',templateColors:clone(c.templateColors||{}),texts:clone(c.texts||{}),styling:clone(c.styling||{}),icon:clone(c.icon||{}),placements:clone(c.placements||{}),animation:clone(c.animation||{})};
}
function makeMobile(base,raw){
  const m=clone(base),r=raw?.responsive||{};
  m.styling=m.styling||{};
  m.styling.fontSize=Math.max(7,Number(m.styling.fontSize||12)+Number(r.mobileFontSizeOffset||0));
  m.styling.scale=Math.round(Number(m.styling.scale||100)*Number(r.mobileBadgeScale||100)/100);
  m.styling.paddingX=Number(r.mobilePaddingX??m.styling.paddingX??10);
  m.styling.paddingY=Number(r.mobilePaddingY??m.styling.paddingY??5);
  return m;
}
async function loadConfig(){
  try{
    const r=await fetch(`${API}/api/admin/settings?shop=${encodeURIComponent(shop)}&deviceEditor=1`,{cache:'no-store'});
    const d=await r.json();
    const raw=d.draftConfig||{};
    const base=legacySnapshot(raw);
    deviceSettings.desktop=clone(raw.deviceSettings?.desktop||base);
    deviceSettings.mobile=clone(raw.deviceSettings?.mobile||makeMobile(base,raw));
  }catch{
    const base=snapshotFromControls();
    deviceSettings.desktop=clone(base);deviceSettings.mobile=clone(base);
  }
}
function snapshotFromControls(){
  const out={templateId:q('[data-template].active')?.dataset.template||'navy-pill',templateColors:{},texts:{},styling:{},icon:{},placements:{},animation:{}};
  Object.entries(PATHS).forEach(([id,path])=>{const el=q('#'+id);if(el)setPath(out,path,castValue(el));});
  return out;
}

function mirrorControl(el,commit=false){
  if(internal||!ready||!el)return;
  const baseId=(el.id||'').replace(/(Picker|Hex)$/,'');
  const path=PATHS[baseId];
  if(path){
    let val;
    if(/Picker$/.test(el.id))val=el.value;
    else if(/Hex$/.test(el.id)){if(!/^#[0-9a-f]{6}$/i.test(el.value))return;val=el.value;}
    else val=castValue(el);
    setPath(deviceSettings[activeDevice],path,val);
    if(commit)persistProfile();else schedulePersist();
    enforceTemplateCapabilities(false);
    return;
  }
  if(baseId==='v3IconC1'||baseId==='v3IconC2'){
    const val=el.value;if(!/^#[0-9a-f]{6}$/i.test(val))return;
    setPath(deviceSettings[activeDevice],baseId==='v3IconC1'?'icon.color':'icon.accentColor',val);
    if(commit)persistProfile();else schedulePersist();
  }
}
function captureTemplateColor(el,commit=false){
  if(internal||!ready||!/^tpl(Bg|Text|Accent)(Picker|Hex)$/.test(el?.id||''))return;
  if(/Hex$/.test(el.id)&&!/^#[0-9a-f]{6}$/i.test(el.value))return;
  const field=el.id.includes('Bg')?'bg':el.id.includes('Text')?'text':'accent';
  const id=activeTemplate();
  deviceSettings[activeDevice].templateColors=deviceSettings[activeDevice].templateColors||{};
  deviceSettings[activeDevice].templateColors[id]={...(deviceSettings[activeDevice].templateColors[id]||{}),[field]:el.value};
  if(commit)persistProfile();else schedulePersist();
}
function captureTemplateClick(btn){
  if(!ready)return;const id=btn?.dataset.template;if(!id)return;
  deviceSettings[activeDevice].templateId=id;persistProfile();requestAnimationFrame(()=>enforceTemplateCapabilities(false));
}
function captureIconClick(btn){
  if(!ready)return;const type=btn?.dataset.icon;if(!type)return;
  setPath(deviceSettings[activeDevice],'icon.type',type);setPath(deviceSettings[activeDevice],'icon.enabled',type!=='none');persistProfile();
}
function capturePosition(btn){
  if(!ready)return;const pos=btn?.dataset.pos;if(!pos)return;
  setPath(deviceSettings[activeDevice],'placements.ninePointPosition',pos);persistProfile();
}
function captureIconMode(mode){if(!ready)return;setPath(deviceSettings[activeDevice],'icon.mode',mode);persistProfile();}

function walk(obj,fn,prefix=''){Object.entries(obj||{}).forEach(([k,v])=>{const path=prefix?`${prefix}.${k}`:k;if(v&&typeof v==='object'&&!Array.isArray(v))walk(v,fn,path);else fn(path,v);});}
function applyProfile(device){
  if(!deviceSettings[device]||internal)return;
  clearTimeout(persistTimer);
  activeDevice=device;internal=true;
  const p=deviceSettings[device];
  try{
    cfgWrite('templateColors',clone(p.templateColors||{}));
    if(p.templateId)cfgWrite('templateId',p.templateId);
    for(const section of ['texts','styling','icon','placements','animation'])walk(p[section]||{},(sub,val)=>cfgWrite(`${section}.${sub}`,val));
    cfgWrite('responsive.mobileFontSizeOffset',0);cfgWrite('responsive.mobileBadgeScale',100);
    if(p.styling?.paddingX!=null)cfgWrite('responsive.mobilePaddingX',p.styling.paddingX);
    if(p.styling?.paddingY!=null)cfgWrite('responsive.mobilePaddingY',p.styling.paddingY);
  }finally{internal=false;}
  requestAnimationFrame(()=>{syncControlsFromProfile();syncDeviceTabs();enforceTemplateCapabilities(false);});
}
function syncControlsFromProfile(){
  const p=deviceSettings[activeDevice];if(!p)return;internal=true;
  try{
    Object.entries(PATHS).forEach(([id,path])=>{const el=q('#'+id);if(!el)return;const v=getPath(p,path,undefined);if(v===undefined)return;if(el.type==='checkbox')el.checked=!!v;else el.value=v;});
    const setColorPair=(id,path)=>{const v=getPath(p,path,undefined);if(v===undefined)return;const picker=q('#'+id+'Picker'),hex=q('#'+id+'Hex');if(picker)picker.value=v;if(hex)hex.value=v;};
    [['v3Bg','styling.bgColor'],['v3TextColor','styling.textColor'],['v3Accent','styling.accentColor'],['v3Grad1','styling.gradientColor1'],['v3Grad2','styling.gradientColor2'],['v3BorderColor','styling.borderColor'],['v3IconC1','icon.color'],['v3IconC2','icon.accentColor']].forEach(([id,path])=>setColorPair(id,path));
    syncLabels();
  }finally{internal=false;}
}
function syncLabels(){
  const p=deviceSettings[activeDevice]||{};
  [['v3FontSizeVal','styling.fontSize',' px'],['v3IconSizeVal','icon.size',' px'],['v3GradAngleVal','styling.gradientAngle','°'],['v3RadiusVal','styling.borderRadius',' px'],['v3BorderWidthVal','styling.borderWidth',' px'],['v3OpacityVal','styling.opacity','%'],['v3PadXVal','styling.paddingX',' px'],['v3PadYVal','styling.paddingY',' px'],['v3ScaleVal','styling.scale','%'],['v3OffsetXVal','placements.offsetX',' px'],['v3OffsetYVal','placements.offsetY',' px'],['v3DurationVal','animation.durationMs',' ms']].forEach(([id,path,s])=>{const el=q('#'+id),v=getPath(p,path,undefined);if(el&&v!==undefined)el.textContent=`${v}${s}`;});
}
function syncDeviceTabs(){qa('.ky-device-editor-tabs').forEach(t=>qa('button',t).forEach(b=>b.classList.toggle('active',b.dataset.editDevice===activeDevice)));}
function switchDevice(device){if(device!==activeDevice)applyProfile(device);else syncDeviceTabs();}

function injectStaticStyle(){
  if(q('#kyDevicePerfStyle'))return;
  const st=document.createElement('style');st.id='kyDevicePerfStyle';st.textContent=`
    .ky-focus-pdp-badge,.ky-live-pdp-badge{border:0!important;box-shadow:none!important;background:transparent!important;padding:0!important}
    .ky-control-disabled{opacity:.42!important;pointer-events:none!important}
    .ky-category-body{display:none}.ky-category-card.open>.ky-category-body{display:block}.ky-category-head{cursor:pointer}.ky-category-arrow{margin-left:auto;transition:transform .16s ease}.ky-category-card.open .ky-category-arrow{transform:rotate(180deg)}
  `;document.head.appendChild(st);
}
function injectDeviceTabs(){
  VISUAL_PANELS.forEach(id=>{
    const panel=q('#'+id);if(!panel||q('.ky-device-editor-tabs',panel))return;
    const head=q('.ky-subpanel-header',panel);const tabs=document.createElement('div');tabs.className='ky-device-editor-tabs';tabs.innerHTML='<button type="button" data-edit-device="desktop">Masaüstü</button><button type="button" data-edit-device="mobile">Mobil</button>';
    if(head?.nextSibling)panel.insertBefore(tabs,head.nextSibling);else panel.prepend(tabs);
  });syncDeviceTabs();
}
function movePairAfter(anchorCard,card,panel){
  if(!anchorCard||!card||!panel)return;
  if(anchorCard.nextElementSibling!==card){anchorCard.after(card);}
  if(card.nextElementSibling!==panel){card.after(panel);}
}
function reorderMenu(){
  const menu=q('#menuList');if(!menu)return;
  const tpl=q('.ky-menu-card[data-target="panelTemplates"]',menu),tplPanel=q('#panelTemplates');
  const icons=q('.ky-menu-card[data-target="panelIcons"]',menu),iconsPanel=q('#panelIcons');
  const borders=q('.ky-menu-card[data-target="panelBorders"]',menu),bordersPanel=q('#panelBorders');
  if(icons){const title=q('.ky-menu-title',icons);if(title&&title.textContent!=='Rozetler')title.textContent='Rozetler';const sub=q('.ky-menu-subtitle',icons);if(sub&&sub.textContent!=='Rozet ikonları, premium seçenekler ve boyut')sub.textContent='Rozet ikonları, premium seçenekler ve boyut';}
  const ih=q('#panelIcons .ky-subpanel-title');if(ih&&ih.textContent!=='Rozetler')ih.textContent='Rozetler';
  if(tplPanel)movePairAfter(tplPanel,icons,iconsPanel);
  if(iconsPanel)movePairAfter(iconsPanel,borders,bordersPanel);
  const resp=q('.ky-menu-card[data-target="panelResponsive"] .ky-menu-title');if(resp&&resp.textContent!=='Cihaz Görünürlüğü')resp.textContent='Cihaz Görünürlüğü';
  const respHead=q('#panelResponsive .ky-subpanel-title');if(respHead&&respHead.textContent!=='Cihaz Görünürlüğü')respHead.textContent='Cihaz Görünürlüğü';
}
function simplifyResponsive(){
  const panel=q('#panelResponsive');if(!panel)return;
  qa('.ky-field',panel).forEach(field=>{const txt=(field.textContent||'').toLowerCase();if(txt.includes('mobil rozet ölçeği')||txt.includes('mobil font farkı'))field.style.display='none';});
}
function addAnimationOptions(){
  const entry=q('#v3Entry');if(entry&&!q('option[value="slide-right"]',entry)){const o=document.createElement('option');o.value='slide-right';o.textContent='Soldan Gel';entry.insertBefore(o,entry.querySelector('option[value="pop"]'));}
  const hover=q('#v3Hover');if(hover&&!q('option[value="slide-left"]',hover))for(const [v,t] of [['slide-left','Sola Kaydır'],['slide-right','Sağa Kaydır']]){const o=document.createElement('option');o.value=v;o.textContent=t;hover.appendChild(o);}
}
function enforceTemplateCapabilities(persist=true){
  if(!ready)return;
  const id=activeTemplate(),gradientOk=SIMPLE_GRADIENT_TEMPLATES.has(id),radiusOk=RADIUS_TEMPLATES.has(id),borderOk=BORDER_TEMPLATES.has(id);
  const grad=q('#v3Gradient'),gradFields=q('#v3GradientFields'),radius=q('#v3Radius'),border=q('#v3BorderWidth'),borderColor=q('#v3BorderColorPicker');
  if(grad){grad.disabled=!gradientOk;grad.closest('.ky-toggle-wrap')?.classList.toggle('ky-control-disabled',!gradientOk);}
  gradFields?.classList.toggle('ky-control-disabled',!gradientOk);
  if(radius){radius.disabled=!radiusOk;radius.closest('.ky-field')?.classList.toggle('ky-control-disabled',!radiusOk);}
  if(border){border.disabled=!borderOk;border.closest('.ky-field')?.classList.toggle('ky-control-disabled',!borderOk);}
  borderColor?.closest('.ky-field')?.classList.toggle('ky-control-disabled',!borderOk);
  let note=q('#kyTemplateCapabilityNote');const host=q('#panelColors .ky-group');
  if(host&&!note){note=document.createElement('div');note.id='kyTemplateCapabilityNote';note.className='ky-capability-note';host.prepend(note);}
  if(note)note.textContent=gradientOk?'Gradyan bu şablonda kullanılabilir. Özel biçimli şablonlarda tasarımın kendi renk yapısı korunur.':'Bu özel biçimli şablonda gradyan kapalıdır; şablonun kendi renk yapısı korunur.';
  if(!gradientOk&&getPath(deviceSettings[activeDevice],'styling.gradientEnabled',false)){
    setPath(deviceSettings[activeDevice],'styling.gradientEnabled',false);if(grad)grad.checked=false;cfgWrite('styling.gradientEnabled',false);if(persist)schedulePersist(80);
  }
}

function enhanceCategories(){
  const host=q('#v3Categories');if(!host)return;
  qa('.ky-category-card',host).forEach((card,i)=>{
    if(card.dataset.kyCollapsible)return;card.dataset.kyCollapsible='1';
    const head=q('.ky-category-head',card);if(!head)return;
    const rows=qa(':scope > .ky-rank-row',card);const body=document.createElement('div');body.className='ky-category-body';rows.forEach(r=>body.appendChild(r));card.appendChild(body);
    const arrow=document.createElement('span');arrow.className='ky-category-arrow';arrow.textContent='⌄';head.appendChild(arrow);
    card.classList.toggle('open',i===0);head.setAttribute('role','button');head.tabIndex=0;
    const toggle=()=>card.classList.toggle('open');head.addEventListener('click',toggle);head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
  });
}
function observeCategories(){
  categoryObserver?.disconnect();const host=q('#v3Categories');if(!host)return;
  categoryObserver=new MutationObserver(()=>{clearTimeout(categoryTimer);categoryTimer=setTimeout(enhanceCategories,60);});
  categoryObserver.observe(host,{childList:true});
}

function bind(){
  document.addEventListener('click',e=>{
    const dev=e.target.closest('[data-edit-device]');if(dev){e.preventDefault();switchDevice(dev.dataset.editDevice);return;}
    const top=e.target.closest('.ky-device-btn[data-device]');if(top)setTimeout(()=>switchDevice(top.dataset.device),0);
    const tpl=e.target.closest('[data-template]');if(tpl)setTimeout(()=>captureTemplateClick(tpl),0);
    const icon=e.target.closest('[data-icon]');if(icon)setTimeout(()=>captureIconClick(icon),0);
    const pos=e.target.closest('[data-pos]');if(pos)setTimeout(()=>capturePosition(pos),0);
    if(e.target.closest('#v3IconMono'))setTimeout(()=>captureIconMode('mono'),0);
    if(e.target.closest('#v3IconColor'))setTimeout(()=>captureIconMode('color'),0);
  },false);
  document.addEventListener('input',e=>{const id=e.target?.id||'';if(PATHS[id.replace(/(Picker|Hex)$/,'')]||/^tpl(Bg|Text|Accent)(Picker|Hex)$/.test(id)||/^v3IconC[12](Picker|Hex)$/.test(id)){mirrorControl(e.target,false);captureTemplateColor(e.target,false);}},false);
  document.addEventListener('change',e=>{const id=e.target?.id||'';if(PATHS[id.replace(/(Picker|Hex)$/,'')]||/^tpl(Bg|Text|Accent)(Picker|Hex)$/.test(id)||/^v3IconC[12](Picker|Hex)$/.test(id)){mirrorControl(e.target,true);captureTemplateColor(e.target,true);}},false);
}

function refreshStaticUi(){injectStaticStyle();reorderMenu();injectDeviceTabs();simplifyResponsive();addAnimationOptions();enforceTemplateCapabilities(false);enhanceCategories();syncDeviceTabs();}
async function start(){
  bind();await new Promise(r=>setTimeout(r,650));await loadConfig();ready=true;
  activeDevice=q('.ky-device-btn.active[data-device]')?.dataset.device||'desktop';
  refreshStaticUi();applyProfile(activeDevice);observeCategories();
  setTimeout(()=>{refreshStaticUi();observeCategories();},500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
