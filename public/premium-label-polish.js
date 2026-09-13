(function(){
'use strict';
const CROWN='/premium-crown.png?v=20260913-1';
function apply(){
  document.querySelectorAll('.ky-premium-choice .ky-premium-tag').forEach(tag=>{
    tag.dataset.polished='1';
    tag.textContent='';
    tag.innerHTML=`<img src="${CROWN}" alt="Premium">`;
  });
}
const style=document.createElement('style');
style.textContent=`
#v3Icons,.ky-premium-choice{overflow:visible!important}
.ky-premium-choice{position:relative!important}
.ky-premium-choice .ky-premium-tag{
  position:absolute!important;
  left:auto!important;
  right:-8px!important;
  top:-10px!important;
  width:20px!important;
  height:20px!important;
  min-width:20px!important;
  max-width:20px!important;
  padding:0!important;
  margin:0!important;
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
  border-radius:0!important;
  display:block!important;
  z-index:30!important;
  transform:rotate(18deg)!important;
  transform-origin:center!important;
  pointer-events:none!important;
  font-size:0!important;
  line-height:0!important;
}
.ky-premium-choice .ky-premium-tag img{
  width:20px!important;
  height:20px!important;
  object-fit:contain!important;
  display:block!important;
}
#kyIconFilterBar [data-filter="premium"]{color:#ffb943!important}
#kyIconFilterBar [data-filter="premium"].active{background:#fff8e8!important;border-color:#ffcf70!important;color:#c98200!important}
`;
document.head.appendChild(style);
const mo=new MutationObserver(()=>{clearTimeout(mo.t);mo.t=setTimeout(apply,20)});
mo.observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
