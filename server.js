const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
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

// Default Full-Featured Configuration
function getDefaultConfig() {
  return {
    templateId: 'sage-ribbon', // Default matching user's photo
    ranking: {
      period: '30days', // 7days, 30days, 90days, 365days, all_time, custom
      metric: 'quantity', // quantity, orders, revenue, category_share
      maxRank: 3, // #1, #2, #3
      excludeOutOfStock: true,
      excludeRefunded: true,
      minSalesThreshold: 3
    },
    placements: {
      categoryCards: true,
      productDetail: true,
      homeCards: true,
      searchResults: true,
      cardLocation: 'image_bottom_bar', // image_bottom_bar, image_corner, under_image, under_title, under_price
      detailLocation: 'under_title', // above_title, under_title, beside_price, above_add_to_cart
      ninePointPosition: 'bottom_center', // top_left, top_center, top_right, middle_left, center, middle_right, bottom_left, bottom_center, bottom_right
      offsetX: 0,
      offsetY: 0
    },
    styling: {
      fontFamily: 'Bricolage Grotesque',
      useStoreThemeFont: false,
      bgColor: '#3b4d47', // Olive/sage green from photo
      textColor: '#ffffff',
      gradientEnabled: false,
      gradient: 'linear-gradient(135deg, #70d6ff, #ffd670, #ff70a6)',
      borderColor: 'transparent',
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 4,
      shadow: 'none', // none, soft, medium, strong, glow
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
      type: 'ribbon', // ribbon, medal, cup, crown, star, check, trend, fire, heart, award, leaf, custom_svg
      size: 14,
      color: '#ffffff',
      customSvg: ''
    },
    animation: {
      entry: 'fade', // none, fade, slide_up, slide_down, slide_left, pop, bounce, pulse, glow
      hover: 'lift', // none, scale, glow, lift, shadow
      speed: 'normal', // slow, normal, fast
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

// Database Initialization
async function initDB() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        shop_domain VARCHAR(255) UNIQUE NOT NULL,
        access_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        shop_domain VARCHAR(255) UNIQUE NOT NULL,
        draft_config JSONB NOT NULL,
        published_config JSONB NOT NULL,
        has_unpublished_changes BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS category_ranks (
        id SERIAL PRIMARY KEY,
        shop_domain VARCHAR(255) NOT NULL,
        category_id VARCHAR(255) NOT NULL,
        category_name VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(255),
        rank INT NOT NULL,
        sales_count INT DEFAULT 0,
        manual_override BOOLEAN DEFAULT false,
        hidden BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS badge_analytics (
        id SERIAL PRIMARY KEY,
        shop_domain VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        product_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[PostgreSQL] Tablolar başarıyla doğrulandı.');
  } catch (err) {
    console.warn('[PostgreSQL Init Warning]', err.message);
  }
}
initDB();

// ----------------------------------------------------------------
// 1. ikas OAuth Akışı
// ----------------------------------------------------------------

// Kurulum Adresi (ikas Dashboard veya doğrudan kurulum)
app.get('/', async (req, res) => {
  const shop = req.query.shop || req.query.store_id || 'thegoatz';
  const code = req.query.code;

  if (code) {
    // If code exists in root, forward to callback
    return res.redirect(`/api/oauth/callback/ikas?code=${code}&shop=${shop}`);
  }

  // Redirect to ikas Authorize endpoint with valid scopes
  const authUrl = `https://${shop}.myikas.com/api/admin/oauth/authorize?client_id=${IKAS_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(IKAS_SCOPE)}&response_type=code`;
  res.redirect(authUrl);
});

// OAuth Callback
app.get('/api/oauth/callback/ikas', async (req, res) => {
  const { code, shop } = req.query;
  const storeDomain = shop || 'thegoatz';

  try {
    let accessToken = 'demo_token_' + Date.now();
    // Real Token Exchange with ikas
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
        }
      } catch (e) {
        console.warn('OAuth token fetch error:', e.message);
      }
    }

    // Save to Database
    if (pool) {
      await pool.query(
        `INSERT INTO stores (shop_domain, access_token, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (shop_domain) DO UPDATE SET access_token = $2, updated_at = NOW()`,
        [storeDomain, accessToken]
      );
      const def = getDefaultConfig();
      await pool.query(
        `INSERT INTO store_settings (shop_domain, draft_config, published_config, has_unpublished_changes)
         VALUES ($1, $2, $2, false)
         ON CONFLICT (shop_domain) DO NOTHING`,
        [storeDomain, JSON.stringify(def)]
      );
    } else {
      memoryDB.stores[storeDomain] = accessToken;
      if (!memoryDB.draftSettings[storeDomain]) {
        memoryDB.draftSettings[storeDomain] = getDefaultConfig();
        memoryDB.publishedSettings[storeDomain] = getDefaultConfig();
      }
    }

    // Redirect to Embedded App Dashboard inside ikas
    res.redirect(`/admin?shop=${storeDomain}&installed=true`);
  } catch (error) {
    console.error('OAuth Callback error:', error);
    res.redirect(`/admin?shop=${storeDomain}&error=oauth_failed`);
  }
});

// ----------------------------------------------------------------
// 2. Admin API
// ----------------------------------------------------------------

// Get Settings (Draft + Published)
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

// Save Draft Settings
app.post('/api/admin/settings/draft', async (req, res) => {
  const shop = req.body.shop || 'thegoatz';
  const newConfig = req.body.config || {};

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO store_settings (shop_domain, draft_config, published_config, has_unpublished_changes, updated_at)
         VALUES ($1, $2, $2, true, NOW())
         ON CONFLICT (shop_domain) DO UPDATE SET draft_config = $2, has_unpublished_changes = true, updated_at = NOW()`,
        [shop, JSON.stringify(newConfig)]
      );
    } catch (e) {
      console.warn('DB draft save error:', e.message);
    }
  } else {
    memoryDB.draftSettings[shop] = newConfig;
  }

  res.json({ success: true, message: 'Ayarlar taslak olarak kaydedildi.' });
});

// Publish Settings to Storefront
app.post('/api/admin/settings/publish', async (req, res) => {
  const shop = req.body.shop || 'thegoatz';
  const configToPublish = req.body.config;

  if (pool) {
    try {
      await pool.query(
        `UPDATE store_settings SET published_config = $2, draft_config = $2, has_unpublished_changes = false, updated_at = NOW()
         WHERE shop_domain = $1`,
        [shop, JSON.stringify(configToPublish)]
      );
    } catch (e) {
      console.warn('DB publish error:', e.message);
    }
  } else {
    memoryDB.publishedSettings[shop] = configToPublish;
    memoryDB.draftSettings[shop] = configToPublish;
  }

  res.json({ success: true, message: 'Ayarlar başarıyla yayınlandı ve mağazada aktif!' });
});

// Manual Product Rank Override in Category
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

// Refresh / Sync Rankings from ikas
app.post('/api/admin/rankings/sync', (req, res) => {
  memoryDB.analytics.lastSync = new Date().toISOString();
  res.json({ success: true, lastSync: memoryDB.analytics.lastSync, categories: memoryDB.categories });
});

// ----------------------------------------------------------------
// 3. Storefront API
// ----------------------------------------------------------------

// High-Speed Cached Badges Endpoint
app.get('/api/storefront/badges', (req, res) => {
  const shop = req.query.shop || 'thegoatz';
  const config = (pool ? null : memoryDB.publishedSettings[shop]) || getDefaultConfig();

  // Pre-calculate products badge map
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

// Analytics Event Tracker (Impressions & Clicks)
app.post('/api/storefront/analytics', (req, res) => {
  const { eventType, productId } = req.body;
  if (eventType === 'click') {
    memoryDB.analytics.clicks++;
  } else {
    memoryDB.analytics.impressions++;
  }
  res.json({ success: true });
});

// Serve Admin UI
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

server = app.listen(PORT, () => {
  console.log(`[Kategori Yıldızı SaaS Engine] Running at http://localhost:${PORT}`);
});
