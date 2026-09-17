/** Kategori Yıldızı v3 — reactive admin editor */
(function(){
'use strict';

const BLUE='#243a8b', RED='#ce3f44';
const shop=(window.__KY_SHOP__||new URLSearchParams(location.search).get('shop')||'thegoatz').replace(/\.myikas\.com$/i,'');
const API=location.origin;
const byId=id=>document.getElementById(id);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const deepMerge=(a,b)=>{const out=Array.isArray(a)?[...a]:{...a}; if(!b||typeof b!=='object')return out; Object.keys(b).forEach(k=>{out[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a&&typeof a[k]==='object'&&!Array.isArray(a[k]))?deepMerge(a[k],b[k]):b[k];}); return out;};
const setPath=(obj,path,val)=>{const parts=path.split('.'); let t=obj; parts.slice(0,-1).forEach(k=>t=t[k]||(t[k]={})); t[parts.at(-1)]=val;};
const getPath=(obj,path,fallback)=>{try{return path.split('.').reduce((a,k)=>a?.[k],obj)??fallback}catch{return fallback}};

const DEFAULT={
 templateId:'navy-pill',
 themeId:'ozy',
 ranking:{period:'30days',metric:'quantity',maxRank:3,excludeOutOfStock:true,excludeRefunded:true,minSalesThreshold:0},
 placements:{homeCards:true,categoryCards:true,searchResults:true,productDetail:true,cardLocation:'image_overlay',detailLocation:'under_title',ninePointPosition:'top_left',offsetX:0,offsetY:0},
 styling:{useStoreThemeFont:true,fontFamily:'Bricolage Grotesque',fontSize:12,fontWeight:700,bgColor:BLUE,textColor:'#ffffff',accentColor:RED,gradientEnabled:false,gradientColor1:BLUE,gradientColor2:RED,gradientAngle:135,borderColor:BLUE,borderWidth:0,borderRadius:9,shadow:'soft',opacity:100,paddingX:10,paddingY:5,scale:100},
 texts:{productText:'En Çok Satan {rank}. Ürün',pdpPrefixText:'{category} Kategorisinde',pdpBadgeText:'En Çok Satan {rank}. Ürün'},
 icon:{enabled:true,type:'award',size:14,mode:'mono',color:'#ffffff',accentColor:'#ffd166'},
 animation:{entry:'fade',hover:'none',durationMs:320},
 responsive:{desktopEnabled:true,mobileEnabled:true,mobileFontSizeOffset:-1,mobileBadgeScale:92,mobilePaddingX:8,mobilePaddingY:4},
 rules:{hideIfRankAbove:20,hideIfDiscounted:false,hideIfNewProduct:false,excludedProducts:[],excludedCategories:[]},
 templateColors:{}
};

const TEMPLATES=[
 ['navy-pill','Atölye Kapsül','atelier',BLUE,'#fff',RED],
 ['gradient-pill','Kontur Kapsül','contour',BLUE,'#17213a',RED],
 ['mono','Editoryal Çizgi','editorial','#111827','#111827',BLUE],
 ['split-pill','İkili Madalyon','medallion',BLUE,'#fff',RED],
 ['eco-clean','Adaçayı Şerit','sage','#40574f','#fff','#c8c99e'],
 ['modern-outline','Modern Çerçeve','frame',BLUE,BLUE,'#8aa2ff'],
 ['glass-pill','Buzlu Cam','frosted',BLUE,'#fff','#8aa2ff'],
 ['luxury-label','Gece Plaketi','luxe','#111827','#fff4c2','#d8b45c'],
 ['soft-stamp','Yumuşak Damga','stamp',RED,'#8f2530','#ffd3d6'],
 ['arc-pill','Renk Yayı','arc','#5c4ee5','#fff','#ff7a90'],
 ['rank-tab','Sıra Sekmesi','ranktab',BLUE,'#fff',RED],
 ['signature-pill','İmza Kapsül','signature','#f4efe7',BLUE,RED],
 ['ribbon-fold','Katlı Kurdele','fold',BLUE,'#fff','#16265f'],
 ['color-block','Renk Bloku','colorblock',RED,'#fff',BLUE],
 ['understated','Sessiz Etiket','understated','#eef2ff',BLUE,'#8aa2ff'],
 ['ticket-line','Bilet Rozet','ticket','#fff',BLUE,RED]
].map(([id,name,variant,bg,text,accent])=>({id,name,variant,bg,text,accent}));
const PREMIUM_PREVIEW_TEMPLATES=[
 ['premium-aurora','Aurora Halo','#18204a','#ffffff','#a855f7'],
 ['premium-prism','Prizma Akışı','#16265f','#ffffff','#ff3366'],
 ['premium-nebula','Nebula Pulse','#171235','#ffffff','#e879f9'],
 ['premium-liquid','Sıvı Krom','#243a8b','#ffffff','#22d3ee'],
 ['premium-photon','Foton Rayı','#0f1f4d','#ffffff','#06b6d4'],
 ['premium-hologram','Hologram Shift','#f3f4ff','#243a8b','#d946ef'],
 ['premium-comet','Comet Orbit','#172554','#ffffff','#22d3ee'],
 ['premium-spectrum','Spektrum Taç','#243a8b','#ffffff','#f43f5e'],
 ['premium-quantum','Kuantum Cam','#36457d','#ffffff','#a78bfa'],
 ['premium-electric','Elektrik Çerçeve','#101b45','#ffffff','#00f5ff'],
 ['premium-elite-obsidian','Obsidyen Altın','#111216','#fffdf7','#d9b45b','◆'],
 ['premium-elite-sapphire-glass','Safir Cam','#0b2f6b','#ffffff','#63d8ff','✦'],
 ['premium-elite-platinum','Fırçalı Platin','#d7dbe1','#18233f','#ffffff','◇'],
 ['premium-elite-emerald','Zümrüt Saten','#064d42','#ffffff','#75e0bd','✣'],
 ['premium-elite-ruby','Yakut Lake','#7d1328','#ffffff','#f1a6a2','♦'],
 ['premium-elite-marble','Fildişi Mermer','#f4f0e7','#2a3247','#b99b62','◈'],
 ['premium-elite-carbon','Karbon Grafit','#20242c','#ffffff','#6ca8ff','⌁'],
 ['premium-elite-champagne-silk','Şampanya İpek','#e8d7b4','#4b3822','#fff7e5','✧'],
 ['premium-elite-midnight-chrome','Gece Kromu','#101a33','#ffffff','#9eb7e7','✦'],
 ['premium-elite-amethyst','Ametist Kadife','#4d236d','#ffffff','#d5a8ff','◆'],
 ['premium-elite-titanium','Titanyum Kenar','#414952','#ffffff','#73e2d1','▰'],
 ['premium-elite-onyx-rose','Oniks Rose','#181419','#ffffff','#d69b9b','◇'],
 ['premium-elite-pearl-lustre','İnci Işıltısı','#f5f3f5','#3e344b','#b598d1','○'],
 ['premium-elite-cobalt','Kobalt Mine','#1439a1','#ffffff','#dbe7ff','✹'],
 ['premium-elite-bronze','Bronz Atelier','#5a3525','#ffffff','#cf9b63','A'],
 ['premium-elite-arctic','Arktik Kristal','#e9f3f6','#214454','#77bfd4','❋'],
 ['premium-elite-forest','Orman Derisi','#243d2d','#ffffff','#c1a36d','♧'],
 ['premium-elite-bordeaux','Bordo Mühür','#641e32','#ffffff','#e1b28f','♛'],
 ['premium-elite-porcelain-blue','Porselen Mavi','#f5f7fb','#203f79','#668ecf','P'],
 ['premium-elite-aurora-black','Aurora Siyah','#101318','#ffffff','#7ee7d7','✦'],
 ['premium-elite-signature-ivory','İmza Fildişi','#f7f3e9','#54462f','#b28a3f','★'],
 ['premium-elite-bevel-silver','Kesim Gümüş','#c8cbd0','#20242b','#6f747c','♛'],
 ['premium-elite-botanical-marble','Botanik Mermer','#f5f5f0','#365725','#7a9a58','◖'],
 ['premium-elite-ribbon-crimson','Kızıl Kurdele','#8f1724','#fff7f1','#d9a0a4','◆'],
 ['premium-elite-carved-walnut','Oyma Ceviz','#704427','#fff0cc','#b57a45','♧'],
 ['premium-elite-resin-glass','Buzlu Reçine','#dce5eb','#48515a','#ffffff','✦'],
 ['premium-elite-embossed-leather','Kabartma Deri','#222326','#d8d0c4','#77716a','♛'],
 ['premium-elite-etched-copper','İşlemeli Bakır','#b96f4f','#4a2117','#e8aa83','◇'],
 ['premium-elite-origami-white','Origami Beyaz','#f6f6f4','#32363d','#c9ccd0','✦'],
 ['premium-elite-diamond-mirror','Ayna Kesim','#e5e7e8','#171a1e','#ffffff','◆'],
 ['premium-elite-concrete-inlay','Beton Kakma','#b8b8b3','#343431','#e5ded2','■'],
 ['premium-elite-woven-royal','Dokuma Kraliyet','#173e92','#ffe6a5','#d8a439','♛'],
 ['premium-elite-gunmetal-port','Delikli Gunmetal','#555b5f','#f5f5f2','#a7adb0','⌁'],
 ['premium-elite-organic-stone','Organik Taş','#d8c3a5','#634f37','#a9845d','★'],
 ['premium-elite-puzzle-alloy','Mozaik Alaşım','#b6b5b2','#25282c','#d49b73','◆'],
 ['premium-elite-minimal-frame','Minimal Çerçeve','#ffffff','#16191e','#16191e','☆'],
 ['premium-elite-lenticular','Lentiküler Cam','#e5e4ed','#2d3139','#b9d9da','★'],
 ['premium-elite-layered-edge','Katmanlı Kenar','#c8b8a0','#3e3428','#eee4d2','≋'],
 ['premium-elite-diamond-cut','Elmas Kesim','#f5f4ef','#2d3238','#aadbea','◇'],
 ['premium-elite-wood-glass','Ahşap Cam','#d8e4e5','#3e4d4c','#8a5635','◆']
].map(([id,name,bg,text,accent,mark])=>({id,name,variant:'',bg,text,accent,mark}));
const ACTIVE_ELITE_IDS=new Set(PREMIUM_PREVIEW_TEMPLATES.filter(t=>t.id.startsWith('premium-elite-')).map(t=>t.id));

const ICONS={none:'',award:'◆',crown:'♛',star:'★',medal:'◉',trophy:'♜',fire:'◆',sparkles:'✦',bolt:'ϟ',heart:'♥',gem:'⬥',ribbon:'⌑',trend:'↗',tag:'◇',cart:'▣',leaf:'◖',diamond:'◆',check:'✓',target:'◎',rocket:'▲'};
const LEGACY_PREMIUM={premium1:'premium-crown-orbit',premium2:'premium-trophy-glow',premium3:'premium-medal-spin',premium4:'premium-flame-winner',premium5:'premium-diamond-shine',premium6:'premium-rocket-rank',premium7:'premium-crown-orbit',premium8:'premium-trophy-glow',premium9:'premium-diamond-shine'};
let state={config:structuredClone(DEFAULT),categories:[],analytics:{},device:'desktop',view:'category',selectedCategory:0,dirty:false,undo:[],redo:[]};

function ensureV3Assets(){
 if(!document.querySelector('link[href^="/admin-v3.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/admin-v3.css?v=20260913-5';document.head.appendChild(l);}
 const logo=document.querySelector('#btnBrandHome img'); if(logo){logo.src='/the-goatz-studio-logo.png?v=20260913-1';logo.className='ky-brand-image';logo.removeAttribute('style');}
 const favicon=document.querySelector('link[rel="icon"]'); if(favicon){favicon.href='/favicon.png?v=20260913-1';favicon.type='image/png';}
 const copy=byId('btnCopyCode'); if(copy){copy.textContent='Kurulum otomatik';copy.disabled=true;copy.title='Rozetler uygulama tarafından otomatik uygulanır.';}
}
async function api(path,opts={}){const url=new URL(path,API); if(!url.searchParams.has('shop'))url.searchParams.set('shop',shop);const init={...opts,headers:{...(opts.headers||{})}};if(init.body&&typeof init.body!=='string'){init.headers['Content-Type']='application/json';init.body=JSON.stringify({...init.body,shop});}const r=await fetch(url.toString(),init);let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.message||data.error||('HTTP '+r.status));return data;}
function migrateRetiredPremiumTemplates(value){if(!value||typeof value!=='object')return value;for(const [key,item] of Object.entries(value)){if(key==='templateId'&&typeof item==='string'&&item.startsWith('premium-elite-')&&!ACTIVE_ELITE_IDS.has(item))value[key]='premium-elite-obsidian';else if(item&&typeof item==='object')migrateRetiredPremiumTemplates(item)}return value;}
function normalizeConfig(raw){const c=migrateRetiredPremiumTemplates(deepMerge(DEFAULT,raw||{}));if(!c.texts.productText)c.texts.productText=c.texts.rankOtherText||c.texts.rank1Text||DEFAULT.texts.productText;if(c.styling.fontSize==null)c.styling.fontSize=12;if(c.styling.useStoreThemeFont==null)c.styling.useStoreThemeFont=true;c.ranking.maxRank=clamp(c.ranking.maxRank||3,1,20);c.rules.hideIfRankAbove=clamp(c.rules.hideIfRankAbove||20,1,20);return c;}
async function init(){ensureV3Assets();buildAllPanels();mountAccordion();bindGlobal();closePanels();sessionStorage.removeItem('ky-active-panel');try{const data=await api('/api/admin/settings');state.config=normalizeConfig(data.draftConfig);state.categories=Array.isArray(data.categories)?data.categories:[];state.analytics=data.analytics||{};state.dirty=!!data.hasUnpublishedChanges;setConnection(true,data.shop||shop);}catch(e){state.config=structuredClone(DEFAULT);setConnection(false,shop);toast('Ayarlar alınamadı: '+e.message,'error');}renderAll();}
function setConnection(ok,label){const old=byId('connectionStatus');if(!old)return;old.className='ky-connection'+(ok?' connected':'');old.innerHTML=`<span class="ky-connection-dot"></span><span class="ky-connection-copy"><strong>${ok?'Bağlı':'Bağlantı kontrol ediliyor'}</strong><span>${esc(label||shop)}</span></span>`;}
function buildAllPanels(){
 panel('panelRanking','Sıralama Sistemi & Hesaplama',`<div class="ky-group"><div class="ky-field"><label class="ky-label">Hesaplama Dönemi</label><select class="ky-select" id="v3Period"><option value="7days">Son 7 Gün</option><option value="30days">Son 30 Gün</option><option value="90days">Son 90 Gün</option><option value="365days">Son 365 Gün</option><option value="all_time">Tüm Zamanlar</option></select></div><div class="ky-field"><label class="ky-label">Sıralama Ölçütü</label><select class="ky-select" id="v3Metric"><option value="quantity">Satılan Ürün Adedi</option><option value="orders">Sipariş Sayısı</option><option value="revenue">Toplam Ciro</option><option value="category_share">Kategori İçi Satış Payı</option></select></div><div class="ky-field"><label class="ky-label">Maksimum Rozet Limiti <span class="value" id="v3MaxRankVal">3</span></label><input class="ky-slider" id="v3MaxRank" type="range" min="1" max="20" step="1"></div>${toggleHtml('v3Stock','Stokta olmayanları çıkar')}${toggleHtml('v3Refund','İptal / iade siparişleri hariç tut')}</div>`);
 panel('panelTemplates','Şablon Galerisi',`<div class="ky-inline-help" style="margin-bottom:10px">Önce mağazanızın tema kabuğunu seçin. Kategori ve ürün detay önizlemeleri aynı tema yapısını paylaşır.</div><div class="ky-theme-adapter"><label class="ky-label">Mağaza teması</label><select class="ky-select" id="v3Theme"><option value="ozy">Ozy — ikas mağaza teması</option><option value="minimal">Minimal — sade mağaza teması</option><option value="editorial">Editorial — dergi tipi tema</option><option value="classic">Classic — klasik e-ticaret teması</option></select><div class="ky-inline-help">Seçilen tema hem kategori hem ürün sayfası önizlemesine uygulanır.</div></div><div id="v3Templates" class="ky-template-gallery-v3"></div><div id="v3TemplateEditor"></div>`);
 panel('panelTexts','Metinler & Dinamik Değişkenler',`<div class="ky-group"><div class="ky-field"><label class="ky-label">Ürün Metni</label><input class="ky-input" id="v3ProductText" placeholder="En Çok Satan {rank}. Ürün"><div class="ky-inline-help">Tek metin tüm sıralar için kullanılır. Örn. {rank} → 1, 2, 3 … 20.</div></div><div class="ky-field"><label class="ky-label">Ürün Detay Kategori Başlığı</label><input class="ky-input" id="v3PdpPrefix" placeholder="{category} Kategorisinde"></div><div class="ky-field"><label class="ky-label">Ürün Detay Rozet Metni</label><input class="ky-input" id="v3PdpBadge" placeholder="En Çok Satan {rank}. Ürün"></div><div class="ky-inline-help">Kullanılabilir: <code>{rank}</code> <code>{category}</code> <code>{product}</code> <code>{sales}</code> <code>{period}</code></div></div>`);
 panel('panelTypography','Tipografi & Yazı Fontu',`<div class="ky-theme-font-bar"><div><strong>Tema fontunu kullan</strong><small>Mağazanızın mevcut fontunu otomatik miras alır.</small></div>${switchOnly('v3ThemeFont')}</div><div class="ky-font-controls" id="v3FontControls"><div class="ky-group"><div class="ky-field"><label class="ky-label">Google Fonts</label><input class="ky-input ky-font-search" id="v3FontSearch" placeholder="Font ara…"><select class="ky-select" id="v3Font" size="8" style="height:190px"></select><div class="ky-font-count" id="v3FontCount">Google Fonts yükleniyor…</div></div></div></div><div class="ky-group"><div class="ky-field"><label class="ky-label">Font Boyutu <span class="value" id="v3FontSizeVal"></span></label><input class="ky-slider" id="v3FontSize" type="range" min="8" max="28" step="1"></div><div class="ky-field"><label class="ky-label">Font Ağırlığı</label><select class="ky-select" id="v3FontWeight"><option value="400">Regular 400</option><option value="500">Medium 500</option><option value="600">SemiBold 600</option><option value="700">Bold 700</option><option value="800">ExtraBold 800</option></select></div></div>`);
 panel('panelIcons','İkon Kütüphanesi',`<div class="ky-group"><div class="ky-toggle-wrap"><span>İkon göster</span>${switchOnly('v3IconEnabled')}</div><div class="ky-icon-grid" id="v3Icons"></div><div class="ky-icon-editor"><div class="ky-field"><label class="ky-label">İkon Stili</label><div class="ky-segment"><button id="v3IconMono" type="button">Siyah / Beyaz</button><button id="v3IconColor" type="button">Renkli</button></div></div><div class="ky-two-col" id="v3IconColors"></div><div class="ky-field"><label class="ky-label">İkon Boyutu <span class="value" id="v3IconSizeVal"></span></label><input class="ky-slider" id="v3IconSize" type="range" min="8" max="32" step="1"></div></div></div>`);
 panel('panelColors','Arka Plan, Renkler & Gradyan',`<div class="ky-group">${colorField('v3Bg','Rozet Arka Planı')}${colorField('v3TextColor','Metin Rengi')}${colorField('v3Accent','Vurgu Rengi')}<div class="ky-toggle-wrap"><span>Gradyan kullan</span>${switchOnly('v3Gradient')}</div><div id="v3GradientFields">${colorField('v3Grad1','Gradyan 1')}${colorField('v3Grad2','Gradyan 2')}<div class="ky-field"><label class="ky-label">Gradyan Açısı <span class="value" id="v3GradAngleVal"></span></label><input class="ky-slider" id="v3GradAngle" type="range" min="0" max="360" step="1"></div></div></div>`);
 panel('panelBorders','Çerçeve & Gölge',`<div class="ky-group">${colorField('v3BorderColor','Çerçeve Rengi')}<div class="ky-field"><label class="ky-label">Köşe Yuvarlaklığı <span class="value" id="v3RadiusVal"></span></label><input class="ky-slider" id="v3Radius" type="range" min="0" max="40"></div><div class="ky-field"><label class="ky-label">Çerçeve Kalınlığı <span class="value" id="v3BorderWidthVal"></span></label><input class="ky-slider" id="v3BorderWidth" type="range" min="0" max="8" step="1"></div><div class="ky-field"><label class="ky-label">Gölge</label><select class="ky-select" id="v3Shadow"><option value="none">Yok</option><option value="soft">Yumuşak</option><option value="medium">Orta</option><option value="strong">Belirgin</option><option value="glow">Glow</option></select></div><div class="ky-field"><label class="ky-label">Opaklık <span class="value" id="v3OpacityVal"></span></label><input class="ky-slider" id="v3Opacity" type="range" min="10" max="100"></div></div>`);
 panel('panelSizing','Boyutlar & Boşluklar',`<div class="ky-group"><div class="ky-field"><label class="ky-label">Yatay İç Boşluk <span class="value" id="v3PadXVal"></span></label><input class="ky-slider" id="v3PadX" type="range" min="0" max="30"></div><div class="ky-field"><label class="ky-label">Dikey İç Boşluk <span class="value" id="v3PadYVal"></span></label><input class="ky-slider" id="v3PadY" type="range" min="0" max="20"></div><div class="ky-field"><label class="ky-label">Rozet Ölçeği <span class="value" id="v3ScaleVal"></span></label><input class="ky-slider" id="v3Scale" type="range" min="50" max="180"></div></div>`);
panel('panelPosition','Konumlandırma',`<div class="ky-group"><div class="ky-field"><label class="ky-label">Ürün Kartı Konumu</label><select class="ky-select" id="v3CardLocation"><option value="image_overlay">Görsel Köşesi / Üzeri</option><option value="image_bottom_bar">Görsel Alt Şeridi</option><option value="image_inside_bottom_bar">Görsel İçinde Alt Şerit</option></select></div><div class="ky-field"><label class="ky-label">Konum Noktası</label><div class="ky-nine-grid" id="v3NineGrid">${[['top_left','↖'],['top_center','↑'],['top_right','↗'],['middle_left','←'],['center','•'],['middle_right','→'],['bottom_left','↙'],['bottom_center','↓'],['bottom_right','↘']].map(([v,l])=>`<button class="ky-grid-btn" data-pos="${v}" type="button">${l}</button>`).join('')}</div></div><div class="ky-two-col"><div class="ky-field"><label class="ky-label">Yatay X <span class="value" id="v3OffsetXVal"></span></label><input class="ky-slider" id="v3OffsetX" type="range" min="-50" max="50"></div><div class="ky-field"><label class="ky-label">Dikey Y <span class="value" id="v3OffsetYVal"></span></label><input class="ky-slider" id="v3OffsetY" type="range" min="-50" max="50"></div></div></div>`);
 panel('panelAnimation','Animasyonlar',`<div class="ky-group"><div class="ky-inline-help" style="margin-bottom:9px">Hover kaldırıldı. Premium şablonların materyal ve ikon hareketleri masaüstü ile mobilde sürekli çalışır.</div><div class="ky-field"><label class="ky-label">Giriş Animasyonu</label><select class="ky-select" id="v3Entry"><option value="none">Yok</option><option value="fade">Fade</option><option value="slide-up">Aşağıdan Gel</option><option value="slide-down">Yukarıdan Gel</option><option value="slide-left">Sağdan Gel</option><option value="pop">Pop</option><option value="flip">Flip</option><option value="bounce">Bounce</option></select></div><div class="ky-field"><label class="ky-label">Animasyon Süresi <span class="value" id="v3DurationVal"></span></label><input class="ky-slider" id="v3Duration" type="range" min="100" max="1200" step="50"></div></div>`);
 panel('panelResponsive','Responsive (Masaüstü / Mobil)',`<div class="ky-group">${toggleHtml('v3Desktop','Masaüstünde göster')}${toggleHtml('v3Mobile','Mobilde göster')}<div class="ky-field"><label class="ky-label">Mobil Rozet Ölçeği <span class="value" id="v3MobileScaleVal"></span></label><input class="ky-slider" id="v3MobileScale" type="range" min="50" max="130"></div><div class="ky-field"><label class="ky-label">Mobil Font Farkı <span class="value" id="v3MobileFontVal"></span></label><input class="ky-slider" id="v3MobileFont" type="range" min="-6" max="6"></div></div>`);
 panel('panelCategories','Kategoriler & Sıralamalar',`<div class="ky-category-intro"><strong>Bu bölüm ne yapar?</strong><br>1. ikas kategorilerinizi ve satış sırasını otomatik getirir.<br>2. Sistem seçtiğiniz döneme göre ürünleri sıralar.<br>3. İsterseniz bir ürünü belirli sıraya sabitleyebilir veya rozetini gizleyebilirsiniz.</div><button class="ky-btn ky-btn-secondary" id="v3Sync" style="width:100%;margin-bottom:10px">↻ TheGoatz verilerini şimdi senkronize et</button><div id="v3Categories"></div>`);
 panel('panelRules','Gelişmiş Görünürlük Kuralları',`<div class="ky-group">${toggleHtml('v3HideDiscount','İndirimli ürünlerde gizle')}${toggleHtml('v3HideNew','Yeni ürünlerde gizle')}<div class="ky-field"><label class="ky-label">Bu sıradan sonrasını gizle <span class="value" id="v3HideRankVal"></span></label><input class="ky-slider" id="v3HideRank" type="range" min="1" max="20"></div><div class="ky-field"><label class="ky-label">Minimum satış adedi</label><input class="ky-input" id="v3MinSales" type="number" min="0" max="9999"></div></div>`);
 panel('panelPlacement','Mağazada Gösterim',`<div class="ky-group"><div class="ky-inline-help" style="margin-bottom:9px">Uygulama kod yapıştırmadan çalışacak şekilde hazırlanır. Seçtiğiniz alanlardaki uygun ürün kartlarına rozet otomatik uygulanır.</div>${toggleHtml('v3Home','Ana sayfa ürün kartları')}${toggleHtml('v3Category','Kategori sayfaları')}${toggleHtml('v3Search','Arama sonuçları')}${toggleHtml('v3Pdp','Ürün detay sayfası')}<div style="margin-top:12px;padding:11px;border:1px solid rgba(18,183,106,.2);background:#ecfdf3;border-radius:10px;color:#067647;font-size:10px;font-weight:700">● Kurulum modeli: otomatik storefront entegrasyonu</div></div>`);
 enhanceProfileAndSupport();
}
function panel(id,title,body){const p=byId(id);if(!p)return;p.innerHTML=`<div class="ky-subpanel-header"><button class="ky-btn-back" type="button">← Geri</button><div class="ky-subpanel-title">${title}</div></div>${body}`;}
function mountAccordion(){const menu=byId('menuList');if(!menu)return;[...menu.querySelectorAll('.ky-menu-card')].forEach(card=>{const panel=byId(card.dataset.target);card.setAttribute('role','button');card.setAttribute('tabindex','0');card.setAttribute('aria-expanded','false');card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPanel(card.dataset.target);}});const indicator=card.lastElementChild;if(indicator){indicator.className='ky-accordion-indicator';indicator.innerHTML='<i></i><i></i><i></i>';}if(panel){panel.classList.add('ky-accordion-panel');menu.insertBefore(panel,card.nextSibling);}});}
function toggleHtml(id,label){return `<div class="ky-toggle-wrap"><span>${label}</span>${switchOnly(id)}</div>`}
function switchOnly(id){return `<label class="ky-switch"><input type="checkbox" id="${id}"><span class="ky-switch-slider"></span></label>`}
function colorField(id,label){return `<div class="ky-field"><label class="ky-label">${label}</label><div class="ky-color-row"><input type="color" id="${id}Picker"><input class="ky-input" type="text" id="${id}Hex" maxlength="7" placeholder="#243a8b"></div></div>`}
function enhanceProfileAndSupport(){const pd=byId('profileDialog');if(pd){pd.className='ky-modal';pd.innerHTML=`<div class="ky-modal-head"><div><h3>Profilim</h3><p>İletişim profiliniz mağazanıza bağlı olarak saklanır.</p></div><button class="ky-btn-icon-only" data-close-dialog="profileDialog" type="button">×</button></div><div class="ky-modal-body"><div class="ky-two-col"><div class="ky-field"><label class="ky-label">Mağaza</label><input class="ky-input" id="v3ProfileStore" disabled value="${esc(shop)}"></div><div class="ky-field"><label class="ky-label">Yetkili Ad Soyad</label><input class="ky-input" id="v3ProfileName"></div><div class="ky-field"><label class="ky-label">E-posta</label><input class="ky-input" id="v3ProfileEmail" type="email"></div><div class="ky-field"><label class="ky-label">Telefon</label><input class="ky-input" id="v3ProfilePhone"></div></div><div class="ky-field"><label class="ky-label">Görev / Ünvan</label><input class="ky-input" id="v3ProfileRole"></div><div class="ky-profile-error" id="v3ProfileError"></div><div style="display:flex;justify-content:flex-end;gap:7px;margin-top:14px"><button class="ky-btn ky-btn-secondary" data-close-dialog="profileDialog" type="button">Vazgeç</button><button class="ky-btn ky-btn-publish" id="v3ProfileSave" type="button">Profili kaydet</button></div></div>`;}const sd=byId('supportDialog');if(sd){sd.className='ky-modal';sd.innerHTML=`<div class="ky-modal-head"><div><h3>Yardım & Destek</h3><p>Talebiniz hello@thegoatzstudio.com destek akışına iletilir.</p></div><button class="ky-btn-icon-only" data-close-dialog="supportDialog" type="button">×</button></div><div class="ky-modal-body"><div class="ky-support-note">Destek yanıtları profilinizde kayıtlı e-posta adresine gönderilir.</div><div class="ky-field"><label class="ky-label">Konu türü</label><select class="ky-select" id="v3SupportCategory"><option value="TECHNICAL">Teknik sorun</option><option value="SETUP">Kurulum</option><option value="FEATURE">Özellik talebi</option><option value="PAYMENT">Ödeme</option><option value="COMPLAINT">Şikayet</option><option value="OTHER">Diğer</option></select></div><div class="ky-field"><label class="ky-label">Konu</label><input class="ky-input" id="v3SupportSubject" maxlength="120"></div><div class="ky-field"><label class="ky-label">Mesaj</label><textarea class="ky-textarea" id="v3SupportMessage" maxlength="3000" rows="7"></textarea></div><div class="ky-profile-error" id="v3SupportError"></div><div style="display:flex;justify-content:flex-end;gap:7px;margin-top:14px"><button class="ky-btn ky-btn-secondary" data-close-dialog="supportDialog" type="button">Vazgeç</button><button class="ky-btn ky-btn-publish" id="v3SupportSend" type="button">Destek talebi gönder</button></div></div>`;}}
function bindGlobal(){document.querySelectorAll('.ky-menu-card').forEach(card=>card.onclick=()=>openPanel(card.dataset.target));document.addEventListener('click',e=>{const b=e.target.closest('.ky-btn-back');if(b){closePanels();sessionStorage.removeItem('ky-active-panel');}const c=e.target.closest('[data-close-dialog]');if(c)byId(c.dataset.closeDialog)?.close();});document.querySelectorAll('.ky-device-btn').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.ky-device-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.device=btn.dataset.device;byId('stageCanvas')?.classList.toggle('mobile-view',state.device==='mobile');renderPreview();});document.querySelectorAll('.ky-view-tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.ky-view-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.view=btn.dataset.view;renderPreview();});byId('previewCategorySelect')?.addEventListener('change',e=>{state.selectedCategory=Number(e.target.value)||0;renderPreview();});byId('btnUndo')?.addEventListener('click',undo);byId('btnRedo')?.addEventListener('click',redo);byId('btnResetDefault')?.addEventListener('click',()=>{if(confirm('Tüm ayarlar varsayılana dönsün mü?')){pushUndo();state.config=structuredClone(DEFAULT);state.dirty=true;renderAll();}});byId('btnSaveDraft')?.addEventListener('click',saveDraft);byId('btnPublish')?.addEventListener('click',publish);byId('btnProfile')?.addEventListener('click',async()=>{await loadProfile();byId('profileDialog')?.showModal();});byId('btnSupport')?.addEventListener('click',()=>byId('supportDialog')?.showModal());setTimeout(bindPanelControls,0);}
function bindPanelControls(){bindSelect('v3Theme','themeId');bindSelect('v3Period','ranking.period');bindSelect('v3Metric','ranking.metric');bindRange('v3MaxRank','ranking.maxRank','v3MaxRankVal','');bindCheck('v3Stock','ranking.excludeOutOfStock');bindCheck('v3Refund','ranking.excludeRefunded');bindInput('v3ProductText','texts.productText');bindInput('v3PdpPrefix','texts.pdpPrefixText');bindInput('v3PdpBadge','texts.pdpBadgeText');bindCheck('v3ThemeFont','styling.useStoreThemeFont',()=>updateFontUI());bindSelect('v3Font','styling.fontFamily',v=>loadFont(v));bindRange('v3FontSize','styling.fontSize','v3FontSizeVal',' px');bindSelect('v3FontWeight','styling.fontWeight',v=>Number(v));bindCheck('v3IconEnabled','icon.enabled');bindRange('v3IconSize','icon.size','v3IconSizeVal',' px');bindColor('v3Bg','styling.bgColor');bindColor('v3TextColor','styling.textColor');bindColor('v3Accent','styling.accentColor');bindCheck('v3Gradient','styling.gradientEnabled',updateGradientUI);bindColor('v3Grad1','styling.gradientColor1');bindColor('v3Grad2','styling.gradientColor2');bindRange('v3GradAngle','styling.gradientAngle','v3GradAngleVal','°');bindColor('v3BorderColor','styling.borderColor');bindRange('v3Radius','styling.borderRadius','v3RadiusVal',' px');bindRange('v3BorderWidth','styling.borderWidth','v3BorderWidthVal',' px');bindSelect('v3Shadow','styling.shadow');bindRange('v3Opacity','styling.opacity','v3OpacityVal','%');bindRange('v3PadX','styling.paddingX','v3PadXVal',' px');bindRange('v3PadY','styling.paddingY','v3PadYVal',' px');bindRange('v3Scale','styling.scale','v3ScaleVal','%');bindSelect('v3CardLocation','placements.cardLocation');bindRange('v3OffsetX','placements.offsetX','v3OffsetXVal',' px');bindRange('v3OffsetY','placements.offsetY','v3OffsetYVal',' px');bindSelect('v3Entry','animation.entry');bindSelect('v3Hover','animation.hover');bindRange('v3Duration','animation.durationMs','v3DurationVal',' ms');bindCheck('v3Desktop','responsive.desktopEnabled');bindCheck('v3Mobile','responsive.mobileEnabled');bindRange('v3MobileScale','responsive.mobileBadgeScale','v3MobileScaleVal','%');bindRange('v3MobileFont','responsive.mobileFontSizeOffset','v3MobileFontVal',' px');bindCheck('v3HideDiscount','rules.hideIfDiscounted');bindCheck('v3HideNew','rules.hideIfNewProduct');bindRange('v3HideRank','rules.hideIfRankAbove','v3HideRankVal','');bindInput('v3MinSales','ranking.minSalesThreshold',v=>Number(v));bindCheck('v3Home','placements.homeCards');bindCheck('v3Category','placements.categoryCards');bindCheck('v3Search','placements.searchResults');bindCheck('v3Pdp','placements.productDetail');byId('v3NineGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-pos]');if(!b)return;change('placements.ninePointPosition',b.dataset.pos);renderPositionButtons();});byId('v3IconMono')?.addEventListener('click',()=>{change('icon.mode','mono');renderIconEditor();});byId('v3IconColor')?.addEventListener('click',()=>{change('icon.mode','color');renderIconEditor();});byId('v3Sync')?.addEventListener('click',syncRankings);byId('v3ProfileSave')?.addEventListener('click',saveProfile);byId('v3SupportSend')?.addEventListener('click',sendSupport);byId('v3FontSearch')?.addEventListener('input',e=>filterFonts(e.target.value));}
function bindSelect(id,path,cast=v=>v){const el=byId(id);if(!el)return;el.onchange=()=>change(path,cast(el.value));}
function bindInput(id,path,cast=v=>v){const el=byId(id);if(!el)return;el.oninput=()=>change(path,cast(el.value));}
function bindCheck(id,path,after){const el=byId(id);if(!el)return;el.onchange=()=>{change(path,el.checked);after?.();}}
function bindRange(id,path,valId,suffix){const el=byId(id);if(!el)return;el.oninput=()=>{change(path,Number(el.value),false);const v=byId(valId);if(v)v.textContent=el.value+suffix;};el.onchange=()=>state.dirty=true;}
function bindColor(id,path){const p=byId(id+'Picker'),h=byId(id+'Hex');if(!p||!h)return;p.oninput=()=>{h.value=p.value;change(path,p.value,false)};h.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(h.value)){p.value=h.value;change(path,h.value,false)}};}
function pushUndo(){state.undo.push(JSON.stringify(state.config));if(state.undo.length>40)state.undo.shift();state.redo=[];}
function change(path,val,withUndo=true){if(withUndo)pushUndo();setPath(state.config,path,val);state.dirty=true;updateStatus();renderPreview();}
function undo(){if(!state.undo.length)return;state.redo.push(JSON.stringify(state.config));state.config=JSON.parse(state.undo.pop());state.dirty=true;renderAll();toast('Geri alındı');}
function redo(){if(!state.redo.length)return;state.undo.push(JSON.stringify(state.config));state.config=JSON.parse(state.redo.pop());state.dirty=true;renderAll();toast('Yinelendi');}
function renderAll(){fillControls();renderTemplates();renderIcons();renderCategories();renderPreviewSelectors();renderPositionButtons();updateFontUI();updateGradientUI();renderPreview();updateStatus();loadGoogleFonts();}
function fillControls(){const c=state.config;const map={v3Theme:c.themeId||'ozy',v3Period:c.ranking.period,v3Metric:c.ranking.metric,v3MaxRank:c.ranking.maxRank,v3ProductText:c.texts.productText,v3PdpPrefix:c.texts.pdpPrefixText,v3PdpBadge:c.texts.pdpBadgeText,v3ThemeFont:c.styling.useStoreThemeFont,v3Font:c.styling.fontFamily,v3FontSize:c.styling.fontSize,v3FontWeight:String(c.styling.fontWeight),v3IconEnabled:c.icon.enabled,v3IconSize:c.icon.size,v3Gradient:c.styling.gradientEnabled,v3GradAngle:c.styling.gradientAngle,v3Radius:c.styling.borderRadius,v3BorderWidth:c.styling.borderWidth,v3Shadow:c.styling.shadow,v3Opacity:c.styling.opacity,v3PadX:c.styling.paddingX,v3PadY:c.styling.paddingY,v3Scale:c.styling.scale,v3CardLocation:c.placements.cardLocation,v3OffsetX:c.placements.offsetX,v3OffsetY:c.placements.offsetY,v3Entry:c.animation.entry,v3Hover:c.animation.hover,v3Duration:c.animation.durationMs,v3Desktop:c.responsive.desktopEnabled,v3Mobile:c.responsive.mobileEnabled,v3MobileScale:c.responsive.mobileBadgeScale,v3MobileFont:c.responsive.mobileFontSizeOffset,v3HideDiscount:c.rules.hideIfDiscounted,v3HideNew:c.rules.hideIfNewProduct,v3HideRank:c.rules.hideIfRankAbove,v3MinSales:c.ranking.minSalesThreshold,v3Home:c.placements.homeCards,v3Category:c.placements.categoryCards,v3Search:c.placements.searchResults,v3Pdp:c.placements.productDetail,v3Stock:c.ranking.excludeOutOfStock,v3Refund:c.ranking.excludeRefunded};Object.entries(map).forEach(([id,v])=>{const el=byId(id);if(!el)return;if(el.type==='checkbox')el.checked=!!v;else el.value=v??'';});[['v3MaxRankVal',c.ranking.maxRank,''],['v3FontSizeVal',c.styling.fontSize,' px'],['v3IconSizeVal',c.icon.size,' px'],['v3GradAngleVal',c.styling.gradientAngle,'°'],['v3RadiusVal',c.styling.borderRadius,' px'],['v3BorderWidthVal',c.styling.borderWidth,' px'],['v3OpacityVal',c.styling.opacity,'%'],['v3PadXVal',c.styling.paddingX,' px'],['v3PadYVal',c.styling.paddingY,' px'],['v3ScaleVal',c.styling.scale,'%'],['v3OffsetXVal',c.placements.offsetX,' px'],['v3OffsetYVal',c.placements.offsetY,' px'],['v3DurationVal',c.animation.durationMs,' ms'],['v3MobileScaleVal',c.responsive.mobileBadgeScale,'%'],['v3MobileFontVal',c.responsive.mobileFontSizeOffset,' px'],['v3HideRankVal',c.rules.hideIfRankAbove,'']].forEach(([id,v,s])=>{if(byId(id))byId(id).textContent=v+s});[['v3Bg','styling.bgColor'],['v3TextColor','styling.textColor'],['v3Accent','styling.accentColor'],['v3Grad1','styling.gradientColor1'],['v3Grad2','styling.gradientColor2'],['v3BorderColor','styling.borderColor']].forEach(([id,p])=>setColor(id,getPath(c,p,'#243a8b')));}
function setColor(id,v){if(!/^#[0-9a-f]{6}$/i.test(v||''))v='#243a8b';if(byId(id+'Picker'))byId(id+'Picker').value=v;if(byId(id+'Hex'))byId(id+'Hex').value=v;}
function renderTemplates(){const host=byId('v3Templates');if(!host)return;host.innerHTML=TEMPLATES.map(t=>{const tc=templateColor(t),text=t.variant==='contour'?outlineTextColor(tc.text,tc.bg):tc.text;return `<button class="ky-template-card-v3 ${state.config.templateId===t.id?'active':''}" data-template="${t.id}" type="button"><span class="preview"><span class="ky-v3-badge ${t.variant} tpl-${t.id}" style="--badge-bg:${tc.bg};--badge-text:${text};--badge-accent:${tc.accent};--grad-a:${tc.bg};--grad-b:${tc.accent};font-size:9px;padding:5px 8px">${iconHtml('award',10)} <span>#1 Çok Satan</span></span></span><span class="name">${t.name}</span><span class="tag">Özgün</span></button>`}).join('');host.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>selectTemplate(b.dataset.template));renderTemplateEditor();}
function templateColor(t){return state.config.templateColors?.[t.id]||{bg:t.bg,text:t.text,accent:t.accent};}
function outlineTextColor(text,bg){const contrast=v=>{const m=/^#([0-9a-f]{6})$/i.exec(String(v||''));if(!m)return 0;const rgb=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));const l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return 1.05/(l+.05)};return contrast(text)>=3?text:contrast(bg)>=3?bg:'#17213a';}
function selectTemplate(id){const t=TEMPLATES.find(x=>x.id===id);if(!t)return;pushUndo();state.config.templateId=id;state.config.styling.gradientEnabled=false;state.dirty=true;updateStatus();renderTemplates();renderPreview();}
function renderTemplateEditor(){const host=byId('v3TemplateEditor');if(!host)return;const t=TEMPLATES.find(x=>x.id===state.config.templateId)||TEMPLATES[0];const c=templateColor(t);host.innerHTML=`<div class="ky-template-editor"><div class="ky-template-editor-title"><strong>${t.name} renkleri</strong><span>Yalnızca bu şablona uygulanır</span></div>${tplColor('tplBg','Ana Renk',c.bg)}${tplColor('tplText','Metin',c.text)}${tplColor('tplAccent','Vurgu / 2. Renk',c.accent)}</div>`;['Bg','Text','Accent'].forEach(k=>{const p=byId('tpl'+k+'Picker'),h=byId('tpl'+k+'Hex');const field=k==='Bg'?'bg':k==='Text'?'text':'accent';const apply=v=>{if(!state.config.templateColors)state.config.templateColors={};state.config.templateColors[t.id]={...templateColor(t),[field]:v};state.dirty=true;renderPreview();renderTemplatesNoEditor();};p.oninput=()=>{h.value=p.value;apply(p.value)};h.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(h.value)){p.value=h.value;apply(h.value)}};});}
function renderTemplatesNoEditor(){const host=byId('v3Templates');if(!host)return;host.querySelectorAll('[data-template]').forEach(b=>b.classList.toggle('active',b.dataset.template===state.config.templateId));}
function tplColor(id,label,v){return `<div class="ky-field"><label class="ky-label">${label}</label><div class="ky-color-row"><input id="${id}Picker" type="color" value="${v}"><input id="${id}Hex" class="ky-input" value="${v}"></div></div>`}
function renderIcons(){const host=byId('v3Icons');if(!host)return;const selected=normalizeIconType(state.config.icon.type);host.innerHTML=Object.keys(ICONS).map(k=>`<button class="ky-icon-choice ${selected===k?'active':''}" data-icon="${k}" type="button"><b style="font-size:18px">${ICONS[k]||'×'}</b><span>${k==='none'?'İkonsuz':k}</span></button>`).join('');host.querySelectorAll('[data-icon]').forEach(b=>b.onclick=()=>selectIcon(b.dataset.icon));renderIconEditor();}
function renderIconEditor(){byId('v3IconMono')?.classList.toggle('active',state.config.icon.mode!=='color');byId('v3IconColor')?.classList.toggle('active',state.config.icon.mode==='color');const host=byId('v3IconColors');if(host){host.innerHTML=state.config.icon.mode==='color'?`${colorField('v3IconC1','İkon Rengi 1')}${colorField('v3IconC2','İkon Rengi 2')}`:`${colorField('v3IconC1','İkon Rengi')}`;bindColor('v3IconC1','icon.color');setColor('v3IconC1',state.config/m<ۻh��춻�q�^uv3-mark',card).forEach(x=>x.remove())})}
function applyTemplateTab(){const host=q('#v3Templates'),tabs=q('[data-premium-tabs="templates"]');if(!host||!tabs)return;cleanStandardCards();ensurePremiumCards();qa('.ky-template-card-v3[data-template]',host).forEach(card=>{const premium=PREMIUM_IDS.has(card.dataset.template);card.hidden=templateTab==='premium'?!premium:premium;card.classList.toggle('active',card.dataset.template===currentTemplateId)});setTabActive(tabs,templateTab);host.classList.toggle('premium-open',templateTab==='premium')}
function ensureTemplateTabs(){const host=q('#v3Templates');if(!host)return;let tabs=q('[data-premium-tabs="templates"]');if(!tabs){tabs=makeTabs('templates','Şablonlar','Premium Şablonlar');host.parentNode.insertBefore(tabs,host);tabs.addEventListener('click',e=>{const b=e.target.closest('[data-premium-tab]');if(!b)return;templateTab=b.dataset.premiumTab==='premium'?'premium':'basic';sessionStorage.setItem('ky-premium-template-tab',templateTab);applyTemplateTab()})}ensurePremiumCards();applyTemplateTab()}

function editorHtml(id){const t=CUSTOM.find(x=>x.id===id),c=palettes[id],paid=PREMIUM_IDS.has(id);return `<div class="ky-template-editor ky-premium-editor-v3"><div class="ky-template-editor-title"><strong>${t.name} renkleri</strong><span>${paid?'Bu Premium şablona özel':'Standart şablon renkleri'}</span></div>${colorField('tplBg','Ana Renk',c.bg)}${colorField('tplText','Metin',c.text)}${colorField('tplAccent','Vurgu / Işık Rengi',c.accent)}</div>`}
function colorField(id,label,value){return `<div class="ky-field"><label class="ky-label">${label}</label><div class="ky-color-row"><input id="${id}Picker" type="color" value="${value}"><input id="${id}Hex" class="ky-input" value="${value}" maxlength="7"></div></div>`}
function renderPremiumEditor(force=false){
 if(!CUSTOM_IDS.has(currentTemplateId))return;
 const host=q('#v3TemplateEditor');if(!host)return;
 if(!force&&host.dataset.kyPremiumEditorId===currentTemplateId&&q('.ky-premium-editor-v3',host))return;
 host.dataset.kyPremiumEditorId=currentTemplateId;
 host.innerHTML=editorHtml(currentTemplateId);
 for(const [key,field] of [['Bg','bg'],['Text','text'],['Accent','accent']]){
  const p=q('#tpl'+key+'Picker'),h=q('#tpl'+key+'Hex');
  const apply=v=>{if(!/^#[0-9a-f]{6}$/i.test(v))return;palettes[currentTemplateId][field]=v;const c=palettes[currentTemplateId];window.handleInput?.(`templateColors.${currentTemplateId}`,{...c});updatePremiumCard(currentTemplateId);schedulePreview()};
  p.oninput=()=>{h.value=p.value;apply(p.value)};
  h.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(h.value)){p.value=h.value;apply(h.value)}};
 }
}
function updatePremiumCard(id){const card=q(`#v3Templates [data-template="${id}"]`),badge=q('.ky-v3-badge',card),c=palettes[id];applyPremiumIdentity(badge,id,c,false)}
function applyPremiumIdentity(el,id,c,storefront=false){
 if(!el)return;
 const prefix=storefront?'ky-tpl-':'tpl-',target=prefix+id;
 for(const cls of [...el.classList]){
  if(cls.startsWith(prefix+'premium-')&&cls!==target)el.classList.remove(cls);
  if(!storefront&&LEGACY_VARIANTS.includes(cls))el.classList.remove(cls);
 }
 el.classList.add(target);
 for(const [name,value] of [['--badge-bg',c.bg],['--badge-text',c.text],['--badge-accent',c.accent],['--p-bg',c.bg],['--p-text',c.text],['--p-accent',c.accent]]){
  if(el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);
 }
}
function selectPremium(id){
 if(!CUSTOM_IDS.has(id))return;
 currentTemplateId=id;templateTab=PREMIUM_IDS.has(id)?'premium':'basic';sessionStorage.setItem('ky-premium-template-tab',templateTab);
 applyTemplateTab();renderPremiumEditor(true);
 window.handleInput?.('templateId',id);
 enforcePlacement(id);
 schedulePreview();
}

function enforcePlacement(id=currentTemplateId){
 const t=PREMIUM.find(x=>x.id===id),select=q('#v3CardLocation');if(!select)return;
 const outside=[...select.options].find(o=>o.value==='image_bottom_bar');
 if(outside)outside.disabled=!!t?.insideOnly;
 let note=q('.ky-premium-placement-note');
 if(t?.insideOnly){
  if(!note){note=document.createElement('div');note.className='ky-inline-help ky-premium-placement-note';select.closest('.ky-field')?.appendChild(note)}
  if(note)note.textContent='Bu form ürün adını aşağı itmemesi için yalnızca görselin içinde alt şeritte kullanılır.';
  if(select.value==='image_bottom_bar'){select.value='image_inside_bottom_bar';window.handleInput?.('cardLocation','image_inside_bottom_bar');select.dispatchEvent(new Event('change',{bubbles:true}))}
 }else note?.remove();
}

function applyPreviewPremium(){
 if(processing||!CUSTOM_IDS.has(currentTemplateId))return;
 processing=true;
 try{
  const c=palettes[currentTemplateId];
  const source=q(`#v3Templates [data-template="${CSS.escape(currentTemplateId)}"] .ky-v3-badge`);
  applyPremiumIdentity(source,currentTemplateId,c,false);
  qa('#stageCanvas .ky-v3-badge').forEach(b=>{
   applyPremiumIdentity(b,currentTemplateId,c,false);
   const t=CUSTOM.find(x=>x.id===currentTemplateId);
   if(t?.mark&&!q(':scope > :not(.ky-badge-text)',b)&&b.dataset.iconEnabled!=='0'){
    const emblem=document.createElement('span');emblem.className='ky-premium-emblem';emblem.setAttribute('aria-hidden','true');emblem.textContent=t.mark;b.prepend(emblem);
   }
   if(b.style.color!==c.text)b.style.setProperty('color',c.text);
  });
  qa('#stageCanvas .ky-badge-root').forEach(b=>applyPremiumIdentity(b,currentTemplateId,c,true));
  const live=q('#stageCanvas .ky-v3-badge');
  if(live)document.dispatchEvent(new CustomEvent('ky:premium-template-applied',{detail:{id:currentTemplateId,html:live.outerHTML}}));
 }finally{processing=false}
}
function schedulePreview(){if(previewScheduled)return;previewScheduled=true;requestAnimationFrame(()=>{previewScheduled=false;applyPreviewPremium()})}
function observeStage(){const stage=q('#stageCanvas');if(!stage)return;stageObserver?.disconnect();stageObserver=new MutationObserver(records=>{if(processing||!CUSTOM_IDS.has(currentTemplateId))return;if(records.some(r=>r.addedNodes?.length||r.removedNodes?.length))schedulePreview()});stageObserver.observe(stage,{childList:true,subtree:true})}

function mergePaletteMap(map){if(!map||typeof map!=='object')return;CUSTOM.forEach(t=>{const c=map[t.id];if(c&&typeof c==='object')palettes[t.id]={...palettes[t.id],...c}})}
function wrapHandleInput(){
 if(wrapped||typeof window.handleInput!=='function')return;
 const original=window.handleInput;
 window.handleInput=function(path,val){
  if(path==='templateId'){
   if(typeof val==='string'&&val.startsWith('premium-elite-')&&!PREMIUM_IDS.has(val)){val='premium-elite-obsidian';arguments[1]=val}
   currentTemplateId=String(val||'');
   if(PREMIUM_IDS.has(currentTemplateId)){templateTab='premium';sessionStorage.setItem('ky-premium-template-tab','premium')}else if(currentTemplateId)templateTab='basic';
   enforcePlacement(currentTemplateId);
  }else if(path==='cardLocation'&&val==='image_bottom_bar'&&PREMIUM.find(x=>x.id===currentTemplateId)?.insideOnly){val='image_inside_bottom_bar';arguments[1]=val;enforcePlacement(currentTemplateId);
  }else if(path==='templateColors')mergePaletteMap(val);
  else if(/^templateColors\./.test(path)){const id=path.slice('templateColors.'.length);if(CUSTOM_IDS.has(id)&&val&&typeof val==='object')palettes[id]={...palettes[id],...val}}
  const out=original.apply(this,arguments);
  queueUi();
  if(CUSTOM_IDS.has(currentTemplateId)){renderPremiumEditor();schedulePreview()}
  return out;
 };
 wrapped=true;
}
function captureStandardClick(e){const card=e.target.closest('#v3Templates .ky-template-card-v3[data-template]');if(!card)return;const id=card.dataset.template;if(PREMIUM_IDS.has(id))return;currentTemplateId=id;templateTab='basic';sessionStorage.setItem('ky-premium-template-tab','basic');requestAnimationFrame(applyTemplateTab)}

function queueUi(){if(uiScheduled)return;uiScheduled=true;requestAnimationFrame(()=>{uiScheduled=false;linkCss();wrapHandleInput();ensureIconTabs();ensureTemplateTabs();observeStage();if(CUSTOM_IDS.has(currentTemplateId)){renderPremiumEditor();schedulePreview()}})}
function observeTemplates(){const host=q('#v3Templates');if(!host)return;templateObserver?.disconnect();templateObserver=new MutationObserver(()=>queueUi());templateObserver.observe(host,{childList:true})}

const style=document.createElement('style');style.id='kyPremiumExperienceV3';style.textContent=`
@keyframes kyGoldBorderFlow{0%{background-position:0 50%,0 50%}100%{background-position:0 50%,220% 50%}}
.ky-premium-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 10px;padding:3px;border:1px solid rgba(36,58,139,.10);border-radius:11px;background:#f7f8fc}
.ky-premium-tabs button{min-height:38px;border:1px solid transparent;border-radius:8px;background:transparent;color:#243a8b;font:800 12px/1.15 inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:.16s ease}
.ky-premium-tabs button.active:not(.premium){background:#fff;border-color:rgba(36,58,139,.12);box-shadow:0 1px 5px rgba(36,58,139,.07)}
.ky-premium-tabs button.premium{color:#a56b00;border:1px solid transparent;background:linear-gradient(#fffaf0,#fffaf0) padding-box,linear-gradient(90deg,#9c6500,#ffd86f,#fff1a8,#b77800,#ffd86f) border-box;background-size:100% 100%,220% 100%;animation:kyGoldBorderFlow 3.2s linear infinite}
.ky-premium-tabs button.premium.active{background:linear-gradient(#fff6dc,#fff8e9) padding-box,linear-gradient(90deg,#9c6500,#ffe08a,#fff8c9,#b77800,#ffe08a) border-box;box-shadow:0 4px 14px rgba(199,145,30,.12)}
.ky-premium-tab-crown{color:#e2a61e!important;font-size:15px!important;line-height:1!important;margin:0!important}.ky-icon-section[hidden],.ky-template-card-v3[hidden]{display:none!important}
.ky-premium-editor-v3{border:1px solid rgba(124,58,237,.14)!important;background:linear-gradient(145deg,#fff,#f8f7ff)!important}
.ky-inside-only-mark{position:absolute;left:7px;bottom:5px;padding:2px 5px;border-radius:999px;background:#243a8b;color:#fff;font-size:6.5px;font-weight:800;letter-spacing:.01em}
@media(prefers-reduced-motion:reduce){.ky-premium-tabs button.premium{animation:none!important}}
`;document.head.appendChild(style);

function start(){linkCss();document.addEventListener('click',captureStandardClick,true);queueUi();observeTemplates();setTimeout(()=>{queueUi();observeTemplates()},250);setTimeout(queueUi,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
