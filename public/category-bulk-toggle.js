/* Compatibility entry — load the stable live-preview layer. */
(function(){
'use strict';
if(document.querySelector('script[data-ky-preview-stability]'))return;
const s=document.createElement('script');
s.src='/preview-stability-fix.js?v=20260914-3';
s.async=false;
s.dataset.kyPreviewStability='1';
document.body.appendChild(s);
})();
