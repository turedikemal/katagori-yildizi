(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const HEX=/^#[0-9a-f]{6}$/i;
let scheduled=false;

function activeTemplateId(){
  return q('.ky-template-card-v3.active[data-template]')?.dataset.template || q('[data-template].active')?.dataset.template || '';
}
function readColor(name,fallback){
  const hex=q(`#tpl${name}Hex`)?.value;
  const picker=q(`#tpl${name}Picker`)?.value;
  const value=HEX.test(String(hex||''))?hex:(HEX.test(String(picker||''))?picker:fallback);
  return value;
}
function currentColors(){
  const id=activeTemplateId();
  if(!id)return null;
  return {
    id,
    bg:readColor('Bg','#243a8b'),
    text:readColor('Text','#ffffff'),
    accent:readColor('Accent','#ce3f44')
  };
}
function apply(el,c){
  if(!el||!c)return;
  el.style.setProperty('--badge-bg',c.bg);
  el.style.setProperty('--badge-text',c.text);
  el.style.setProperty('--badge-accent',c.accent);
  el.style.setProperty('--grad-a',c.bg);
  el.style.setProperty('--grad-b',c.accent);
  el.style.setProperty('--ky-primary-bg',c.bg);
  el.style.setProperty('--ky-primary-text',c.text);
  el.style.setProperty('--ky-accent',c.accent);
  el.style.color=c.text;
}
function sync(){
  scheduled=false;
  const c=currentColors();
  if(!c)return;
  const selectors=[`.ky-v3-badge.tpl-${CSS.escape(c.id)}`,`.ky-badge-root.ky-tpl-${CSS.escape(c.id)}`];
  qa(selectors.join(',')).forEach(el=>apply(el,c));
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(sync);
}
function observe(){
  const canvas=q('#stageCanvas');
  const templates=q('#v3Templates');
  const opts={childList:true,subtree:true};
  const mo=new MutationObserver(schedule);
  if(canvas)mo.observe(canvas,opts);
  if(templates)mo.observe(templates,opts);
}

document.addEventListener('input',e=>{
  if(e.target.closest('#v3TemplateEditor,#panelTemplates'))schedule();
},true);
document.addEventListener('change',e=>{
  if(e.target.closest('#v3TemplateEditor,#panelTemplates'))schedule();
},true);
document.addEventListener('click',e=>{
  if(e.target.closest('[data-template],.ky-device-btn,[data-edit-device],.ky-view-tab'))setTimeout(schedule,20);
},true);

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{observe();setTimeout(schedule,80);},{once:true});
}else{
  observe();setTimeout(schedule,80);
}
setTimeout(schedule,500);
})();
