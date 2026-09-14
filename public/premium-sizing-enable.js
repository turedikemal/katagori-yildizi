/* Kategori Yildizi — premium sizing controls.
   Premium templates use the same padding/scale controls as standard templates
   without re-rendering the live preview. */
(function(){
'use strict';
if(window.__KY_PREMIUM_SIZING_ENABLE__)return;
window.__KY_PREMIUM_SIZING_ENABLE__=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const PREMIUM=new Set(['premium-aurora','premium-prism','premium-nebula','premium-liquid','premium-photon','premium-hologram','premium-comet','premium-spectrum','premium-quantum','premium-electric']);
const IDS=['v3PadX','v3PadY','v3Scale'];
let scheduled=false;

function currentTemplate(){
 const card=q('#v3Templates [data-template].active');
 if(card?.dataset.template)return card.dataset.template;
 const badge=q('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]');
 if(badge){const cls=[...badge.classList].find(c=>c.startsWith('tpl-premium-'));if(cls)return cls.slice(4)}
 return '';
}
function isPremium(){return PREMIUM.has(currentTemplate())}
function num(id,fallback){const n=Number(q('#'+id)?.value);return Number.isFinite(n)?n:fallback}

function enableControls(){
 if(!isPremium())return;
 for(const id of IDS){
  const el=q('#'+id);if(!el)continue;
  el.disabled=false;
  el.removeAttribute('disabled');
  el.closest('.ky-field,.ky-toggle-wrap,.ky-group-row')?.classList.remove('ky-v4-disabled');
 }
 q('#kyV4SizingNote')?.remove();
 qa('#panelSizing .ky-v4-note,#panelSizing .ky-final-note').forEach(el=>{
  if(/yalnızca normal şablon|premium şablonlarda oran ve boşluk/i.test(el.textContent||''))el.remove();
 });
}

function applySizing(){
 scheduled=false;
 if(!isPremium())return;
 enableControls();
 const px=num('v3PadX',10),py=num('v3PadY',5),scale=Math.max(.2,num('v3Scale',100)/100);
 qa('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]').forEach(b=>{
  b.style.setProperty('--badge-px',px+'px');
  b.style.setProperty('--badge-py',py+'px');
  b.style.setProperty('--badge-scale',String(scale));
  b.style.setProperty('padding',`${py}px ${px}px`,'important');
  b.style.setProperty('scale',String(scale),'important');
  b.style.setProperty('transform-origin','center','important');
  b.style.setProperty('box-sizing','border-box','important');
 });
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(applySizing)}

function injectStyle(){
 if(q('#kyPremiumSizingEnableCss'))return;
 const s=document.createElement('style');s.id='kyPremiumSizingEnableCss';s.textContent=`
 #stageCanvas .ky-v3-badge[class*="tpl-premium-"]{
   padding:var(--badge-py,5px) var(--badge-px,10px)!important;
   scale:var(--badge-scale,1)!important;
   transform-origin:center!important;
   box-sizing:border-box!important;
 }
 `;document.head.appendChild(s);
}

function bind(){
 document.addEventListener('input',e=>{if(IDS.includes(e.target?.id)){enableControls();schedule()}},true);
 document.addEventListener('change',e=>{if(IDS.includes(e.target?.id)){enableControls();schedule()}},true);
 document.addEventListener('click',e=>{
  if(e.target.closest('#v3Templates [data-template],.ky-device-btn,[data-edit-device],.ky-view-tab,[data-edit-surface]')){
   requestAnimationFrame(()=>{enableControls();schedule()});
   setTimeout(()=>{enableControls();schedule()},80);
  }
 },true);
 const panel=q('#panelSizing');
 if(panel){new MutationObserver(()=>{if(isPremium())enableControls()}).observe(panel,{subtree:true,attributes:true,attributeFilter:['disabled','class']})}
 const stage=q('#stageCanvas');
 if(stage){new MutationObserver(records=>{if(isPremium()&&records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule()}).observe(stage,{childList:true,subtree:true})}
}
function start(){injectStyle();bind();enableControls();schedule();for(const ms of [150,450,900,1600])setTimeout(()=>{enableControls();schedule()},ms)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
