const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// 1. Allow iFrame embedding inside ikas Admin Panel (Zero Spinners)
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.myikas.com https://*.ikas.com https://admin.myikas.com;"
  );
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const IKAS_CLIENT_ID = process.env.IKAS_CLIENT_ID || '24a87666-72cd-48fb-b41b-fff05e937d96';
const IKAS_CLIENT_SECRET = process.env.IKAS_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://katagori-yildizi-production.up.railway.app/api/oauth/callback/ikas';
const IKAS_SCOPE = 'read_products read_orders';

// PostgreSQL Pool (Graceful Fallback to In-Memory if not configured)
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
}

// In-Memory Fallback Cache
const memoryDB = {
  stores: {},
  draftSettings: {},
  publishedSettings: {},
  categories: [
    {
      id: "cat_mutfak",
      name: "Mutfak Dekorasyonu",
      products: [
        { id: "p1", name: "El Yapımı Seramik Meyve Sepeti", rank: 1, sales: 48, manual: false, hidden: false, price: "850 TL", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=60" },
        { id: "p2", name: "Adaçayı Yeşili Sunum Tabağı", rank: 2, sales: 36, manual: false, hidden: false, price: "420 TL", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&auto=format&fit=crop&q=60" },
        { id: "p3", name: "Ham Dokulu Seramik Fincan", rank: 3, sales: 29, manual: false, hidden: false, price: "320 TL", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60" },
        { id: "p4", name: "Minimal Ahşap Kaşık Seti", rank: 4, sales: 18, manual: false, hidden: false, price: "180 TL", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60" }
      ]
    },
    {
      id: "cat_mum",
      name: "Doğal Soya Mumları",
      products: [
        { id: "p5", name: "Beton Saksıda Pop-Up Soya Mumu", rank: 1, sales: 62, manual: false, hidden: false, price: "390 TL", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=60" },
        { id: "p6", name: "İkili Ahşap Fitilli Lavanta Mumu", rank: 2, sales: 41, manual: false, hidden: false, price: "340 TL", image: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b8?w=500&auto=format&fit=crop&q=60" },
        { id: "p7", name: "Geri Dönüştürülmüş Cam Kavanoz Mumu", rank: 3, sales: 22, manual: false, hidden: false, price: "280 TL", image: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=500&auto=format&fit=crop&q=60" }
      ]
    },
    {
      id: "cat_vazo",
      name: "Tasarım Vazolar",
      products: [
        { id: "p8", name: "Toprak Mat Dokulu Skandinav Vazo", rank: 1, sales: 31, manual: false, hidden: false, price: "720 TL", image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&auto=format&fit=crop&q=60" },
        { id: "p9", name: "Memphis Desenli Geometrik Vazo", rank: 2, sales: 25, manual: false, hidden: false, price: "640 TL", image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=500&auto=format&fit=crop&q=60" }
      ]
    }
  ],
  analytics: {
    impressions: 14280,
    clicks: 1195,
    lastSync: new Date().toISOString()
  }
};

function getDefaultConfig() {
  return {
    templateId: 'sage-ribbon',
    ranking: {
      period: '30days',
      metric: 'quantity',
      maxRank: 3,
      excludeOutOfStock: true,
      excludeRefunded: true,
      minSalesThreshold: 3
    },
    placements: {
      categoryCards: true,
      productDetail: true,
      homeCards: true,
      searchResults: true,
      cardLocation: 'image_bottom_bar',
      detailLocation: 'under_title',
      ninePointPosition: 'bottom_center',
      offsetX: 0,
      offsetY: 0
    },
    styling: {
      fontFamily: 'Bricolage Grotesque',
      useStoreThemeFont: false,
      bgColor: '#3b4d47',
      textColor: '#ffffff',
      gradientEnabled: false,
      gradient: 'linear-gradient(135deg, #70d6ff, #ffd670, #ff70a6)',
      borderColor: 'transparent',
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 4,
      shadow: 'none',
      opacity: 100,
      paddingX: 10,
      paddingY: 5,
      scale: 100,
      rotation: 0
    },
    pdpStyling: {
      categoryLinkColor: '#222222',
      pillBgColor: '#ffffff',
      pillTextColor: '#111111',
      pillGradientBorder: 'linear-gradient(135deg, #70d6ff, #ffd670, #ff70a6)',
      pillBorderWidth: 1.5,
      pillBorderRadius: 20
    },
    texts: {
      lang: 'tr',
      categoryCardPrefix: 'En Çok Satan',
      rank1Text: 'En Çok Satan 1. Ürün',
      rank2Text: 'En Çok Satan 2. Ürün',
      rank3Text: 'En Çok Satan 3. Ürün',
      rankOtherText: 'En Çok Satan #{rank}. Ürün',
      pdpPrefixText: '{category} Kategorisinde',
      pdpBadgeText: 'En çok satan #{rank}. ürün >',
      customTranslations: {
        en: {
          rank1Text: '#1 Best Seller',
          rank2Text: '#2 Most Popular',
          rank3Text: '#3 Trending Item',
          pdpPrefixText: 'In {category}',
          pdpBadgeText: '#{rank} Bestseller >'
        }
      }
    },
    icon: {
      enabled: true,
      type: 'ribbon',
      size: 14,
      color: '#ffffff',
      customSvg: ''
    },
    animation: {
      entry: 'fade',
      hover: 'lift',
      speed: 'normal',
      durationMs: 300
    },
    responsive: {
      desktopEnabled: true,
      mobileEnabled: true,
      mobileFontSizeOffset: -1,
      mobileBadgeScale: 92,
      mobilePaddingX: 8,
      mobilePaddingY: 4
    },
    rules: {
      hideIfRankAbove: 3,
      hideIfDiscounted: false,
      hideIfNewProduct: false,
      excludedProducts: [],
      excludedCategories: []
    }
  };
}

// ----------------------------------------------------------------
// ikas GraphQL Store Sync Engine
// ----------------------------------------------------------------
async function syncIkasStoreData(shopDomain, accessToken) {
  if (!accessToken || accessToken.startsWith('demo_token')) return;

  const endpoint = `https://${shopDomain}.myikas.com/api/v2/admin/graphql`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  try {
    const catQuery = `query { listCategory(pagination: { page: 1, limit: 100 }) { data { id name } } }`;
    const catRes = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: catQuery }) });
    const catJson = await catRes.json();
    const categories = catJson?.data?.listCategory?.data || [];

    const prodQuery = `query { listProduct(pagination: { page: 1, limit: 100 }) { data { id name categoryIds basePrice mainImage { url } } } }`;
    const prodRes = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: prodQuery }) });
    const prodJson = await prodRes.json();
    const products = prodJson?.data?.listProduct?.data || [];

    const orderQuery = `query { listOrder(pagination: { page: 1, limit: 100 }) { data { id status orderLineItems { productId quantity } } } }`;
    const orderRes = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: orderQuery }) });
    const orderJson = await orderRes.json();
    const orders = orderJson?.data?.listOrder?.data || [];

    const salesCount = {};
    orders.forEach(ord => {
      if (ord.status && (ord.status.toLowerCase().includes('cancel') || ord.status.toLowerCase().includes('refund'))) return;
      (ord.orderLineItems || []).forEach(item => {
        if (item.productId) {
          salesCount[item.productId] = (salesCount[item.productId] || 0) + (item.quantity || 1);
        }
      });
    });

    const realCategories = categories.map(cat => {
      const catProds = products
        .filter(p => (p.categoryIds || []).includes(cat.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          price: (p.basePrice ? p.basePrice + ' TL' : '0 TL'),
          image: p.mainImage?.url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=60',
          sales: salesCount[p.id] || 0,
          manual: false,
          hidden: false
        }))
        .sort((a, b) => b.sales - a.sales);

      catProds.forEach((p, i) => { p.rank = i + 1; });
      return { id: cat.id, name: cat.name, products: catProds };
    }).filter(c => c.products.length > 0);

    if (realCategories.length > 0) {
      memoryDB.categories = realCategories;
      console.log(`[ikas GraphQL Sync] ${realCategories.length} kategori başarıyla yüklendi.`);
    }
  } catch (err) {
    console.warn('[ikas GraphQL Sync Warning]:', err.message);
  }
}

// ----------------------------------------------------------------
// 1. ikas Admin Panel ve OAuth Yönlendirmeleri
// ----------------------------------------------------------------

// Doğrudan ikas iFrame Arayüzünü Aç (Sonsuz Yüklenme Spinner'ını Önler)
app.get('/', (req, res) => {
  const code = req.query.code;
  const shop = req.query.shop || req.query.store_id;

  if (code && shop) {
    return res.redirect(`/api/oauth/callback/ikas?code=${code}&shop=${shop}`);
  }

  // ikas paneli içinden açıldığında doğrudan yönetim arayüzünü sun
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Kurulum Başlatma Endpoint'i (İsteğe bağlı manuel kurulum)
app.get('/install', (req, res) => {
  const shop = req.query.shop || 'thegoatz';
  const authUrl = `https://${shop}.myikas.com/api/admin/oauth/authorize?client_id=${IKAS_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(IKAS_SCOPE)}&response_type=code`;
  res.redirect(authUrl);
});

// OAuth Callback
app.get('/api/oauth/callback/ikas', async (req, res) => {
  const { code, shop } = req.query;
  const storeDomain = shop || 'thegoatz';

  try {
    let accessToken = 'token_' + Date.now();
    if (code && IKAS_CLIENT_SECRET) {
      try {
        const tokenRes = await fetch(`https://${storeDomain}.myikas.com/api/admin/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: IKAS_CLIENT_ID,
            client_secret: IKAS_CLIENT_SECRET,
            code: code,
            redirect_uri: REDIRECT_URI
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          syncIkasStoreData(storeDomain, accessToken);
        }
      } catch (e) {
        console.warn('OAuth token fetch error:', e.message);
      }
    }

    if (pool) {
      await pool.query(
        `INSERT INTO stores (shop_domain, access_token, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (shop_domain) DO UPDATE SET access_token = $2, updated_at = NOW()`,
        [storeDomain, accessToken]
      );
    } else {
      memoryDB.stores[storeDomain] = accessToken;
    }

    res.redirect(`/admin?shop=${storeDomain}&installed=true`);
  } catch (error) {
    console.error('OAuth Callback error:', error);
    res.redirect(`/admin?shop=${storeDomain}&error=oauth_failed`);
  }
});

// ----------------------------------------------------------------
// 2. Admin API
// ----------------------------------------------------------------
app.get('/api/admin/settings', async (req, res) => {
  const shop = req.query.shop || 'thegoatz';
  let draft = getDefaultConfig();
  let published = getDefaultConfig();
  let hasUnpublished = false;

  if (pool) {
    try {
      const dbRes = await pool.query('SELECT draft_config, published_config, has_unpublished_changes FROM store_settings WHERE shop_domain = $1', [shop]);
      if (dbRes.rows.length > 0) {
        draft = dbRes.rows[0].draft_config;
        published = dbRes.rows[0].published_config;
        hasUnpublished = dbRes.rows[0].has_unpublished_changes;
      }
    } catch (e) {
      console.warn('DB settings read error:', e.message);
    }
  } else {
    draft = memoryDB.draftSettings[shop] || getDefaultConfig();
    published = memoryDB.publishedSettings[shop] || getDefaultConfig();
  }

  res.json({
    success: true,
    shop: shop,
    draftConfig: draft,
    publishedConfig: published,
    hasUnpublishedChanges: hasUnpublished,
    analytics: memoryDB.analytics,
    categories: memoryDB.categories
  });
});

app.post('/api/admin/settings/draft', async (req, res) => {
  const shop = req.body.shop || 'thegoatz';
  const newConfig = req.body.config || {};
  memoryDB.draftSettings[shop] = newConfig;
  res.json({ success: true, message: 'Ayarlar taslak olarak kaydedildi.' });
});

app.post('/api/admin/settings/publish', async (req, res) => {
  const shop = req.body.shop || 'thegoatz';
  const configToPublish = req.body.config;
  memoryDB.publishedSettings[shop] = configToPublish;
  memoryDB.draftSettings[shop] = configToPublish;
  res.json({ success: true, message: 'Ayarlar başarıyla yayınlandı ve mağazada aktif!' });
});

app.post('/api/admin/rankings/sync', async (req, res) => {
  const shop = req.body.shop || 'thegoatz';
  const token = memoryDB.stores[shop] || '';
  if (token) {
    await syncIkasStoreData(shop, token);
  }
  memoryDB.analytics.lastSync = new Date().toISOString();
  res.json({ success: true, lastSync: memoryDB.analytics.lastSync, categories: memoryDB.categories });
});

app.post('/api/admin/categories/override', (req, res) => {
  const { categoryId, productId, manualRank, hidden } = req.body;
  const category = memoryDB.categories.find(c => c.id === categoryId);
  if (category) {
    const prod = category.products.find(p => p.id === productId);
    if (prod) {
      if (manualRank !== undefined) prod.rank = parseInt(manualRank);
      if (hidden !== undefined) prod.hidden = Boolean(hidden);
      prod.manual = true;
    }
  }
  res.json({ success: true, categories: memoryDB.categories });
});

// ----------------------------------------------------------------
// 3. Storefront API
// ----------------------------------------------------------------
app.get('/api/storefront/badges', (req, res) => {
  const shop = req.query.shop || 'thegoatz';
  const config = memoryDB.publishedSettings[shop] || getDefaultConfig();

  const productBadges = {};
  memoryDB.categories.forEach(cat => {
    cat.products.forEach(prod => {
      if (prod.hidden) return;
      if (prod.rank <= (config.ranking ? config.ranking.maxRank : 3)) {
        productBadges[prod.id] = {
          productId: prod.id,
          productName: prod.name,
          categoryId: cat.id,
          categoryName: cat.name,
          rank: prod.rank,
          salesCount: prod.sales,
          badgeText: prod.rank === 1 ? config.texts.rank1Text : (prod.rank === 2 ? config.texts.rank2Text : (prod.rank === 3 ? config.texts.rank3Text : config.texts.rankOtherText.replace('{rank}', prod.rank))),
          pdpPrefix: config.texts.pdpPrefixText.replace('{category}', cat.name),
          pdpBadgeText: config.texts.pdpBadgeText.replace('{rank}', prod.rank).replace('{category}', cat.name)
        };
      }
    });
  });

  res.json({
    success: true,
    config: config,
    products: productBadges
  });
});

app.post('/api/webhooks/order', (req, res) => {
  console.log('[ikas Webhook] Yeni sipariş alındı.');
  res.json({ success: true });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

server = app.listen(PORT, () => {
  console.log(`[Kategori Yıldızı SaaS Engine] Running at http://localhost:${PORT}`);
});
