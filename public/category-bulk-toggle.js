/* Kategori Yildizi — focused preview icon integrity. */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const GLYPHS={award:'◆',crown:'♛',star:'★',medal:'◉',trophy:'♜',fire:'◆',sparkles:'✦',bolt:'ϟ',heart:'♥',gem:'⬥',ribbon:'⌑',trend:'↗',tag:'◇',cart:'▣',leaf:'◖',diamond:'◆',check:'✓',target:'◎',rocket:'▲'};
let selectedType='',scheduled=false,busy=false,mo=null;
function norm(v){return String(v||'').trim()}
function hex(id,fallback){const v=norm(q('#'+id+'Hex')?.value||q('#'+id+'Picker')?.value);return /^#[0-9a-f]{6}$/i.test(v)?v:fallback}
function currentType(){
 return selectedType||q('#v3Icons [data-icon].active')?.dataset.icon||q('#stageCanvas .ky-v3-badge[data-icon-type]')?.dataset.iconType||'award';
}
function enabled(){const t=q('#v3IconEnabled');return t?t.checked:true}
function size(){return Math.max(8,Math.min(48,Number(q('#v3IconSize')?.value||14)))}
function removeIconChildren(badge){
 const text=q(':scope > .ky-badge-text',badge);
 [...badge.children].forEach(child=>{if(child!==text&&!child.classList.contains('ky-badge-text'))child.remove()});
}
function makeIcon(type){
 const choice=q(`#v3Icons [data-icon="${CSS.escape(type)}"]`);
 if(type.startsWith('premium-')){
  const src=q('.ky-premium-icon',choice);if(!src)return null;
  const clone=src.cloneNode(true);
  clone.classList.add('ky-preview-icon-source');
  clone.style.setProperty('font-size',size()+'px','important');
  clone.style.setProperty('--ky-icon-main',hex('v3IconC1',clone.style.getPropertyValue('--ky-icon-main')||'#243a8b'));
  clone.style.setProperty('--ky-icon-accent',hex('v3IconC2',clone.style.getPropertyValue('--ky-icon-accent')||'#f2b84b'));
  return clone;
 }
 const glyph=GLYPHS[type]||norm(q('b',choice)?.textContent)||'◆';
 const span=document.createElement('span');span.className='ky-preview-icon-source ky-preview-basic-icon';span.setAttribute('aria-hidden','true');span.textContent=glyph;
 span.style.cssText=`display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:${size()}px;line-height:1;color:${hex('v3IconC1','#ffffff')}`;
 return span;
}
function apply(){
 scheduled=false;if(busy)return;const canvas=q('#stageCanvas');if(!canvas)return;
 busy=true;
 try{
  const type=currentType(),on=enabled()&&type&&type!=='none',sig=`${on?1:0}|${type}|${size()}|${hex('v3IconC1','#ffffff')}|${hex('v3IconC2','#f2b84b')}`;
  qa('.ky-v3-badge',canvas).forEach(badge=>{
   const text=q(':scope > .ky-badge-text',badge);if(!text)return;
   const hasIcon=[...badge.children].some(x=>x!==text&&!x.classList.contains('ky-badge-text'));
   if(badge.dataset.kyIconIntegrity===sig&&((on&&hasIcon)||(!on&&!hasIcon)))return;
   removeIconChildren(badge);
   badge.dataset.iconType=type;
   if(on){const icon=makeIcon(type);if(icon)badge.insertBefore(icon,text)}
   badge.dataset.kyIconIntegrity=sig;
  });
 }finally{busy=false}
}
function schedule(delay=0){
 if(delay){setTimeout(()=>schedule(0),delay);return}
 if(scheduled)return;scheduled=true;requestAnimationFrame(apply);
}
function injectStyle(){if(q('#kyPreviewIconIntegrityCss'))return;const s=document.createElement('style');s.id='kyPreviewIconIntegrityCss';s.textContent=`
#stageCanvas .ky-focus-card .ky-v3-badge>.ky-preview-icon-source,#stageCanvas .ky-focus-card .ky-v3-badge>.ky-premium-icon,#stageCanvas .ky-mock-card .ky-v3-badge>.ky-preview-icon-source,#stageCanvas .ky-mock-card .ky-v3-badge>.ky-premium-icon{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;margin:0 4px 0 0!important;overflow:visible!important}
#stageCanvas .ky-focus-card .ky-v3-badge>.ky-premium-icon svg,#stageCanvas .ky-mock-card .ky-v3-badge>.ky-premium-icon svg{display:block!important;width:100%!important;height:100%!important;overflow:visible!important}
`;
document.head.appendChild(s)}
function start(){
 injectStyle();
 document.addEventListener('click',e=>{const choice=e.target.closest('#v3Icons [data-icon]');if(choice){selectedType=choice.dataset.icon;schedule();schedule(50);schedule(140)}},true);
 document.addEventListener('input',e=>{if(e.target.closest('#panelIcons')||e.target.id==='v3IconSize')schedule(20)},true);
 document.addEventListener('change',e=>{if(e.target.closest('#panelIcons')||e.target.id==='v3IconEnabled')schedule(20)},true);
 const canvas=q('#stageCanvas');if(canvas){mo=new MutationObserver(()=>{if(!busy)schedule()});mo.observe(canvas,{childList:true,subtree:true})}
 schedule();schedule(250);schedule(900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();