/* Kategori Yildizi — premium template interaction fixes */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const HEX=/^#[0-9a-f]{6}$/i;
function activePremiumId(){
 const card=q('#v3Templates .ky-template-card-v3.active[data-premium-v3="1"]');
 if(card?.dataset.template)return card.dataset.template;
 const editor=q('#v3TemplateEditor');
 if(editor?.dataset.kyTemplateId?.startsWith('premium-'))return editor.dataset.kyTemplateId;
 const badge=q('#stageCanvas .ky-v3-badge[class*="tpl-premium-"]');
 if(badge){const cls=[...badge.classList].find(x=>x.startsWith('tpl-premium-'));if(cls)return cls.slice(4)}
 return '';
}
function setVars(id,field,value){
 const prop=field==='bg'?'--badge-bg':field==='text'?'--badge-text':'--badge-accent';
 qa(`.ky-v3-badge.tpl-${CSS.escape(id)},.ky-badge-root.ky-tpl-${CSS.escape(id)}`).forEach(el=>{el.style.setProperty(prop,value);if(field==='text')el.style.setProperty('color',value)});
 const card=q(`#v3Templates [data-template="${CSS.escape(id)}"] .ky-v3-badge`);if(card){card.style.setProperty(prop,value);if(field==='text')card.style.setProperty('color',value)}
}
function syncPair(cap,value){const p=q(`#tpl${cap}Picker`),h=q(`#tpl${cap}Hex`);if(p&&p.value!==value)p.value=value;if(h&&h.value!==value)h.value=value}
function readPair(cap,fallback){const h=q(`#tpl${cap}Hex`)?.value,p=q(`#tpl${cap}Picker`)?.value;return HEX.test(String(h||''))?h:(HEX.test(String(p||''))?p:fallback)}
function commit(target){
 const id=activePremiumId();if(!id)return false;
 const m=/^tpl(Bg|Text|Accent)(Picker|Hex)$/.exec(target.id||'');if(!m)return false;
 const cap=m[1],field=cap==='Bg'?'bg':cap==='Text'?'text':'accent';
 const value=String(target.value||'').trim();if(!HEX.test(value))return true;
 const editor=q('#v3TemplateEditor');if(editor)editor.dataset.kyTemplateId=id;
 syncPair(cap,value);setVars(id,field,value);
 const colors={
  bg:field==='bg'?value:readPair('Bg','#243a8b'),
  text:field==='text'?value:readPair('Text','#ffffff'),
  accent:field==='accent'?value:readPair('Accent','#ce3f44')
 };
 /* Send the complete palette. premium-experience-v2 can now keep its local
    palette and the saved admin configuration in sync without reverting. */
 window.handleInput?.(`templateColors.${id}`,colors);
 requestAnimationFrame(()=>{setVars(id,'bg',colors.bg);setVars(id,'text',colors.text);setVars(id,'accent',colors.accent)});
 setTimeout(()=>{setVars(id,'bg',colors.bg);setVars(id,'text',colors.text);setVars(id,'accent',colors.accent)},60);
 return true;
}
function patchActive(){const id=activePremiumId(),editor=q('#v3TemplateEditor');if(id&&editor)editor.dataset.kyTemplateId=id}
function style(){if(q('#kyPremiumTemplateFixCss'))return;const s=document.createElement('style');s.id='kyPremiumTemplateFixCss';s.textContent=`
@keyframes kyPremiumBorderRace{0%{background-position:0 50%,0% 50%}100%{background-position:0 50%,240% 50%}}
@keyframes kyPremiumGlowPulse{0%,100%{box-shadow:0 0 0 1px rgba(139,92,246,.28),0 0 9px rgba(34,211,238,.22),0 7px 18px rgba(36,58,139,.08)}50%{box-shadow:0 0 0 2px rgba(236,72,153,.38),0 0 22px rgba(34,211,238,.46),0 10px 24px rgba(124,58,237,.18)}}
.ky-premium-tabs button{font-size:9.5px!important;line-height:1.1!important;min-height:32px!important;font-weight:800!important;padding:5px 7px!important}
.ky-premium-tabs button.premium{font-size:9.5px!important}
.ky-premium-template-v3{border:2px solid transparent!important;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(100deg,#6d5dfc,#20d9ff,#ff4fb8,#ff8a3d,#6d5dfc) border-box!important;background-size:100% 100%,240% 100%!important;animation:kyPremiumBorderRace 2.8s linear infinite,kyPremiumGlowPulse 1.9s ease-in-out infinite!important;overflow:visible!important}
.ky-premium-template-v3.active{box-shadow:0 0 0 2px rgba(36,58,139,.16),0 0 28px rgba(100,92,246,.48)!important}
.ky-premium-template-v3 .preview{position:relative;overflow:hidden!important}
.ky-premium-template-v3 .preview:after{content:'';position:absolute;inset:-30%;pointer-events:none;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.7) 49%,transparent 60%);transform:translateX(-80%) rotate(5deg);animation:kyPremiumPreviewShine 2.6s ease-in-out infinite}
@keyframes kyPremiumPreviewShine{0%,45%{transform:translateX(-85%) rotate(5deg);opacity:0}60%{opacity:.8}82%,100%{transform:translateX(90%) rotate(5deg);opacity:0}}
@media(prefers-reduced-motion:reduce){.ky-premium-template-v3,.ky-premium-template-v3 .preview:after{animation:none!important}}
`;document.head.appendChild(s)}
document.addEventListener('input',e=>{if(commit(e.target)){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener('change',e=>{if(commit(e.target)){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener('click',e=>{if(e.target.closest('#v3Templates [data-premium-v3="1"]'))setTimeout(patchActive,0)},true);
const mo=new MutationObserver(()=>{patchActive();style()});
function start(){style();patchActive();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();