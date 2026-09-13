(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let busy=false;

function currentSvg(){
  const id=localStorage.getItem('ky-custom-icon');
  if(!id) return null;
  const btn=qs(`[data-custom-icon="${CSS.escape(id)}"]`);
  return btn?.querySelector('svg')?.outerHTML||null;
}

function paint(){
  if(busy) return;
  busy=true;
  try{
    const svg=currentSvg();
    if(!svg) return;
    qsa('.ky-v3-badge').forEach(badge=>{
      const spans=qsa(':scope > span',badge);
      if(!spans.length) return;
      const icon=spans[0];
      if(icon===spans[spans.length-1] && spans.length===1) return;
      icon.innerHTML=svg;
      icon.classList.add('ky-custom-badge-icon');
      icon.style.display='inline-flex';
      icon.style.alignItems='center';
      icon.style.justifyContent='center';
    });
  } finally {
    busy=false;
  }
}

function queue(){requestAnimationFrame(()=>requestAnimationFrame(paint));}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-custom-icon],#v3Icons,.ky-view-tab,.ky-device-btn,[data-template]')){
    setTimeout(queue,0);setTimeout(queue,50);setTimeout(queue,180);
  }
},true);
document.addEventListener('input',e=>{if(e.target.closest('#panelIcons,#panelTemplates,#panelColors,#panelSizing,#panelTypography'))queue();},true);
document.addEventListener('change',e=>{if(e.target.closest('#panelIcons,#panelTemplates,#panelColors,#panelSizing,#panelTypography'))queue();},true);

const obs=new MutationObserver(()=>{if(!busy)queue();});
function start(){obs.observe(document.body,{subtree:true,childList:true});queue();setTimeout(queue,250);setTimeout(queue,900);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
