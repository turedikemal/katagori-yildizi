(function(){
'use strict';
const shop=(new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');
const byId=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function request(path,options={}){
  const url=new URL(path,location.origin);url.searchParams.set('shop',shop);
  const init={...options,headers:{...(options.headers||{})}};
  if(init.body&&typeof init.body!=='string'){
    init.headers['Content-Type']='application/json';
    init.body=JSON.stringify({...init.body,shop});
  }
  const res=await fetch(url,init);let data={};try{data=await res.json()}catch{}
  if(!res.ok)throw new Error(data.message||data.error||`HTTP ${res.status}`);
  return data;
}
function toast(text,error=false){
  let t=byId('accountV3Toast');if(!t){t=document.createElement('div');t.id='accountV3Toast';t.className='ky-toast';document.body.appendChild(t)}
  t.textContent=text;t.style.display='block';t.style.background=error?'#b42318':'#17213a';clearTimeout(toast._t);toast._t=setTimeout(()=>t.style.display='none',3800);
}
function mountProfile(){
  if(byId('accountProfileLayer'))return;
  const layer=document.createElement('div');layer.id='accountProfileLayer';layer.className='ky-fullscreen-layer';
  layer.innerHTML=`<div class="ky-profile-shell">
    <section class="ky-profile-brand">
      <img src="/thegoatzstudio.png?v=20260913-2" alt="The Goatz Studio">
      <div style="display:inline-flex;width:max-content;margin-top:22px;padding:7px 11px;border-radius:999px;background:#fff;border:1px solid rgba(36,58,139,.10);font-size:10px;font-weight:800;color:#243a8b">Kategori Yıldızı</div>
      <h2>Profil bilgilerini güncelle.</h2>
      <p>İletişim ve görev bilgilerini buradan değiştirebilirsin. Profilin mağazana bağlı olarak saklanır ve destek taleplerinde otomatik kullanılır.</p>
      <div style="margin-top:24px;display:grid;gap:9px;font-size:10.5px;color:#53639a">
        <div>✓ ikas mağazan otomatik doğrulanır</div>
        <div>✓ Profilin mağazana bağlı kalır</div>
        <div>✓ Destek: hello@thegoatzstudio.com</div>
      </div>
    </section>
    <section class="ky-profile-form-wrap"><div class="ky-profile-form">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px">
        <div><div style="font-size:10px;font-weight:800;color:#8b97bf;margin-bottom:7px">1 MAĞAZA &nbsp;—&nbsp; 2 PROFİL &nbsp;—&nbsp; 3 BAŞLA</div><h3>Profilim</h3><p>Bu bilgiler daha sonra destek taleplerinde otomatik kullanılır.</p></div>
        <button class="ky-btn-icon-only" id="accountProfileClose" type="button">×</button>
      </div>
      <div class="ky-profile-grid">
        <div class="ky-profile-field full"><label class="ky-label">Mağaza adı</label><input class="ky-input" id="accountStore" disabled></div>
        <div class="ky-profile-field"><label class="ky-label">Yetkili adı soyadı</label><input class="ky-input" id="accountName" maxlength="120"></div>
        <div class="ky-profile-field"><label class="ky-label">E-posta</label><input class="ky-input" id="accountEmail" type="email" maxlength="200"></div>
        <div class="ky-profile-field"><label class="ky-label">Telefon</label><input class="ky-input" id="accountPhone" maxlength="40"></div>
        <div class="ky-profile-field"><label class="ky-label">Görev / Ünvan</label><input class="ky-input" id="accountRole" maxlength="120"></div>
      </div>
      <label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:10px;line-height:1.45;color:#53639a"><input id="accountMarketing" type="checkbox" style="margin-top:2px"> Ürün güncellemeleri ve duyurular için e-posta almak istiyorum. Bu seçim isteğe bağlıdır.</label>
      <div class="ky-profile-error" id="accountProfileError"></div>
      <div class="ky-profile-actions"><button class="ky-btn ky-btn-secondary" id="accountProfileCancel" type="button">Panele dön</button><button class="ky-btn ky-btn-publish" id="accountProfileSave" type="button">Profili kaydet</button></div>
    </div></section>
  </div>`;
  document.body.appendChild(layer);
  byId('accountProfileClose').onclick=closeProfile;byId('accountProfileCancel').onclick=closeProfile;byId('accountProfileSave').onclick=saveProfile;
}
async function openProfile(){
  mountProfile();const layer=byId('accountProfileLayer');layer.classList.add('open');const err=byId('accountProfileError');err.classList.remove('show');err.textContent='';
  byId('accountStore').value=shop;
  try{
    const d=await request('/api/profile');const p=d.profile||{};
    byId('accountStore').value=p.storeName||shop;byId('accountName').value=p.contactName||'';byId('accountEmail').value=p.email||'';byId('accountPhone').value=p.phone||'';byId('accountRole').value=p.role||'';byId('accountMarketing').checked=!!p.marketingConsent;
  }catch(e){err.textContent=e.message;err.classList.add('show')}
}
function closeProfile(){byId('accountProfileLayer')?.classList.remove('open')}
async function saveProfile(){
  const err=byId('accountProfileError');err.classList.remove('show');err.textContent='';const btn=byId('accountProfileSave');btn.disabled=true;btn.textContent='Kaydediliyor…';
  try{
    await request('/api/profile',{method:'POST',body:{storeName:byId('accountStore').value||shop,contactName:byId('accountName').value,email:byId('accountEmail').value,phone:byId('accountPhone').value,role:byId('accountRole').value,marketingConsent:byId('accountMarketing').checked}});
    closeProfile();toast('Profil kaydedildi.');
  }catch(e){err.textContent=e.message;err.classList.add('show')}finally{btn.disabled=false;btn.textContent='Profili kaydet'}
}
function mountSupport(){
  if(byId('accountSupportDialog'))return;
  const d=document.createElement('dialog');d.id='accountSupportDialog';d.className='ky-modal';d.innerHTML=`<div class="ky-modal-head"><div><h3>Yardım & Destek</h3><p>Kategori Yıldızı için destek talebi oluştur.</p></div><button class="ky-btn-icon-only" id="accountSupportClose" type="button">×</button></div><div class="ky-modal-body">
    <div class="ky-support-note">Talep hello@thegoatzstudio.com destek akışına kaydedilir. Yanıtlar profilinde kayıtlı e-posta adresine gönderilir.</div>
    <div class="ky-field"><label class="ky-label">Yanıt e-postası</label><input class="ky-input" id="accountSupportEmail" disabled placeholder="Önce Profilim alanını tamamlayın"></div>
    <div class="ky-field"><label class="ky-label">Konu türü</label><select class="ky-select" id="accountSupportCategory"><option value="TECHNICAL">Teknik sorun</option><option value="SETUP">Kurulum</option><option value="FEATURE">Özellik talebi</option><option value="PAYMENT">Ödeme</option><option value="COMPLAINT">Şikayet</option><option value="OTHER">Diğer</option></select></div>
    <div class="ky-field"><label class="ky-label">Konu</label><input class="ky-input" id="accountSupportSubject" minlength="3" maxlength="120"></div>
    <div class="ky-field"><label class="ky-label">Mesaj</label><textarea class="ky-textarea" id="accountSupportMessage" minlength="10" maxlength="3000" rows="8"></textarea></div>
    <div class="ky-profile-error" id="accountSupportError"></div>
    <div style="display:flex;justify-content:flex-end;gap:7px;margin-top:14px"><button class="ky-btn ky-btn-secondary" id="accountSupportCancel" type="button">Vazgeç</button><button class="ky-btn ky-btn-publish" id="accountSupportSend" type="button">Destek talebi gönder</button></div>
  </div>`;document.body.appendChild(d);byId('accountSupportClose').onclick=()=>d.close();byId('accountSupportCancel').onclick=()=>d.close();byId('accountSupportSend').onclick=sendSupport;
}
async function openSupport(){
  mountSupport();const dialog=byId('accountSupportDialog'),err=byId('accountSupportError');err.classList.remove('show');err.textContent='';byId('accountSupportEmail').value='';
  try{const p=(await request('/api/profile')).profile;if(p?.email)byId('accountSupportEmail').value=p.email;}catch{}
  dialog.showModal();
}
async function sendSupport(){
  const err=byId('accountSupportError'),btn=byId('accountSupportSend');err.classList.remove('show');err.textContent='';btn.disabled=true;btn.textContent='Gönderiliyor…';
  try{
    const subject=byId('accountSupportSubject').value.trim(),message=byId('accountSupportMessage').value.trim();
    const result=await request('/api/support',{method:'POST',body:{category:byId('accountSupportCategory').value,subject,message}});
    byId('accountSupportDialog').close();byId('accountSupportSubject').value='';byId('accountSupportMessage').value='';toast(result.ticketNumber?`Destek talebi oluşturuldu: ${result.ticketNumber}`:'Destek talebi oluşturuldu.');
  }catch(e){err.textContent=e.message;err.classList.add('show')}finally{btn.disabled=false;btn.textContent='Destek talebi gönder'}
}
async function refreshConnection(){
  const node=byId('connectionStatus');if(!node)return;
  try{
    const d=await request('/api/admin/settings'),c=d.connection||{};node.className='ky-connection'+(c.connected?' connected':'');
    node.innerHTML=`<span class="ky-connection-dot"></span><span class="ky-connection-copy"><strong>${c.connected?'Bağlı':'Bağlantı bekleniyor'}</strong><span>${esc(shop)}${c.productCount?` · ${c.productCount} ürün`:''}</span></span>`;
    if(!c.connected&&c.syncError)node.title=c.syncError;
  }catch(e){node.className='ky-connection';node.innerHTML=`<span class="ky-connection-dot"></span><span class="ky-connection-copy"><strong>Bağlantı hatası</strong><span>${esc(shop)}</span></span>`;node.title=e.message}
}
function wire(){
  document.addEventListener('click',e=>{
    if(e.target.closest('#btnProfile')){e.preventDefault();e.stopImmediatePropagation();openProfile()}
    if(e.target.closest('#btnSupport')){e.preventDefault();e.stopImmediatePropagation();openSupport()}
  },true);
  const open=byId('btnOpenStore');if(open)open.onclick=()=>window.open(`https://${shop}.myikas.com/`,'_blank','noopener');
  refreshConnection();setInterval(refreshConnection,60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
