(function(){
'use strict';
const byId=id=>document.getElementById(id);
const shop=(new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function dashboardMarkup(){
  return `
    <div class="ky-subpanel-header">
      <button class="ky-btn-back" type="button" data-ky-dashboard-back>← Geri</button>
      <div class="ky-subpanel-title">Genel görünüm</div>
    </div>
    <div class="ky-group" id="kyConnectionCard">
      <div class="ky-group-title">ikas bağlantısı</div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div>
          <div id="kyConnectionHeadline" style="font-size:13px;font-weight:800;color:#243a8b">Bağlantı kontrol ediliyor…</div>
          <div id="kyConnectionDetail" style="margin-top:4px;font-size:10px;line-height:1.5;color:rgba(36,58,139,.55)">TheGoatz mağazası için ürün ve kategori bağlantısı denetleniyor.</div>
        </div>
        <span id="kyConnectionPill" style="display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#fff7ed;color:#c2410c;font-size:9px;font-weight:800;white-space:nowrap">● Bekleniyor</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px">
        <div style="padding:10px;border-radius:10px;background:#f7f8fb;border:1px solid rgba(36,58,139,.08)"><div style="font-size:9px;color:rgba(36,58,139,.5)">Ürün</div><div id="kyProductCount" style="margin-top:2px;font-size:18px;font-weight:800;color:#243a8b">—</div></div>
        <div style="padding:10px;border-radius:10px;background:#f7f8fb;border:1px solid rgba(36,58,139,.08)"><div style="font-size:9px;color:rgba(36,58,139,.5)">Kategori</div><div id="kyCategoryCount" style="margin-top:2px;font-size:18px;font-weight:800;color:#243a8b">—</div></div>
      </div>
      <div id="kyConnectionActions" style="display:flex;gap:7px;margin-top:11px">
        <button class="ky-btn ky-btn-publish" id="kyReconnectBtn" type="button">ikas bağlantısını yetkilendir</button>
        <button class="ky-btn ky-btn-secondary" id="kySyncBtn" type="button">Verileri yeniden çek</button>
      </div>
      <div id="kyConnectionError" style="display:none;margin-top:9px;padding:9px 10px;border-radius:9px;background:#fff1f2;border:1px solid #fecdd3;color:#be123c;font-size:9.5px;line-height:1.45"></div>
    </div>
    <div class="ky-group">
      <div class="ky-group-title">Nasıl çalışır?</div>
      <div style="display:grid;gap:8px">
        <div style="display:flex;gap:9px;align-items:flex-start"><span class="ky-menu-icon" style="width:28px;height:28px;min-width:28px">1</span><div><strong style="font-size:10.5px;color:#243a8b">Satış verilerini alır</strong><div style="font-size:9px;line-height:1.45;color:rgba(36,58,139,.5)">ikas ürün, kategori ve sipariş verileri arka planda senkronize edilir.</div></div></div>
        <div style="display:flex;gap:9px;align-items:flex-start"><span class="ky-menu-icon" style="width:28px;height:28px;min-width:28px">2</span><div><strong style="font-size:10.5px;color:#243a8b">Kategori sırasını hesaplar</strong><div style="font-size:9px;line-height:1.45;color:rgba(36,58,139,.5)">Her ürün kendi kategorisi içindeki satış performansına göre sıralanır.</div></div></div>
        <div style="display:flex;gap:9px;align-items:flex-start"><span class="ky-menu-icon" style="width:28px;height:28px;min-width:28px">3</span><div><strong style="font-size:10.5px;color:#243a8b">Rozeti otomatik uygular</strong><div style="font-size:9px;line-height:1.45;color:rgba(36,58,139,.5)">Yayınlanan ayarlar seçili mağaza alanlarındaki uygun ürünlere uygulanır.</div></div></div>
      </div>
    </div>`;
}

function showMenu(){
  const menu=byId('menuList');
  document.querySelectorAll('.ky-subpanel').forEach(p=>p.classList.remove('active'));
  if(menu){menu.style.display='flex';menu.classList.add('active');}
  try{sessionStorage.removeItem('ky.lastPanel');}catch{}
}

function mountDashboard(){
  const panel=byId('panelDashboard');
  if(!panel)return;
  if(!panel.innerHTML.trim()) panel.innerHTML=dashboardMarkup();
  panel.querySelector('[data-ky-dashboard-back]')?.addEventListener('click',showMenu);
  byId('kyReconnectBtn')?.addEventListener('click',()=>{
    try{window.top.location.href=`${location.origin}/install?shop=${encodeURIComponent(shop)}`}
    catch{location.href=`/install?shop=${encodeURIComponent(shop)}`}
  });
  byId('kySyncBtn')?.addEventListener('click',syncNow);
}

async function fetchSettings(){
  const r=await fetch(`/api/admin/settings?shop=${encodeURIComponent(shop)}&t=${Date.now()}`,{cache:'no-store'});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.message||`HTTP ${r.status}`);
  return data;
}

function renderConnection(data){
  const c=data.connection||{};
  const connected=!!c.connected;
  const headline=byId('kyConnectionHeadline'), detail=byId('kyConnectionDetail'), pill=byId('kyConnectionPill'), err=byId('kyConnectionError');
  if(byId('kyProductCount'))byId('kyProductCount').textContent=String(c.productCount??0);
  if(byId('kyCategoryCount'))byId('kyCategoryCount').textContent=String(c.categoryCount??0);
  if(headline)headline.textContent=connected?'TheGoatz mağazası bağlı':'TheGoatz mağaza bağlantısı tamamlanmadı';
  if(detail)detail.textContent=connected?(c.lastSync?`Son senkronizasyon: ${new Date(c.lastSync).toLocaleString('tr-TR')}`:'Ürün verileri ikas üzerinden alındı.'):'Ürünleri gösterebilmek için uygulamanın ikas yetkilendirmesinin tamamlanması gerekiyor.';
  if(pill){pill.textContent=connected?'● Bağlı':'● Bekleniyor';pill.style.background=connected?'#ecfdf3':'#fff7ed';pill.style.color=connected?'#15803d':'#c2410c';}
  if(err){if(c.syncError){err.style.display='block';err.textContent=`Bağlantı ayrıntısı: ${c.syncError}`}else{err.style.display='none';err.textContent='';}}
  const header=byId('connectionStatus');
  if(header){
    header.className='ky-connection'+(connected?' connected':'');
    header.innerHTML=`<span class="ky-connection-dot"></span><span class="ky-connection-copy"><strong>${connected?'Bağlı':'Bağlantı bekleniyor'}</strong><span>${esc(shop)}${connected&&c.productCount?` · ${c.productCount} ürün`:''}</span></span>`;
    if(c.syncError)header.title=c.syncError;
  }
}

async function refresh(){
  try{renderConnection(await fetchSettings())}catch(e){
    const err=byId('kyConnectionError');if(err){err.style.display='block';err.textContent=e.message;}
  }
}

async function syncNow(){
  const btn=byId('kySyncBtn');if(btn){btn.disabled=true;btn.textContent='Senkronize ediliyor…'}
  try{
    const r=await fetch(`/api/admin/rankings/sync?shop=${encodeURIComponent(shop)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shop})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.message||`HTTP ${r.status}`);
    location.reload();
  }catch(e){
    const err=byId('kyConnectionError');if(err){err.style.display='block';err.textContent=`Senkronizasyon başarısız: ${e.message}`;}
  }finally{if(btn){btn.disabled=false;btn.textContent='Verileri yeniden çek'}}
}

function recoverBlankSidebar(){
  const menu=byId('menuList');
  const active=[...document.querySelectorAll('.ky-subpanel.active')][0];
  if(active && !active.innerHTML.trim()) showMenu();
  if(!active && menu && getComputedStyle(menu).display==='none') showMenu();
}

function exposeBrand(){
  const img=document.querySelector('#btnBrandHome img');
  if(img){img.style.display='block';img.style.width='154px';img.style.height='50px';img.style.objectFit='contain';img.style.objectPosition='left center';}
}

function init(){
  mountDashboard();
  exposeBrand();
  recoverBlankSidebar();
  refresh();
  setTimeout(recoverBlankSidebar,250);
  setInterval(refresh,60000);
  document.addEventListener('click',e=>{
    const card=e.target.closest('.ky-menu-card[data-target="panelDashboard"]');
    if(card)setTimeout(()=>{mountDashboard();refresh();},0);
  },true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
