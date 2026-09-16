(function(){
'use strict';

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const HEX=/^#[0-9a-f]{6}$/i;
const LIGHT_SURFACE_TEMPLATES=new Set(['gradient-pill','modern-outline','ticket-line']);
let scheduled=false;
let editorObserver=null;

function renderedTemplateId(){
  const badge=q('#stageCanvas .ky-v3-badge[class*="tpl-"]');
  if(!badge)return '';
  const cls=[...badge.classList].find(x=>x.startsWith('tpl-'));
  return cls?cls.slice(4):'';
}
function activeTemplateId(){
  return q('#v3TemplateEditor')?.dataset.kyTemplateId || renderedTemplateId() || q('.ky-template-card-v3.active[data-template]')?.dataset.template || q('[data-template].active')?.dataset.template || '';
}
function readColor(name,fallback){
  const hex=q(`#tpl${name}Hex`)?.value;
  const picker=q(`#tpl${name}Picker`)?.value;
  return HEX.test(String(hex||''))?hex:(HEX.test(String(picker||''))?picker:fallback);
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
function outlineTextColor(text,bg){
  const contrast=value=>{
    const m=/^#([0-9a-f]{6})$/i.exec(String(value||''));
    if(!m)return 0;
    const rgb=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));
    const luminance=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
    return 1.05/(luminance+.05);
  };
  return contrast(text)>=3?text:contrast(bg)>=3?bg:'#17213a';
}
function apply(el,c){
  if(!el||!c)return;
  const text=LIGHT_SURFACE_TEMPLATES.has(c.id)?outlineTextColor(c.text,c.bg):c.text;
  el.style.setProperty('--badge-bg',c.bg);
  el.style.setProperty('--badge-text',text);
  el.style.setProperty('--badge-accent',c.accent);
  el.style.setProperty('--grad-a',c.bg);
  el.style.setProperty('--grad-b',c.accent);
  el.style.setProperty('--ky-primary-bg',c.bg);
  el.style.setProperty('--ky-primary-text',text);
  el.style.setProperty('--ky-accent',c.accent);
  el.style.color=text;
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
function setPair(field,value){
  const cap=field==='bg'?'Bg':field==='text'?'Text':'Accent';
  const picker=q(`#tpl${cap}Picker`),hex=q(`#tpl${cap}Hex`);
  if(picker&&picker.value!==value)picker.value=value;
  if(hex&&hex.value!==value)hex.value=value;
}
function pushConfig(field,value){
  const id=activeTemplateId();
  if(!id||!HEX.test(String(value||'')))return;
  if(typeof window.handleInput==='function')window.handleInput(`templateColors.${id}.${field}`,value);
  schedule();
}
function patchField(field){
  const cap=field==='bg'?'Bg':field==='text'?'Text':'Accent';
  const picker=q(`#tpl${cap}Picker`),hex=q(`#tpl${cap}Hex`);
  if(!picker||!hex)return;

  const onPicker=()=>{
    const value=picker.value;
    if(!HEX.test(value))return;
    setPair(field,value);
    pushConfig(field,value);
  };
  const onHex=()=>{
    const value=hex.value.trim();
    if(!HEX.test(value))return;
    setPair(field,value);
    pushConfig(field,value);
  };

  picker.oninput=onPicker;
  picker.onchange=onPicker;
  hex.oninput=onHex;
  hex.onchange=onHex;
}
function patchEditor(){
  const editor=q('#v3TemplateEditor');
  if(!editor)return;
  const id=renderedTemplateId()||q('.ky-template-card-v3.active[data-template]')?.dataset.template||editor.dataset.kyTemplateId||'';
  if(id)editor.dataset.kyTemplateId=id;
  patchField('bg');
  patchField('text');
  patchField('accent');
}
function updateEditorState(){
  const id=renderedTemplateId();
  const editor=q('#v3TemplateEditor');
  if(!id||!editor)return;
  editor.dataset.kyTemplateId=id;
  qa('.ky-template-card-v3[data-template]').forEach(card=>card.classList.toggle('active',card.dataset.template===id));
  const name=q(`.ky-template-card-v3[data-template="${CSS.escape(id)}"] .name`)?.textContent?.trim();
  const title=q('#v3TemplateEditor .ky-template-editor-title strong');
  if(name&&title)title.textContent=`${name} renkleri`;
  patchEditor();
}
function colorFromRenderedBadge(prop,fallback){
  const id=renderedTemplateId();
  if(!id)return fallback;
  const badge=q(`#stageCanvas .ky-v3-badge.tpl-${CSS.escape(id)}`) || q(`#stageCanvas .ky-badge-root.ky-tpl-${CSS.escape(id)}`);
  if(!badge)return fallback;
  const inline=badge.style.getPropertyValue(prop).trim();
  if(HEX.test(inline))return inline;
  const computed=getComputedStyle(badge).getPropertyValue(prop).trim();
  return HEX.test(computed)?computed:fallback;
}
function syncEditorFromRenderedBadge(){
  const id=renderedTemplateId();
  const editor=q('#v3TemplateEditor');
  if(!id||!editor)return;

  editor.dataset.kyTemplateId=id;
  qa('.ky-template-card-v3[data-template]').forEach(card=>card.classList.toggle('active',card.dataset.template===id));
  const name=q(`.ky-template-card-v3[data-template="${CSS.escape(id)}"] .name`)?.textContent?.trim();
  const title=q('#v3TemplateEditor .ky-template-editor-title strong');
  if(name&&title)title.textContent=`${name} renkleri`;

  const bg=colorFromRenderedBadge('--badge-bg',readColor('Bg','#243a8b'));
  const text=colorFromRenderedBadge('--badge-text',readColor('Text','#ffffff'));
  const accent=colorFromRenderedBadge('--badge-accent',readColor('Accent','#ce3f44'));
  setPair('bg',bg);setPair('text',text);setPair('accent',accent);
  patchEditor();
  schedule();
}
function observe(){
  const canvas=q('#stageCanvas');
  const templates=q('#v3Templates');
  const editor=q('#v3TemplateEditor');
  const opts={childList:true,subtree:true};
  const mo=new MutationObserver(schedule);
  if(canvas)mo.observe(canvas,opts);
  if(templates)mo.observe(templates,opts);
  if(editor){
    editorObserver?.disconnect();
    editorObserver=new MutationObserver(()=>{patchEditor();setTimeout(syncEditorFromRenderedBadge,0);});
    editorObserver.observe(editor,opts);
  }
}

function loadPremiumExperience(){
  const loadUi=()=>{
    if(document.querySelector('script[data-ky-premium-experience]'))return;
    const s=document.createElement('script');
    s.src='/premium-experience-v2.js?v=20260914-1';
    s.dataset.kyPremiumExperience='1';
    document.body.appendChild(s);
  };
  if(document.querySelector('script[data-ky-badge-icon-system]')){loadUi();return;}
  const s=document.createElement('script');
  s.src='/badge-icon-system.js?v=20260914-1';
  s.dataset.kyBadgeIconSystem='1';
  s.onload=loadUi;
  document.body.appendChild(s);
}
function loadFinalFixes(){
  if(document.querySelector('script[data-ky-editor-final-fixes],script[src^="/editor-final-fixes.js"]'))return;
  const s=document.createElement('script');s.src='/editor-final-fixes.js?v=20260914-1';s.dataset.kyEditorFinalFixes='1';document.body.appendChild(s);
}

document.addEventListener('input',e=>{
  if(e.target.closest('#v3TemplateEditor,#panelTemplates'))schedule();
},true);
document.addEventListener('change',e=>{
  if(e.target.closest('#v3TemplateEditor,#panelTemplates'))schedule();
},true);
document.addEventListener('click',e=>{
  if(e.target.closest('[data-template]'))setTimeout(()=>{patchEditor();updateEditorState();},30);
  if(e.target.closest('.ky-device-btn,[data-edit-device],.ky-view-tab'))setTimeout(syncEditorFromRenderedBadge,120);
},true);

function boot(){
  observe();
  patchEditor();
  setTimeout(syncEditorFromRenderedBadge,90);
  setTimeout(syncEditorFromRenderedBadge,550);
  setTimeout(loadPremiumExperience,120);
  setTimeout(loadFinalFixes,180);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
