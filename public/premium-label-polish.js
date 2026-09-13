(function(){
'use strict';
const CROWN='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD4UlEQVR42u2WzW9UVRjGf885dzrD2FIwgRUmbnABaaLUFdGUtiikiSYuZlwqmOiKP8FMGrcGwg4SQVzau3ChDF9KSWBDUtzRQBd10xUYS6FO6cy552VxO+1UlA9lwAXv3dzce855nvd5P84LL+0/mE0OJTY5lLwYcEN/9/6cwGsOwOrDh6w+fKjz2787EGQ8mRdmFQ9gp4cP2NUxs6tjZqeHD3T+exo8ByAwgT3OC6vVHKTR6vu30eOPcKcZuNMM9PgjNrl/G6QxX/No9dp4qwRsarBgtaFEGo+P9GLPJSdhWPM4Rd9PFkUWRdH302gelzD2XHKPUk8aj1YbSmxqsAAgq+8vouY5ismrLIZP9eHFX22i4qmkUcpZrm1OM/tx+CCbiye42wqIZEXTwMZCwvzyZ/pg8mR77bokTStO1TSz+uhblNx3LGd/YD37HJv6HMZ2im6ADe6KnRn5QtU0kzCbWIl3p/Qlf5ilEIFOpTxLIVLyh+3s+691hsImKl7CVE0zOzf6OT26QtEPYGxnU59z2p0uId2gFSPBivQWjtn5vafsm919qqaZTQ0W2DmdrEpf8v20oqGOpBWiFS0PSzgmYeycTmxqsKBqmtnEUK9d2Pst5eQ4LSvRjBHphnanS20JZ0ncCJa1uBciGwuf8Poru+yn4QN6e/IaXMPqowfZWBjLpdfDzUfyLIZAf8+Y1UcPaiw9CWBnRnZR8Kco+QHuNjNQpOAKLGezwEoMxcyKP0IkLLQCZT9A0V+2syNfEjWP11EaD0n/V/M0QsTrqNVHwdlmvPsKrw0stAJOCUbetoyZNQIwQ2YgEwgcCUsh4t0GyoWvAVjKIDymWwgRTHj10pucWN23FCJuRTWZyCzHXCVg9hv3M0CuQ1JHZsafrZivkVsX938mwcP7Os5FjvtZjtnuAywmc4S4gM9TbZ1HyIP8E4E/bp9heIkQF3DJ3BqB6vl50ByJy6u2m1dY4gDNse/8PICziYoXGGKWRNDRfJ65CVvBmG33GceWW22JbiIZpoh161FEMuAmAFtuddSzNEMi4Sjgu3S9Z1bIFdBM+1PC7a255FmYpqHfiRaJuC7lQKQRHFmYBuD2Vlubamo43tnb91wmmis/39M48X8xV8qs5qTxaBdG3yDj+65WYZ5r4PlY7/0yY1ZzCel0HoYYypRKbz4XAsv3ywCk0x1VkJlYDhnRAvll+2yZtM90SsjWci/h+o4cyBfvIPP093hil1RwgsVWjgVwfUfOxAxJmNVHPqKcvEsj2FP1/idTwCgnohEua+ziD23MF18F60hOVHxHa+6O3d5qqq4NrC/tATd9C+DjwtvzAAAAAElFTkSuQmCC';
function apply(){
  document.querySelectorAll('.ky-premium-tag').forEach(tag=>{
    if(tag.dataset.polished==='1') return;
    tag.dataset.polished='1';
    tag.innerHTML=`<span>Premium</span><img src="${CROWN}" alt="">`;
  });
}
const style=document.createElement('style');
style.textContent=`
.ky-premium-tag{
  left:3px!important;right:auto!important;top:3px!important;
  background:transparent!important;border:0!important;box-shadow:none!important;
  padding:0!important;border-radius:0!important;
  color:#ffb943!important;font-size:6.5px!important;font-weight:800!important;
  line-height:1!important;display:inline-flex!important;align-items:center!important;gap:2px!important;
  text-transform:none!important;max-width:34px!important;white-space:nowrap!important;
}
.ky-premium-tag img{width:8px!important;height:8px!important;object-fit:contain!important;display:block!important;flex:0 0 auto!important}
#kyIconFilterBar [data-filter="premium"]{color:#ffb943!important}
#kyIconFilterBar [data-filter="premium"].active{background:#fff8e8!important;border-color:#ffcf70!important;color:#c98200!important}
`;
document.head.appendChild(style);
const mo=new MutationObserver(()=>{clearTimeout(mo.t);mo.t=setTimeout(apply,25)});
mo.observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
