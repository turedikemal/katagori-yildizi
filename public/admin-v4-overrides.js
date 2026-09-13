(function(){
'use strict';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const params=new URLSearchParams(location.search);
const shop=(params.get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');

if(params.get('profilePreview')==='1') document.body.classList.add('ky-profile-preview');

function deviceIcons(){
  const desktop=qs('.ky-device-btn.desktop');
  const mobile=qs('.ky-device-btn.mobile');
  if(desktop && !qs('.ky-device-svg',desktop)) desktop.innerHTML='<svg class="ky-device-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></svg>';
  if(mobile && !qs('.ky-device-svg',mobile)) mobile.innerHTML='<svg class="ky-device-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path></svg>';
}

const originalTemplates=[
  ['navy-pill','Adaçayı Şerit','Orijinal'],
  ['gradient-pill','Gradyan Oval','Orijinal'],
  ['coral-pop','Alev Trend','Orijinal'],
  ['mono','Minimal Çizgili','Orijinal'],
  ['modern-outline','Çerçeveli Outline','Orijinal'],
  ['eco-clean','Eko Doğal','Orijinal'],
  ['neon-edge','Siber Neon','Orijinal']
];
const preferredModern=[
  ['glass-pill','Cam Kapsül'],['split-pill','Çift Renk Kapsül'],['soft-blue','Soft Blue'],['sunset','Sunset'],['ocean','Ocean'],['aurora','Aurora'],['berry','Berry'],['shadow-pill','Floating Shadow'],['electric','Electric'],['rose','Rose Soft'],['sky','Sky'],['violet','Violet'],['graphite','Graphite'],['dot-label','Dot Label'],['cream','Cream Label'],['teal','Teal Capsule'],['ruby','Ruby'],['holographic','Holografik']
];

function restoreTemplates(){
  const host=qs('#v3Templates');
  if(!host || !host.children.length) return;
  const cards=new Map(qsa('[data-template]',host).map(card=>[card.dataset.template,card]));
  const order=[...originalTemplates,...preferredModern];
  let changed=false;

  for(const [id,name,tag] of order){
    const card=cards.get(id); if(!card) continue;
    const label=qs('.name',card);
    if(label && label.textContent!==name){ label.textContent=name; changed=true; }
    const oldTag=qs('.tag',card);
    if(tag){
      if(oldTag){ if(oldTag.textContent!==tag){ oldTag.textContent=tag; changed=true; } }
      else { const t=document.createElement('span');t.className='tag';t.textContent=tag;card.appendChild(t);changed=true; }
    } else if(oldTag && oldTag.textContent==='Yeni') { oldTag.remove(); changed=true; }
  }

  const desiredIds=order.map(([id])=>id).filter(id=>cards.has(id));
  const currentIds=qsa('[data-template]',host).map(card=>card.dataset.template);
  const currentKnown=currentIds.filter(id=>desiredIds.includes(id));
  if(currentKnown.join('|')!==desiredIds.join('|')){
    const frag=document.createDocumentFragment();
    desiredIds.forEach(id=>frag.appendChild(cards.get(id)));
    currentIds.filter(id=>!desiredIds.includes(id)).forEach(id=>frag.appendChild(cards.get(id)));
    host.appendChild(frag);
    changed=true;
  }
  return changed;
}

function categoryCopy(){
  const intro=qs('#panelCategories .ky-category-intro');
  if(!intro) return;
  const html='<strong>Kategori sıralamaları nasıl çalışır?</strong><br>ikas satışları otomatik analiz edilir ve her ürün kendi kategorisi içinde sıralanır. Aşağıdaki listeden yalnızca istisna gerektiğinde sıralamayı sabitleyebilir veya belirli bir ürünün rozetini gizleyebilirsiniz. Veriler arka planda otomatik güncellenir.';
  if(intro.innerHTML!==html) intro.innerHTML=html;
}

function imageFallbacks(){
  qsa('.ky-mock-img-wrap>img,.ky-pdp-gallery>img').forEach(img=>{
    if(img.dataset.kyFallbackBound) return;
    img.dataset.kyFallbackBound='1';
    const apply=()=>{
      const parent=img.parentElement;if(!parent||qs('.ky-img-fallback',parent))return;
      img.style.display='none';
      const fb=document.createElement('div');fb.className='ky-img-fallback';fb.innerHTML='<div><img src="/thegoatzstudio.png" alt=""><div style="margin-top:8px">Ürün görseli yükleniyor</div></div>';
      parent.appendChild(fb);
    };
    img.addEventListener('error',apply,{once:true});
    if(!img.getAttribute('src')) apply();
  });
}

function enhanceProfile(){
  const layer=qs('#accountProfileLayer');
  if(!layer) return;
  const brand=qs('.ky-profile-brand',layer);
  if(brand && !qs('.ky-profile-live-preview',brand)){
    brand.innerHTML=`
      <img src="/thegoatzstudio.png" alt="The Goatz Studio">
      <div style="display:inline-flex;width:max-content;margin-top:20px;padding:7px 11px;border-radius:999px;background:#fff;border:1px solid rgba(36,58,139,.10);font-size:10px;font-weight:800;color:#243a8b">Kategori Yıldızı</div>
      <h2>Profil bilgilerini güncelle.</h2>
      <p>İletişim ve görev bilgilerini buradan değiştirebilirsin. Profilin mağazana bağlı olarak saklanır ve destek taleplerinde otomatik kullanılır.</p>
      <div class="ky-profile-live-preview"><iframe src="/admin?shop=${encodeURIComponent(shop)}&profilePreview=1" title="Kategori Yıldızı panel önizlemesi" tabindex="-1"></iframe></div>
      <div class="ky-profile-trust"><div><span class="check">✓</span> ikas mağazan otomatik doğrulanır</div><div><span class="check">✓</span> Profilin mağazana bağlı kalır; yeniden kurulumda kaybolmaz</div></div>`;
  }

  const form=qs('.ky-profile-form',layer);
  if(form && !qs('.ky-privacy-box',form)){
    const role=qs('#accountRole',form);
    if(role && role.tagName==='INPUT'){
      const sel=document.createElement('select');sel.id='accountRole';sel.className='ky-select';
      ['Marka sahibi','Kurucu / Ortak','E-ticaret yöneticisi','Pazarlama','Ajans / Danışman','Diğer'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o)});
      const current=role.value;
      if(current && ![...sel.options].some(o=>o.value===current)){const o=document.createElement('option');o.value=current;o.textContent=current;sel.appendChild(o)}
      sel.value=current||'Marka sahibi';role.replaceWith(sel);
    }
    const actions=qs('.ky-profile-actions',form);
    if(actions){
      const box=document.createElement('div');box.className='ky-privacy-box';box.innerHTML='<label><input type="checkbox" id="kyPrivacyRequired" checked> <span>Kişisel verilerimin hesabın çalıştırılması, destek sunulması ve güvenlik amacıyla işlenmesine ilişkin aydınlatma metnini okudum. <strong>(zorunlu)</strong></span></label><label><input type="checkbox" id="kyMarketingVisual"> <span>Ürün haberleri ve kampanyalar için benimle iletişime geçilmesini istiyorum. <strong>(isteğe bağlı)</strong></span></label>';
      actions.parentElement.insertBefore(box,actions);
      const market=qs('#accountMarketing',form),visual=qs('#kyMarketingVisual',form);
      if(market&&visual){visual.checked=market.checked;visual.onchange=()=>{market.checked=visual.checked;market.dispatchEvent(new Event('change',{bubbles:true}))};market.closest('label')?.style.setProperty('display','none','important');}
      const required=qs('#kyPrivacyRequired',form),save=qs('#accountProfileSave',form);
      const sync=()=>{if(save)save.disabled=!required.checked};required.addEventListener('change',sync);sync();
    }
  }
}

function supportPolish(){
  const d=qs('#accountSupportDialog');if(!d)return;
  const note=qs('.ky-support-note',d);
  if(note && !note.dataset.kyPolished){note.dataset.kyPolished='1';note.textContent='Destek talebin doğrudan The Goatz Studio destek akışına gider. Yanıtlar profilinde kayıtlı e-posta adresine gönderilir.';}
}

function run(){deviceIcons();categoryCopy();imageFallbacks();enhanceProfile();supportPolish();}

let scheduled=false;
function scheduleRun(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;run();});
}

const mo=new MutationObserver(scheduleRun);
mo.observe(document.body,{subtree:true,childList:true});
run();
setTimeout(run,150);
setTimeout(run,700);
setInterval(()=>{deviceIcons();imageFallbacks();},3000);
})();
