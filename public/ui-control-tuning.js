/* Kategori Yildizi — focused UI control tuning. */
(function(){
'use strict';
if(window.__KY_UI_CONTROL_TUNING__)return;
window.__KY_UI_CONTROL_TUNING__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];

function setLabelText(inputId,text){
 const input=q('#'+inputId);if(!input)return;
 const label=input.closest('.ky-field')?.querySelector('.ky-label');if(!label)return;
 const value=label.querySelector('.value');
 label.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE)node.remove()});
 label.insertBefore(document.createTextNode(text+' '),value||label.firstChild);
}

function moveTemplateSize(){
 const scale=q('#v3Scale');const panel=q('#panelTemplates');if(!scale||!panel)return;
 const field=scale.closest('.ky-field');if(!field)return;
 setLabelText('v3Scale','Şablon Boyutu');
 let group=q('#kyTemplateSizeGroup');
 if(!group){
  group=document.createElement('div');group.id='kyTemplateSizeGroup';group.className='ky-group';
  const title=document.createElement('div');title.className='ky-group-title';title.textContent='Şablon boyutu';group.appendChild(title);
  panel.appendChild(group);
 }
 if(field.parentElement!==group)group.appendChild(field);
 const sizingSubtitle=q('.ky-menu-card[data-target="panelSizing"] .ky-menu-subtitle');
 if(sizingSubtitle)sizingSubtitle.textContent='Yatay ve dikey iç boşluklar';
 const templateSubtitle=q('.ky-menu-card[data-target="panelTemplates"] .ky-menu-subtitle');
 if(templateSubtitle)templateSubtitle.textContent='Şablon, renk ve boyut ayarları';
 setLabelText('v3MobileScale','Mobil Şablon Boyutu');
 const responsiveSubtitle=q('.ky-menu-card[data-target="panelResponsive"] .ky-menu-subtitle');
 if(responsiveSubtitle)responsiveSubtitle.textContent='Cihaz bazlı görünürlük ve şablon boyutu';
}

function tuneAnimationDuration(){
 const el=q('#v3Duration');if(!el)return;
 el.min='500';el.max='2000';el.step='50';
 const n=Number(el.value||500);
 if(n<500){el.value='500';el.dispatchEvent(new Event('input',{bubbles:true}));}
 else if(n>2000){el.value='2000';el.dispatchEvent(new Event('input',{bubbles:true}));}
 const val=q('#v3DurationVal');if(val)val.textContent=el.value+' ms';
}

function measureNaturalBadgeWidth(badge){
 const clone=badge.cloneNode(true);
 clone.style.cssText += ';position:fixed!important;left:-10000px!important;top:-10000px!important;visibility:hidden!important;width:max-content!important;max-width:none!important;min-width:0!important;padding-left:0!important;padding-right:0!important;transform:none!important;scale:1!important;animation:none!important;transition:none!important;';
 document.body.appendChild(clone);
 const width=Math.ceil(clone.getBoundingClientRect().width);
 clone.remove();
 return width;
}

function updatePadXMax(){
 const slider=q('#v3PadX');if(!slider)return;
 const wrap=q('#stageCanvas .ky-mock-img-wrap');
 const badge=wrap?.querySelector('.ky-v3-badge');
 if(!wrap||!badge)return;
 if([...badge.classList].some(cls=>cls.startsWith('tpl-premium-')))return;
 const scaleRaw=parseFloat(getComputedStyle(badge).getPropertyValue('--badge-scale'));
 const scale=Number.isFinite(scaleRaw)&&scaleRaw>0?scaleRaw:1;
 const available=Math.max(0,wrap.clientWidth-4);
 const natural=measureNaturalBadgeWidth(badge);
 const max=Math.max(0,Math.floor(((available/scale)-natural)/2));
 slider.max=String(max);
 const current=Number(slider.value||0);
 if(current>max){
  slider.value=String(max);
  slider.dispatchEvent(new Event('input',{bubbles:true}));
 }
 const val=q('#v3PadXVal');if(val)val.textContent=slider.value+' px';
}

function tune(){
 moveTemplateSize();
 tuneAnimationDuration();
 updatePadXMax();
}

function boot(){
 tune();
 [150,450,900,1600].forEach(ms=>setTimeout(tune,ms));
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-template],.ky-template-card-v3,.ky-device-btn,.ky-view-tab,.ky-menu-card,[data-edit-device],[data-edit-surface]'))requestAnimationFrame(updatePadXMax);
 },true);
 document.addEventListener('input',e=>{
  if(e.target?.id==='v3Scale'||e.target?.id==='v3PadX'||e.target?.id==='v3FontSize'||e.target?.id==='v3IconSize')requestAnimationFrame(updatePadXMax);
 },true);
 window.addEventListener('resize',()=>requestAnimationFrame(updatePadXMax),{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
