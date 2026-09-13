(function(){
'use strict';
const css=document.createElement('style');
css.id='kyPremiumUiFix';
css.textContent=`
.ky-premium-tag{
  background:#f6c344!important;
  color:#4a3500!important;
  border:1px solid rgba(122,88,0,.18)!important;
  box-shadow:0 2px 5px rgba(122,88,0,.16)!important;
  text-transform:uppercase!important;
  letter-spacing:.03em!important;
  padding:2px 6px!important;
  font-size:7px!important;
  font-weight:900!important;
}
#kyIconFilterBar [data-filter="premium"]{
  position:relative;
}
#kyIconFilterBar [data-filter="premium"].active{
  background:#f6c344!important;
  color:#4a3500!important;
  border-color:#dfad29!important;
}
`;
document.head.appendChild(css);
})();
