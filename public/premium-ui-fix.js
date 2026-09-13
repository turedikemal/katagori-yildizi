(function(){
'use strict';
const crown='/premium-crown.png?v=20260913-1';

function cleanPremiumTags(){
  document.querySelectorAll('.ky-premium-choice .ky-premium-tag').forEach(tag=>{
    tag.textContent='';
    tag.setAttribute('aria-label','Premium');
    tag.setAttribute('title','Premium');
  });
}

const css=document.createElement('style');
css.id='kyPremiumUiFix';
css.textContent=`
#v3Icons{overflow:visible!important}
.ky-premium-choice{overflow:visible!important;position:relative!important}
.ky-premium-tag{
  position:absolute!important;
  top:-10px!important;
  right:-8px!important;
  width:20px!important;
  height:20px!important;
  min-width:20px!important;
  max-width:20px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  color:transparent!important;
  font-size:0!important;
  line-height:0!important;
  overflow:visible!important;
  transform:rotate(18deg)!important;
  transform-origin:center!important;
  z-index:20!important;
  pointer-events:none!important;
}
.ky-premium-tag::before{
  content:''!important;
  display:block!important;
  width:20px!important;
  height:20px!important;
  background-image:url('${crown}')!important;
  background-size:contain!important;
  background-position:center!important;
  background-repeat:no-repeat!important;
}
#kyIconFilterBar [data-filter="premium"]{
  position:relative!important;
  display:inline-flex!important;
  align-items:center!important;
  gap:7px!important;
  color:#d98c00!important;
  background:#fffaf0!important;
  border-color:#ffb943!important;
  padding:7px 14px!important;
}
#kyIconFilterBar [data-filter="premium"]::after{
  content:''!important;
  width:17px!important;
  height:17px!important;
  display:inline-block!important;
  background-image:url('${crown}')!important;
  background-size:contain!important;
  background-repeat:no-repeat!important;
  background-position:center!important;
  flex:0 0 auto!important;
}
#kyIconFilterBar [data-filter="premium"].active{
  background:#fff8e8!important;
  color:#ffb943!important;
  border-color:#ffb943!important;
  box-shadow:0 0 0 1px rgba(255,185,67,.08)!important;
}
`;
document.head.appendChild(css);
cleanPremiumTags();
const observer=new MutationObserver(()=>cleanPremiumTags());
observer.observe(document.body,{childList:true,subtree:true});
})();
