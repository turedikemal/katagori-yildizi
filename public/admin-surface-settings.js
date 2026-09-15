(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const clone=v=>JSON.parse(JSON.stringify(v??{}));
const shop=(new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\\.myikas\\.com$/i,'');
const API=location.origin;
const PANELS=['panelTemplates','panelTexts','panelTypography','panelIcons','panelColors','panelBorders','panelSizing','panelPosition','panelAnimation','panelResponsive','panelPlacement'];
const PATHS={
 v3ProductText:'texts.productText',v3PdpPrefix:'texts.pdpPrefixText',v3PdpBadge:'texts.pdpBadgeText',
 v3ThemeFont:'styling.useStoreThemeFont',v3Font:'styling.fontFamily',v3FontSize:'styling.fontSize',v3FontWeight:'styling.fontWeight',
 v3IconEnabled:'icon.enabled',v3IconSize:'icon.size',v3Bg:'styling.bgColor',v3TextColor:'styling.textColor',v3Accent:'styling.accentColor',
 v3Gradient:'styling.gradientEnabled',v3Grad1:'styling.gradientColor1',v3Grad2:'styling.gradientColor2',v3GradAngle:'styling.gradientAngle',
 v3BorderColor:'styling.borderColor',v3Radius:'styling.borderRadius',v3BorderWidth:'styling.borderWidth',v3Shadow:'styling.shadow',v3Opacity:'styling.opacity',
 v3PadX:'styling.paddingX',v3PadY:'styling.paddingY',v3Scale:'styling.scale',v3CardLocation:'placements.cardLocation',v3OffsetX:'placements.offsetX',v3OffsetY:'placements.offsetY',
 v3Entry:'animation.entry',v3Hover:'animation.hover',v3Duration:'animation.durationMs',v3Home:'placements.homeCards',v3Category:'placements.categoryCards',v3Search:'placements.searchResults',v3Pdp:'placements.productDetail'
};
let activeSurface='category',activeDevice='desktop',ready=false,internal=false,saveTimer=0;
const profiles={category:{desktop:null,mobile:null},product:{desktop:null,mobile:null}};
function getPath(o,p,f){try{return p.split('.').reduce((a,k)=>a?.[k],o)??f}catch{return f}}
function setPath(o,p,v){const a=p.split('.');let t=o;for(const k of a.slice(0,-1))t=t[k]||(t[k]={});t[a.at(-1)]=v}
function cast(el){if(el.type==='checkbox')return !!el.checked;if(el.type==='range'||el.type==='number'||el.id==='v3FontWeight')return Number(el.value);return el.value}
function cfg(path,val){if(typeof window.handleInput==='function')window.handleInput(path,val)}
function baseSnapshot(raw){return {templateId:raw.templateId||'navy-pill',templateColors:clone(raw.templateColors||{}),texts:clone(raw.texts||{}),styling:clone(raw.styling||{}),icon:clone(raw.icon||{}),placements:clone(raw.placements||{}),animation:clone(raw.animation||{})}}
function mobileFrom(base,raw){const m=clone(base),r=raw.responsive||{};m.styling=m.styling||{};m.styling.fontSize=Math.max(7,Number(m.styling.fontSize||12)+Number(r.mobileFontSizeOffset||0));m.styling.scale=Math.round(Number(m.styling.scale||100)*Number(r.mobileBadgeScale||100)/100);m.styling.paddingX=Number(r.mobilePaddingX??m.styling.paddingX??10);m.styling.paddingY=Number(r.mobilePaddingY??m.styling.paddingY??5);return m}
async function load(){
 try{const r=await fetch(`${API}/api/admin/settings?shop=${encodeURIComponent(shop)}&surfaceEditor=1`,{cache:'no-store'}),d=await r.json(),raw=d.draftConfig||{},base=baseSnapshot(raw),desktop=clone(raw.deviceSettings?.desktop||base),mobile=clone(raw.deviceSettings?.mobile||mobileFrom(base,raw));
  for(const s of ['category','product']){profiles[s].desktop=clone(raw.pageSettings?.[s]?.desktop||desktop);profiles[s].mobile=clone(raw.pageSettings?.[s]?.mobile||mobile)}
 }catch{const b=controlSnapshot();for(const s of ['category','product']){profiles[s].desktop=clone(b);profiles[s].mobile=clone(b)}}
}
function activeIconType(fallback='award'){return q('#v3Icons [data-icon].active')?.dataset.icon||fallback}
function colorValue(id,fallback){const el=q('#'+id+'Picker')||q('#'+id+'Hex');return el&&/^#[0-9a-f]{6}$/i.test(el.value)?el.value:fallback}
function controlSnapshot(){
 const current=clone(profiles[activeSurface]?.[activeDevice]||{templateColors:{},texts:{},styling:{},icon:{},placements:{},animation:{}});
 current.templateId=q('[data-template].active')?.dataset.template||current.templateId||'navy-pill';
 for(const [id,path] of Object.entries(PATHS)){const el=q('#'+id);if(el)setPath(current,path,cast(el))}
 current.icon=current.icon||{};
 const type=activeIconType(current.icon.type||'award');current.icon.type=type;current.icon.enabled=type!=='none'&&(q('#v3IconEnabled')?.checked!==false);
 current.icon.mode=q('#v3IconColor')?.classList.contains('active')?'color':'mono';
 current.icon.color=colorValue('v3IconC1',current.icon.color||'#ffffff');current.icon.accentColor=colorValue('v3IconC2',current.icon.accentColor||'#ffd166');
 const tid=current.templateId;current.templateColors=current.templateColors||{};const tc={...(current.templateColors[tid]||{})};
 for(const [id,key] of [['tplBg','bg'],['tplText','text'],['tplAccent','accent']]){const el=q('#'+id+'Picker')||q('#'+id+'Hex');if(el&&/^#[0-9a-f]{6}$/i.test(el.value))tc[key]=el.value}
 if(Object.keys(tc).length)current.templateColors[tid]=tc;
 return current;
}
function persist(delay=120){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{if(!ready||internal)return;const p=controlSnapshot();profiles[activeSurface][activeDevice]=clone(p);cfg(`pageSettings.${activeSurface}.${activeDevice}`,clone(p));cfg(`deviceSettings.${activeDevice}`,clone(p))},delay)}
function setControl(el,val){if(!el||val===undefined)return;if(el.type==='checkbox')el.checked=!!val;else el.value=val}
function syncControls(p){if(!p)return;internal=true;try{
 for(const [id,path] of Object.entries(PATHS))setControl(q('#'+id),getPath(p,path,undefined));
 for(const [id,path] of [['v3Bg','styling.bgColor'],['v3TextColor','styling.textColor'],['v3Accent','styling.accentColor'],['v3Grad1','styling.gradientColor1'],['v3Grad2','styling.gradientColor2'],['v3BorderColor','styling.borderColor'],['v3IconC1','icon.color'],['v3IconC2','icon.accentColor']]){const v=getPath(p,path,undefined);if(v!==undefined){setControl(q('#'+id+'Picker'),v);setControl(q('#'+id+'Hex'),v)}}
 const tid=p.templateId||'navy-pill';qa('[data-template]').forEach(b=>b.classList.toggle('active',b.dataset.template===tid));const tc=p.templateColors?.[tid]||{};for(const [id,key] of [['tplBg','bg'],['tplText','text'],['tplAccent','accent']])if(tc[key]){setControl(q('#'+id+'Picker'),tc[key]);setControl(q('#'+id+'Hex'),tc[key])}
 const card=q(`[data-template=\"${CSS.escape(tid)}\"]`),name=q('.name',card)?.textContent,title=q('#v3TemplateEditor .ky-template-editor-title strong');if(title&&name)title.textContent=name+' renkleri';
 const iconType=String(p.icon?.type||'award');qa('#v3Icons [data-icon]').forEach(b=>b.classList.toggle('active',b.dataset.icon===iconType));q('#v3IconMono')?.classList.toggle('active',p.icon?.mode!=='color');q('#v3IconColor')?.classList.toggle('active',p.icon?.mode==='color');
 qa('[data-pos]').forEach(b=>b.classList.toggle('active',b.dataset.pos===String(p.placements?.ninePointPosition||'')));
 const labels=[['v3FontSizeVal','styling.fontSize',' px'],['v3IconSizeVal','icon.size',' px'],['v3GradAngleVal','styling.gradientAngle','°'],['v3RadiusVal','styling.borderRadius',' px'],['v3BorderWidthVal','styling.borderWidth',' px'],['v3OpacityVal','styling.opacity','%'],['v3PadXVal','styling.paddingX',' px'],['v3PadYVal','styling.paddingY',' px'],['v3ScaleVal','styling.scale','%'],['v3OffsetXVal','placements.offsetX',' px'],['v3OffsetYVal','placements.offsetY',' px'],['v3DurationVal','animation.durationMs',' ms']];for(const [id,path,suf] of labels){const v=getPath(p,path,undefined),el=q('#'+id);if(el&&v!==undefined)el.textContent=v+suf}
 }finally{internal=false}}
function applyProfile(surface=activeSurface,device=activeDevice){const p=profiles[surface]?.[device];if(!p||internal)return;internal=true;activeSurface=surface;activeDevice=device;try{cfg('templateColors',clone(p.templateColors||{}));if(p.templateId)cfg('templateId',p.templateId);for(const sec of ['texts','styling','icon','placements','animation'])if(p[sec])cfg(sec,clone(p[sec]));cfg(`deviceSettings.${device}`,clone(p))}finally{internal=false}syncControls(p);requestAnimationFrame(()=>{syncTabs();syncPreview();filterSurfaceFields()})}
function syncPreview(){const dev=q(`.ky-device-btn[data-device=\"${activeDevice}\"]`);if(dev&&!dev.classList.contains('active'))dev.click();const view=activeSurface==='product'?'pdp':'category',tab=q(`.ky-view-tab[data-view=\"${view}\"]`);if(tab&&!tab.classList.contains('active'))tab.click()}
function syncTabs(){qa('.ky-surface-editor-tabs').forEach(w=>qa('button',w).forEach(b=>b.classList.toggle('active',b.dataset.editSurface===activeSurface)));qa('.ky-device-editor-tabs').forEach(w=>qa('button',w).forEach(b=>b.classList.toggle('active',b.dataset.editDevice===activeDevice)))}
function injectTabs(){for(const id of PANELS){const panel=q('#'+id);if(!panel)continue;let dev=q('.ky-device-editor-tabs',panel);if(!dev){dev=document.createElement('div');dev.className='ky-device-editor-tabs';dev.innerHTML='<button type=\"button\" data-edit-device=\"desktop\">Masaüstü</button><button type=\"button\" data-edit-device=\"mobile\">Mobil</button>';const head=q('.ky-subpanel-header',panel);if(head?.nextSibling)panel.insertBefore(dev,head.nextSibling);else panel.prepend(dev)}if(!q('.ky-surface-editor-tabs',panel)){const tabs=document.createElement('div');tabs.className='ky-surface-editor-tabs';tabs.innerHTML='<button type=\"button\" data-edit-surface=\"category\">Kategori sayfası</button><button type=\"button\" data-edit-surface=\"product\">Ürün sayfası</button>';dev.insertAdjacentElement('afterend',tabs);const note=document.createElement('div');note.className='ky-surface-context-note';tabs.insertAdjacentElement('afterend',note)}}syncTabs();filterSurfaceFields()}
function closestField(id){const el=q('#'+id);return el?.closest('.ky-field,.ky-toggle-wrap,.ky-group-row,.ky-card,.ky-control-row')||el?.parentElement||null}
function filterSurfaceFields(){const isProduct=activeSurface==='product';for(const id of ['v3ProductText']){const f=closestField(id);if(f)f.style.display=isProduct?'none':''}for(const id of ['v3PdpPrefix','v3PdpBadge']){const f=closestField(id);if(f)f.style.display=isProduct?'':'none'}for(const id of ['v3Home','v3Category','v3Search']){const f=closestField(id);if(f)f.style.display=isProduct?'none':''}const pdp=closestField('v3Pdp');if(pdp)pdp.style.display=isProduct?'':'none';qa('.ky-surface-context-note').forEach(n=>n.textContent=isProduct?'Bu bölümdeki ayarlar yalnızca Ürün sayfası için uygulanır.':'Bu bölümdeki ayarlar yalnızca Kategori sayfası için uygulanır.')}
function style(){if(q('#kySurfaceSettingsStyle'))return;const s=document.createElement('style');s.id='kySurfaceSettingsStyle';s.textContent=`.ky-surface-editor-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:7px 0 6px;padding:3px;border:1px solid rgba(36,58,139,.10);border-radius:10px;background:#f5f7fc}.ky-surface-editor-tabs button{min-height:32px;border:0;border-radius:7px;background:transparent;color:#7b86a8;font-size:9.5px;font-weight:800;cursor:pointer}.ky-surface-editor-tabs button.active{background:#243a8b;color:#fff;box-shadow:0 2px 7px rgba(36,58,139,.18)}.ky-surface-context-note{margin:0 0 8px;padding:6px 8px;border-radius:7px;background:#eef2ff;color:#66739d;font-size:8.5px;line-height:1.35}.ky-device-editor-tabs+.ky-surface-editor-tabs{margin-top:6px}`;document.head.appendChild(s)}
function onSurface(surface){if(surface===activeSurface){syncTabs();syncPreview();return}profiles[activeSurface][activeDevice]=controlSnapshot();activeSurface=surface;applyProfile(activeSurface,activeDevice)}
function onDevice(device){if(device===activeDevice){syncTabs();syncPreview();return}profiles[activeSurface][activeDevice]=controlSnapshot();activeDevice=device;setTimeout(()=>applyProfile(activeSurface,activeDevice),35)}
function captureIcon(choice){if(!ready||!choice)return;const id=choice.dataset.icon;if(!id)return;const p=profiles[activeSurface][activeDevice]||(profiles[activeSurface][activeDevice]=controlSnapshot());p.icon=p.icon||{};p.icon.type=id;p.icon.enabled=id!=='none';cfg('icon.type',id);cfg('icon.enabled',id!=='none');persist(30);setTimeout(()=>window.renderPreview?.(),60)}
function bind(){document.addEventListener('click',e=>{
 const s=e.target.closest('[data-edit-surface]');if(s){e.preventDefault();e.stopPropagation();onSurface(s.dataset.editSurface);return}
 const d=e.target.closest('[data-edit-device]');if(d){setTimeout(()=>onDevice(d.dataset.editDevice),45);return}
 const topD=e.target.closest('.ky-device-btn[data-device]');if(topD){activeDevice=topD.dataset.device;setTimeout(()=>applyProfile(activeSurface,activeDevice),30);return}
 const topV=e.target.closest('.ky-view-tab[data-view]');if(topV){const surf=topV.dataset.view==='pdp'?'product':'category';if(surf!==activeSurface){profiles[activeSurface][activeDevice]=controlSnapshot();activeSurface=surf;setTimeout(()=>applyProfile(activeSurface,activeDevice),30)}return}
 const icon=e.target.closest('#v3Icons [data-icon]');if(icon){captureIcon(icon);return}
 if(e.target.closest('[data-template],[data-pos],#v3IconMono,#v3IconColor'))persist(60)
 },true);
 document.addEventListener('input',e=>{const id=e.target?.id||'';if(PATHS[id.replace(/(Picker|Hex)$/,'')]||/^tpl(Bg|Text|Accent)(Picker|Hex)$/.test(id)||/^v3IconC[12](Picker|Hex)$/.test(id))persist(120)},true);
 document.addEventListener('change',e=>{const id=e.target?.id||'';if(PATHS[id.replace(/(Picker|Hex)$/,'')]||/^tpl(Bg|Text|Accent)(Picker|Hex)$/.test(id)||/^v3IconC[12](Picker|Hex)$/.test(id))persist(30)},true)
}
async function start(){style();bind();await new Promise(r=>setTimeout(r,900));await load();activeDevice=q('.ky-device-btn.active[data-device]')?.dataset.device||'desktop';activeSurface=q('.ky-view-tab.active')?.dataset.view==='pdp'?'product':'category';ready=true;injectTabs();applyProfile(activeSurface,activeDevice);for(const ms of [400,1000,2200])setTimeout(injectTabs,ms)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
