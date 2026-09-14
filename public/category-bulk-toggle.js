/* Compatibility entry — load the stable live-preview and focused UI tuning layers. */
(function(){
'use strict';
function load(key,src){
 if(document.querySelector(`script[data-${key}]`))return;
 const s=document.createElement('script');
 s.src=src;
 s.async=false;
 s.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';
 document.body.appendChild(s);
}
load('ky-preview-stability','/preview-stability-fix.js?v=20260914-5');
load('ky-ui-control-tuning','/ui-control-tuning.js?v=20260915-1');
})();
