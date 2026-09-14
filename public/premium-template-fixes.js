/* Kategori Yildizi — premium template interaction fixes v2
   Color editing remains functional; shared glow/shine chrome is intentionally removed.
   Every premium template gets its own motion from premium-templates-v3.css + premium-intensity.css. */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const HEX=/^#[0-9a-f]{6}$/i;

function activePremiumId(){
 const card=q('#v3Templates .ky-template-card-v3.active[data-template^="premium-"]');
 if(card?.dataset.template)return card.dataset.template;
 const badge=q('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]');
 if(badge){const cls=[...badge.classList].find(x=>x.startsWith('tpl-premium-'));if(cls)return cls.slice(4)}
 return '';
}
function setVars(id,field,value){
 const badgeProp=field==='bg'?'--badge-bg':field==='text'?'--badge-text':'--badge-accent';
 const premiumProp=field==='bg'?'--p-bg':field==='text'?'--p-text':'--p-accent';
 qa(`.ky-v3-badge.tpl-${CSS.escape(id)},.ky-badge-root.ky-tpl-${CSS.escape(id)}`).forEach(el=>{
  el.style.setProperty(badgeProp,value);
  el.style.setProperty(premiumProp,value);
  if(field==='text'){
   el.style.setProperty('color',value,'important');
   qa('.ky-badge-text',el).forEach(t=>t.style.setProperty('color',value,'important'));
  }
 });
 const card=q(`#v3Templates [data-template="${CSS.escape(id)}"] .ky-v3-badge`);
 if(card){card.style.setProperty(badgeProp,value);card.style.setProperty(premiumProp,value);if(field==='text')card.style.setProperty('color',value,'important')}
}
function syncPair(cap,value){const p=q(`#tpl${cap}Picker`),h=q(`#tpl${cap}Hex`);if(p&&p.value!==value)p.value=value;if(h&&h.value!==value)h.value=value}
function readPair(cap,fallback){const h=q(`#tpl${cap}Hex`)?.value,p=q(`#tpl${cap}Picker`)?.value;return HEX.test(String(h||''))?h:(HEX.test(String(p||''))?p:fallback)}
function commit(target){
 const id=activePremiumId();if(!id)return false;
 const m=/^tpl(Bg|Text|Accent)(Picker|Hex)$/.exec(target.id||'');if(!m)return false;
 const cap=m[1],field=cap==='Bg'?'bg':cap==='Text'?'text':'accent';
 const value=String(target.value||'').trim();if(!HEX.test(value))return true;
 syncPair(cap,value);setVars(id,field,value);
 const colors={
  bg:field==='bg'?value:readPair('Bg','#243a8b'),
  text:field==='text'?value:readPair('Text','#ffffff'),
  accent:field==='accent'?value:readPair('Accent','#ce3f44')
 };
 if(typeof window.__KY_QUEUE_CONFIG_WRITE__==='function')window.__KY_QUEUE_CONFIG_WRITE__(`templateColors.${id}`,colors);
 else window.handleInput?.(`templateColors.${id}`,colors);
 requestAnimationFrame(()=>{setVars(id,'bg',colors.bg);setVars(id,'text',colors.text);setVars(id,'accent',colors.accent)});
 return true;
}
function style(){
 if(q('#kyPremiumTemplateFixCss'))return;
 const s=document.createElement('style');s.id='kyPremiumTemplateFixCss';s.textContent=`
 .ky-premium-tabs button{font-size:9.5px!important;line-height:1.1!important;min-height:32px!important;font-weight:800!important;padding:5px 7px!important}
 .ky-premium-tabs button.premium{font-size:9.5px!important}
 .ky-premium-template-v3 .preview{position:relative;overflow:hidden!important}
 .ky-premium-template-v3 .preview::after{content:none!important;display:none!important;animation:none!important}
 `;document.head.appendChild(s);
}
function loadGuard(){
 if(document.querySelector('script[data-ky-premium-preview-guard]'))return;
 const s=document.createElement('script');s.src='/premium-preview-guard.js?v=20260914-1';s.async=false;s.dataset.kyPremiumPreviewGuard='1';document.body.appendChild(s);
}
document.addEventListener('input',e=>{if(commit(e.target)){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener('change',e=>{if(commit(e.target)){e.stopImmediatePropagation();e.preventDefault()}},true);
function start(){style();loadGuard()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
