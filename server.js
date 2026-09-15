const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const IKAS_CLIENT_ID = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID || process.env.IKAS_CLIENT_ID || '';
const IKAS_CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.IKAS_CLIENT_SECRET || '';
const DEPLOY_URL = (process.env.NEXT_PUBLIC_DEPLOY_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://katagori-yildizi-production.up.railway.app')).replace(/\/$/, '');
const REDIRECT_URI = process.env.REDIRECT_URI || `${DEPLOY_URL}/api/oauth/callback/ikas`;
const IKAS_SCOPE = 'read_products read_orders';
const IKAS_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPH_API_URL || process.env.IKAS_GRAPHQL_ENDPOINT || 'https://api.myikas.com/api/v2/admin/graphql';
const IKAS_ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.myikas.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'hello@thegoatzstudio.com';
const PRIVACY_NOTICE_VERSION = '2026-09';

app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.myikas.com https://*.ikas.com https://admin.myikas.com;");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
}

const memoryDB = {
  stores: {},
  draftSettings: {},
  publishedSettings: {},
  catalogs: {},
  profiles: {},
  overrides: {},
  supportTickets: [],
  lastAutoSyncAttempt: {}
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeShop(value) {
  const shop = String(value || 'thegoatz').replace(/\.myikas\.com$/i, '').trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(shop)) throw new Error('Geçersiz mağaza kimliği.');
  return shop;
}

function getDefaultConfig() {
  return {
    templateId: 'navy-pill',
    themeId: 'ozy',
    ranking: {
      period: '30days',
      metric: 'quantity',
      maxRank: 3,
      excludeOutOfStock: true,
      excludeRefunded: true,
      minSalesThreshold: 0
    },
    placements: {
      homeCards: true,
      categoryCards: true,
      searchResults: true,
      productDetail: true,
      cardLocation: 'image_overlay',
      detailLocation: 'under_title',
      ninePointPosition: 'top_left',
      offsetX: 0,
      offsetY: 0
    },
    styling: {
      useStoreThemeFont: true,
      fontFamily: 'Bricolage Grotesque',
      fontSize: 12,
      fontWeight: 700,
      bgColor: '#243a8b',
      textColor: '#ffffff',
      accentColor: '#ce3f44',
      gradientEnabled: false,
      gradientColor1: '#243a8b',
      gradientColor2: '#ce3f44',
      gradientAngle: 135,
      borderColor: '#243a8b',
      borderWidth: 0,
      borderRadius: 9,
      shadow: 'soft',
      opacity: 100,
      paddingX: 10,
      paddingY: 5,
      scale: 100
    },
    texts: {
      productText: 'En Çok Satan {rank}. Ürün',
      pdpPrefixText: '{category} Kategorisinde',
      pdpBadgeText: 'En Çok Satan {rank}. Ürün'
    },
    icon: {
      enabled: true,
      type: 'award',
      size: 14,
      mode: 'mono',
      color: '#ffffff',
      accentColor: '#ffd166'
    },
    animation: { entry: 'fade', hover: 'lift', durationMs: 320 },
    responsive: {
      desktopEnabled: true,
      mobileEnabled: true,
      mobileFontSizeOffset: -1,
      mobileBadgeScale: 92,
      mobilePaddingX: 8,
      mobilePaddingY: 4
    },
    rules: {
      hideIfRankAbove: 20,
      hideIfDiscounted: false,
      hideIfNewProduct: false,
      excludedProducts: [],
      excludedCategories: []
    },
    templateColors: {}
  };
}

function deepMerge(base, incoming) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return clone(base);
  const out = clone(base);
  for (const [key, value] of Object.entries(incoming)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  if (out.ranking) out.ranking.maxRank = Math.max(1, Math.min(20, Number(out.ranking.maxRank || 3)));
  if (out.rules) out.rules.hideIfRankAbove = Math.max(1, Math.min(20, Number(out.rules.hideIfRankAbove || 20)));
  return out;
}

async function ensureSchema() {
  if (!pool) return;
  const ddl = `
    CREATE TABLE IF NOT EXISTS stores (
      shop_domain TEXT PRIMARY KEY,
      access_token TEXT,
      token_expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      shop_domain TEXT PRIMARY KEY,
      draft_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      published_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      has_unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_catalog (
      shop_domain TEXT PRIMARY KEY,
      catalog JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_sync TIMESTAMPTZ,
      sync_error TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS category_overrides (
      shop_domain TEXT NOT NULL,
      category_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      manual_rank INTEGER,
      hidden BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (shop_domain, category_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS merchant_profiles (
      shop_domain TEXT PRIMARY KEY,
      merchant_id TEXT,
      authorized_app_id TEXT,
      store_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT,
      privacy_notice_version TEXT NOT NULL DEFAULT '2026-09',
      privacy_notice_acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
      marketing_consent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      ticket_number TEXT PRIMARY KEY,
      shop_domain TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      response_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      email_delivered BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await pool.query(ddl);
}

async function loadSettings(shop) {
  const defaults = getDefaultConfig();
  if (!pool) {
    return {
      draft: deepMerge(defaults, memoryDB.draftSettings[shop]),
      published: deepMerge(defaults, memoryDB.publishedSettings[shop]),
      hasUnpublished: Boolean(memoryDB.draftSettings[shop])
    };
  }
  const result = await pool.query(
    'SELECT draft_config, published_config, has_unpublished_changes FROM store_settings WHERE shop_domain = $1',
    [shop]
  );
  if (!result.rows.length) {
    await pool.query(
      `INSERT INTO store_settings (shop_domain, draft_config, published_config, has_unpublished_changes)
       VALUES ($1, $2::jsonb, $2::jsonb, FALSE)
       ON CONFLICT (shop_domain) DO NOTHING`,
      [shop, JSON.stringify(defaults)]
    );
    return { draft: defaults, published: clone(defaults), hasUnpublished: false };
  }
  return {
    draft: deepMerge(defaults, result.rows[0].draft_config || {}),
    published: deepMerge(defaults, result.rows[0].published_config || {}),
    hasUnpublished: Boolean(result.rows[0].has_unpublished_changes)
  };
}

async function saveDraft(shop, config) {
  const normalized = deepMerge(getDefaultConfig(), config || {});
  if (!pool) {
    memoryDB.draftSettings[shop] = normalized;
    return normalized;
  }
  await pool.query(
    `INSERT INTO store_settings (shop_domain, draft_config, published_config, has_unpublished_changes, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, TRUE, NOW())
     ON CONFLICT (shop_domain) DO UPDATE
     SET draft_config = EXCLUDED.draft_config, has_unpublished_changes = TRUE, updated_at = NOW()`,
    [shop, JSON.stringify(normalized), JSON.stringify(getDefaultConfig())]
  );
  return normalized;
}

async function publishSettings(shop, config) {
  const normalized = deepMerge(getDefaultConfig(), config || {});
  if (!pool) {
    memoryDB.draftSettings[shop] = normalized;
    memoryDB.publishedSettings[shop] = normalized;
    return normalized;
  }
  await pool.query(
    `INSERT INTO store_settings (shop_domain, draft_config, published_config, has_unpublished_changes, updated_at)
     VALUES ($1, $2::jsonb, $2::jsonb, FALSE, NOW())
     ON CONFLICT (shop_domain) DO UPDATE
     SET draft_config = EXCLUDED.draft_config,
         published_config = EXCLUDED.published_config,
         has_unpublished_changes = FALSE,
         updated_at = NOW()`,
    [shop, JSON.stringify(normalized)]
  );
  return normalized;
}

async function getIkasAccessToken(shop) {
  if (!IKAS_CLIENT_ID || !IKAS_CLIENT_SECRET) throw new Error('ikas Client ID / Client Secret eksik.');
  const response = await fetch(`https://${shop}.myikas.com/api/admin/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: IKAS_CLIENT_ID,
      client_secret: IKAS_CLIENT_SECRET
    }),
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(`ikas kimlik doğrulaması başarısız (${response.status}).`);
  }
  const expiresAt = body.expires_in ? new Date(Date.now() + Number(body.expires_in) * 1000) : null;
  if (pool) {
    await pool.query(
      `INSERT INTO stores (shop_domain, access_token, token_expires_at, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (shop_domain) DO UPDATE
       SET access_token = EXCLUDED.access_token, token_expires_at = EXCLUDED.token_expires_at, updated_at = NOW()`,
      [shop, body.access_token, expiresAt]
    );
  } else {
    memoryDB.stores[shop] = body.access_token;
  }
  return body.access_token;
}

async function graphQL(accessToken, query) {
  const response = await fetch(IKAS_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(20000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`ikas GraphQL HTTP ${response.status}`);
  if (body.errors?.length) throw new Error(body.errors.map(x => x.message).join(' | '));
  return body.data || {};
}

async function fetchPagedWithFallback(accessToken, builders, rootField, maxPages = 50) {
  let lastError = null;
  for (const buildQuery of builders) {
    try {
      const all = [];
      for (let page = 1; page <= maxPages; page++) {
        const data = await graphQL(accessToken, buildQuery(page));
        const rows = data?.[rootField]?.data;
        if (!Array.isArray(rows)) throw new Error(`${rootField} verisi beklenen formatta değil.`);
        all.push(...rows);
        if (rows.length < 100) return all;
      }
      throw new Error(`${rootField} sayfalama limiti aşıldı.`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`${rootField} alınamadı.`);
}

async function fetchIkasCategories(accessToken) {
  return fetchPagedWithFallback(accessToken, [
    page => `query { listCategory(pagination: { page: ${page}, limit: 100 }) { data { id name } } }`
  ], 'listCategory', 20);
}

async function fetchIkasMerchantId(accessToken) {
  const data = await graphQL(accessToken, 'query { getMerchant { id } }');
  return String(data?.getMerchant?.id || '').trim();
}

async function fetchIkasProducts(accessToken) {
  return fetchPagedWithFallback(accessToken, [
    page => `query { listProduct(pagination: { page: ${page}, limit: 100 }) { data { id name categoryIds basePrice mainImage { url } variants { id } } } }`,
    page => `query { listProduct(pagination: { page: ${page}, limit: 100 }) { data { id name categories { id name } variants { id price { sellPrice currency } stock { stockCount } } } } }`,
    page => `query { listProduct(pagination: { page: ${page}, limit: 100 }) { data { id name categories { id name } variants { id } } } }`
  ], 'listProduct', 50);
}

async function fetchIkasOrders(accessToken) {
  return fetchPagedWithFallback(accessToken, [
    page => `query { listOrder(pagination: { page: ${page}, limit: 100 }) { data { id orderedAt cancelledAt orderLineItems { productId variantId quantity price } } } }`,
    page => `query { listOrder(pagination: { page: ${page}, limit: 100 }) { data { id orderedAt cancelledAt orderLineItems { variantId quantity price } } } }`,
    page => `query { listOrder(pagination: { page: ${page}, limit: 100 }) { data { id orderedAt cancelledAt orderLineItems { quantity price variant { id productId } } } } }`,
    page => `query { listOrder(pagination: { page: ${page}, limit: 100 }) { data { id orderedAt cancelledAt orderLineItems { quantity price product { id name } } } } }`,
    page => `query { listOrder(pagination: { page: ${page}, limit: 100 }) { data { id orderedAt cancelledAt orderLineItems { quantity product { id } } } } }`
  ], 'listOrder', 80);
}

function productCategoryIds(product) {
  if (Array.isArray(product.categoryIds)) return product.categoryIds.filter(Boolean);
  if (Array.isArray(product.categories)) return product.categories.map(c => c?.id).filter(Boolean);
  return [];
}

function productPrice(product) {
  const direct = Number(product.basePrice);
  if (Number.isFinite(direct) && direct > 0) return direct;
  for (const variant of product.variants || []) {
    const price = Number(variant?.price?.sellPrice ?? variant?.price);
    if (Number.isFinite(price) && price >= 0) return price;
  }
  return 0;
}

function productStock(product) {
  if (!Array.isArray(product.variants) || !product.variants.length) return null;
  let known = false;
  let total = 0;
  for (const variant of product.variants) {
    const count = Number(variant?.stock?.stockCount ?? variant?.stockCount);
    if (Number.isFinite(count)) {
      known = true;
      total += count;
    }
  }
  return known ? total : null;
}

function productImage(product, merchantId = '') {
  if (product?.mainImage?.url) return product.mainImage.url;
  const images = (product.variants || [])
    .flatMap(variant => variant?.images || [])
    .sort((a, b) => Number(Boolean(b?.isMain)) - Number(Boolean(a?.isMain)) || Number(a?.order || 0) - Number(b?.order || 0));
  const first = images[0] || (Array.isArray(product.images) ? product.images[0] : null);
  if (first?.url) return first.url;
  if (/^https?:\/\//i.test(String(first?.fileName || ''))) return first.fileName;
  const imageId = String(first?.imageId || first?.id || '').trim();
  if (!merchantId || !imageId) return '';
  return `https://cdn.myikas.com/images/${merchantId}/${imageId}/image_1080.webp`;
}

function orderTimestamp(order) {
  const raw = order?.orderedAt ?? order?.createdAt;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw < 100000000000 ? raw * 1000 : raw;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function periodKeysFor(timestamp) {
  const age = Date.now() - timestamp;
  const day = 24 * 60 * 60 * 1000;
  const keys = ['all_time'];
  if (age <= 365 * day) keys.push('365days');
  if (age <= 90 * day) keys.push('90days');
  if (age <= 30 * day) keys.push('30days');
  if (age <= 7 * day) keys.push('7days');
  return keys;
}

function emptyMetric() {
  return { quantity: 0, orders: 0, revenue: 0 };
}

function buildRawCatalog(categories, products, orders, merchantId = '') {
  const metrics = {};
  let lineItemCount = 0;
  let matchedLineItemCount = 0;
  const lineItemShapes = new Set();
  // An ikas order row may carry a variant id in productId. Normalize every
  // supported line-item id to its parent catalogue product before aggregating.
  const soldItemToProduct = new Map();
  for (const product of products) {
    const productId = String(product?.id || '');
    if (!productId) continue;
    soldItemToProduct.set(productId, productId);
    for (const variant of product.variants || []) {
      const variantId = String(variant?.id || '');
      if (variantId) soldItemToProduct.set(variantId, productId);
    }
  }
  for (const order of orders) {
    if (order?.cancelledAt) continue;
    const timestamp = orderTimestamp(order);
    const seenProducts = new Set();
    for (const item of order.orderLineItems || []) {
      lineItemCount += 1;
      lineItemShapes.add(Object.keys(item || {}).sort().join(','));
      const soldItemId = item?.productId || item?.variantId || item?.variant?.id || item?.product?.id;
      const nestedProductId = item?.product?.id || item?.variant?.productId || item?.variant?.product?.id;
      const productId = soldItemToProduct.get(String(nestedProductId || soldItemId || ''))
        || soldItemToProduct.get(String(soldItemId || ''));
      if (!productId) continue;
      matchedLineItemCount += 1;
      if (!metrics[productId]) metrics[productId] = {};
      const quantity = Math.max(0, Number(item.quantity || 1));
      const unitPrice = Number(item.price || 0);
      for (const period of periodKeysFor(timestamp)) {
        if (!metrics[productId][period]) metrics[productId][period] = emptyMetric();
        metrics[productId][period].quantity += quantity;
        metrics[productId][period].revenue += Number.isFinite(unitPrice) ? unitPrice * quantity : 0;
        if (!seenProducts.has(`${period}:${productId}`)) metrics[productId][period].orders += 1;
        seenProducts.add(`${period}:${productId}`);
      }
    }
  }

  console.log('[SYNC] Satış eşleştirme', {
    orders: orders.length,
    lineItems: lineItemCount,
    matchedLineItems: matchedLineItemCount,
    productVariants: soldItemToProduct.size - products.length,
    lineItemShapes: [...lineItemShapes].slice(0, 5)
  });

  const categoryMap = new Map(categories.map(c => [String(c.id), { id: String(c.id), name: c.name || 'Kategori' }]));
  for (const product of products) {
    for (const category of product.categories || []) {
      if (category?.id && !categoryMap.has(String(category.id))) categoryMap.set(String(category.id), { id: String(category.id), name: category.name || 'Kategori' });
    }
  }

  return {
    categories: Array.from(categoryMap.values()),
    products: products.map(product => ({
      id: String(product.id),
      name: product.name || 'Ürün',
      categoryIds: productCategoryIds(product).map(String),
      price: productPrice(product),
      stockCount: productStock(product),
      image: productImage(product, merchantId),
      metrics: metrics[String(product.id)] || {}
    })),
    syncedAt: new Date().toISOString()
  };
}

async function loadOverrides(shop) {
  if (!pool) return memoryDB.overrides[shop] || [];
  const result = await pool.query(
    'SELECT category_id, product_id, manual_rank, hidden FROM category_overrides WHERE shop_domain = $1',
    [shop]
  );
  return result.rows.map(row => ({
    categoryId: row.category_id,
    productId: row.product_id,
    manualRank: row.manual_rank,
    hidden: row.hidden
  }));
}

function rankedCategories(rawCatalog, config, overrides = []) {
  if (!rawCatalog?.categories || !rawCatalog?.products) return [];
  const period = config?.ranking?.period || '30days';
  const metric = config?.ranking?.metric || 'quantity';
  const excludedProducts = new Set(config?.rules?.excludedProducts || []);
  const excludedCategories = new Set(config?.rules?.excludedCategories || []);
  const overridesMap = new Map(overrides.map(o => [`${o.categoryId}:${o.productId}`, o]));

  return rawCatalog.categories
    .filter(category => !excludedCategories.has(category.id))
    .map(category => {
      const rows = rawCatalog.products
        .filter(product => product.categoryIds.includes(category.id))
        .filter(product => !excludedProducts.has(product.id))
        .filter(product => !(config?.ranking?.excludeOutOfStock && product.stockCount !== null && product.stockCount <= 0))
        .map(product => {
          const periodMetric = product.metrics?.[period] || emptyMetric();
          const quantity = Number(periodMetric.quantity || 0);
          const orders = Number(periodMetric.orders || 0);
          const revenue = Number(periodMetric.revenue || 0);
          return {
            id: product.id,
            name: product.name,
            image: product.image,
            price: product.price ? `${product.price} TL` : '',
            quantity,
            orders,
            revenue,
            sales: quantity,
            stockCount: product.stockCount,
            sortValue: metric === 'revenue' ? revenue : metric === 'orders' ? orders : quantity,
            hidden: false,
            manual: false
          };
        })
        .filter(product => product.quantity >= Number(config?.ranking?.minSalesThreshold || 0))
        .sort((a, b) => b.sortValue - a.sortValue || a.name.localeCompare(b.name, 'tr'));

      rows.forEach((product, index) => { product.rank = index + 1; });
      for (const product of rows) {
        const override = overridesMap.get(`${category.id}:${product.id}`);
        if (!override) continue;
        if (override.manualRank != null) {
          product.rank = Math.max(1, Math.min(20, Number(override.manualRank)));
          product.manual = true;
        }
        product.hidden = Boolean(override.hidden);
      }
      rows.sort((a, b) => a.rank - b.rank || b.sortValue - a.sortValue);
      return { id: category.id, name: category.name, products: rows };
    })
    .filter(category => category.products.length > 0);
}

async function saveCatalog(shop, catalog, syncError = null) {
  if (!pool) {
    memoryDB.catalogs[shop] = { catalog, syncError, lastSync: new Date().toISOString() };
    return;
  }
  await pool.query(
    `INSERT INTO store_catalog (shop_domain, catalog, last_sync, sync_error, updated_at)
     VALUES ($1, $2::jsonb, NOW(), $3, NOW())
     ON CONFLICT (shop_domain) DO UPDATE
     SET catalog = EXCLUDED.catalog, last_sync = NOW(), sync_error = EXCLUDED.sync_error, updated_at = NOW()`,
    [shop, JSON.stringify(catalog || {}), syncError]
  );
}

async function loadCatalog(shop) {
  if (!pool) return memoryDB.catalogs[shop] || { catalog: null, lastSync: null, syncError: null };
  const result = await pool.query('SELECT catalog, last_sync, sync_error FROM store_catalog WHERE shop_domain = $1', [shop]);
  if (!result.rows.length) return { catalog: null, lastSync: null, syncError: null };
  return {
    catalog: result.rows[0].catalog,
    lastSync: result.rows[0].last_sync,
    syncError: result.rows[0].sync_error
  };
}

async function syncIkasStoreData(shop) {
  try {
    const token = await getIkasAccessToken(shop);
    const [merchantId, categories, products, orders] = await Promise.all([
      fetchIkasMerchantId(token),
      fetchIkasCategories(token),
      fetchIkasProducts(token),
      fetchIkasOrders(token)
    ]);
    const catalog = buildRawCatalog(categories, products, orders, merchantId);
    await saveCatalog(shop, catalog, null);
    console.log(`[ikas Sync] ${shop}: ${categories.length} kategori, ${products.length} ürün, ${orders.length} sipariş.`);
    return catalog;
  } catch (error) {
    console.error(`[ikas Sync] ${shop} başarısız:`, error.message);
    const current = await loadCatalog(shop).catch(() => ({ catalog: null }));
    if (current.catalog) await saveCatalog(shop, current.catalog, error.message).catch(() => {});
    throw error;
  }
}

async function maybeAutoSync(shop) {
  const current = await loadCatalog(shop);
  if (current.catalog?.products?.length) return current;
  const lastAttempt = memoryDB.lastAutoSyncAttempt[shop] || 0;
  if (Date.now() - lastAttempt < 120000) return current;
  memoryDB.lastAutoSyncAttempt[shop] = Date.now();
  try {
    await syncIkasStoreData(shop);
  } catch (_) {}
  return loadCatalog(shop);
}

function ticketNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, 'X');
  return `TGS-${year}-${random}`;
}

function mailTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.titan.email',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') !== 'false',
    auth: { user, pass }
  });
}

async function deliverSupportEmail(ticket, profile) {
  const transport = mailTransport();
  if (!transport) return false;
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: SUPPORT_EMAIL,
    replyTo: profile.email,
    subject: `[${ticket.ticketNumber}] ${ticket.subject}`,
    text: [
      `Talep: ${ticket.ticketNumber}`,
      `Mağaza: ${ticket.shop}`,
      `Kategori: ${ticket.category}`,
      `Yetkili: ${profile.contactName}`,
      `Yanıt e-postası: ${profile.email}`,
      profile.phone ? `Telefon: ${profile.phone}` : '',
      profile.role ? `Görev: ${profile.role}` : '',
      '',
      ticket.message
    ].filter(Boolean).join('\n')
  });
  return true;
}

app.get('/health', async (req, res) => {
  let database = 'memory';
  if (pool) {
    try { await pool.query('SELECT 1'); database = 'ok'; } catch { database = 'error'; }
  }
  res.json({ ok: true, database, service: 'katagori-yildizi' });
});

app.get('/install', (req, res) => {
  const shop = safeShop(req.query.shop || 'thegoatz');
  const authUrl = `https://${shop}.myikas.com/api/admin/oauth/authorize?client_id=${encodeURIComponent(IKAS_CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(IKAS_SCOPE)}&response_type=code`;
  res.redirect(authUrl);
});

app.get('/api/oauth/callback/ikas', async (req, res) => {
  const shop = safeShop(req.query.shop || req.query.storeName || 'thegoatz');
  try {
    if (req.query.code && IKAS_CLIENT_SECRET) {
      const tokenResponse = await fetch(`https://${shop}.myikas.com/api/admin/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: IKAS_CLIENT_ID,
          client_secret: IKAS_CLIENT_SECRET,
          code: String(req.query.code),
          redirect_uri: REDIRECT_URI
        })
      });
      const token = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || token.error || `Token alınamadı (${tokenResponse.status})`);
      if (pool) {
        await pool.query(
          `INSERT INTO stores (shop_domain, access_token, token_expires_at, updated_at) VALUES ($1, $2, NULL, NOW())
           ON CONFLICT (shop_domain) DO UPDATE SET access_token = EXCLUDED.access_token, token_expires_at = NULL, updated_at = NOW()`,
          [shop, token.access_token]
        );
      } else memoryDB.stores[shop] = token.access_token;
    } else {
      throw new Error('Yetkilendirme kodu alınamadı.');
    }
    syncIkasStoreData(shop).catch(() => {});
    res.redirect(`/admin?shop=${encodeURIComponent(shop)}&installed=true`);
  } catch (error) {
    console.error('OAuth callback:', error.message);
    res.redirect(`/admin?shop=${encodeURIComponent(shop)}&error=oauth_failed`);
  }
});

app.get('/api/admin/settings', async (req, res) => {
  try {
    const shop = safeShop(req.query.shop);
    const settings = await loadSettings(shop);
    const catalogState = await maybeAutoSync(shop);
    const overrides = await loadOverrides(shop);
    const categories = rankedCategories(catalogState.catalog, settings.draft, overrides);
    res.json({
      success: true,
      shop,
      draftConfig: settings.draft,
      publishedConfig: settings.published,
      hasUnpublishedChanges: settings.hasUnpublished,
      analytics: {
        impressions: 0,
        clicks: 0,
        lastSync: catalogState.lastSync || catalogState.catalog?.syncedAt || null
      },
      connection: {
        connected: Boolean(catalogState.catalog?.products?.length),
        productCount: catalogState.catalog?.products?.length || 0,
        categoryCount: catalogState.catalog?.categories?.length || 0,
        lastSync: catalogState.lastSync || catalogState.catalog?.syncedAt || null,
        syncError: catalogState.syncError || null
      },
      categories
    });
  } catch (error) {
    console.error('Settings GET:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/settings/draft', async (req, res) => {
  try {
    const shop = safeShop(req.body.shop || req.query.shop);
    const config = await saveDraft(shop, req.body.config);
    res.json({ success: true, config, message: 'Ayarlar taslak olarak kaydedildi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/settings/publish', async (req, res) => {
  try {
    const shop = safeShop(req.body.shop || req.query.shop);
    const config = await publishSettings(shop, req.body.config);
    res.json({ success: true, config, message: 'Ayarlar canlıya yayınlandı.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/rankings/sync', async (req, res) => {
  try {
    const shop = safeShop(req.body.shop || req.query.shop);
    const rawCatalog = await syncIkasStoreData(shop);
    const settings = await loadSettings(shop);
    const overrides = await loadOverrides(shop);
    const categories = rankedCategories(rawCatalog, settings.draft, overrides);
    res.json({ success: true, lastSync: rawCatalog.syncedAt, categories, productCount: rawCatalog.products.length });
  } catch (error) {
    res.status(502).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/categories/override', async (req, res) => {
  try {
    const shop = safeShop(req.body.shop || req.query.shop);
    const categoryId = String(req.body.categoryId || '');
    const productId = String(req.body.productId || '');
    if (!categoryId || !productId) return res.status(400).json({ success: false, message: 'Kategori ve ürün gerekli.' });
    const manualRank = req.body.manualRank == null || req.body.manualRank === '' ? null : Math.max(1, Math.min(20, Number(req.body.manualRank)));
    const hidden = Boolean(req.body.hidden);
    if (pool) {
      await pool.query(
        `INSERT INTO category_overrides (shop_domain, category_id, product_id, manual_rank, hidden, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (shop_domain, category_id, product_id) DO UPDATE
         SET manual_rank = EXCLUDED.manual_rank, hidden = EXCLUDED.hidden, updated_at = NOW()`,
        [shop, categoryId, productId, manualRank, hidden]
      );
    } else {
      const list = memoryDB.overrides[shop] || (memoryDB.overrides[shop] = []);
      const index = list.findIndex(x => x.categoryId === categoryId && x.productId === productId);
      const next = { categoryId, productId, manualRank, hidden };
      if (index >= 0) list[index] = next; else list.push(next);
    }
    const catalogState = await loadCatalog(shop);
    const settings = await loadSettings(shop);
    const overrides = await loadOverrides(shop);
    res.json({ success: true, categories: rankedCategories(catalogState.catalog, settings.draft, overrides) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const shop = safeShop(req.query.shop);
    let profile = memoryDB.profiles[shop] || null;
    if (pool) {
      const result = await pool.query(
        `SELECT store_name, contact_name, email, phone, role, privacy_notice_version, marketing_consent
         FROM merchant_profiles WHERE shop_domain = $1`,
        [shop]
      );
      profile = result.rows[0] || null;
    }
    res.json({
      success: true,
      profile: profile ? {
        storeName: profile.store_name || profile.storeName || shop,
        contactName: profile.contact_name || profile.contactName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        role: profile.role || '',
        privacyNoticeVersion: profile.privacy_notice_version || profile.privacyNoticeVersion || PRIVACY_NOTICE_VERSION,
        marketingConsent: Boolean(profile.marketing_consent ?? profile.marketingConsent)
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const shop = safeShop(req.body.shop || req.query.shop);
    const contactName = String(req.body.contactName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const role = String(req.body.role || '').trim();
    const storeName = String(req.body.storeName || shop).trim();
    if (contactName.length < 2) return res.status(400).json({ success: false, message: 'Yetkili adı soyadı gerekli.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Geçerli bir e-posta adresi girin.' });
    const profile = { storeName, contactName, email, phone, role, privacyNoticeVersion: PRIVACY_NOTICE_VERSION, marketingConsent: Boolean(req.body.marketingConsent) };
    if (pool) {
      await pool.query(
        `INSERT INTO merchant_profiles
         (shop_domain, store_name, contact_name, email, phone, role, privacy_notice_version, privacy_notice_acknowledged_at, marketing_consent, marketing_consent_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,CASE WHEN $8 THEN NOW() ELSE NULL END,NOW())
         ON CONFLICT (shop_domain) DO UPDATE SET
           store_name=EXCLUDED.store_name,
           contact_name=EXCLUDED.contact_name,
           email=EXCLUDED.email,
           phone=EXCLUDED.phone,
           role=EXCLUDED.role,
           privacy_notice_version=EXCLUDED.privacy_notice_version,
           privacy_notice_acknowledged_at=NOW(),
           marketing_consent=EXCLUDED.marketing_consent,
           marketing_consent_at=CASE WHEN EXCLUDED.marketing_consent THEN COALESCE(merchant_profiles.marketing_consent_at,NOW()) ELSE NULL END,
           updated_at=NOW()`,
        [shop, storeName, contactName, email, phone || null, role || null, PRIVACY_NOTICE_VERSION, Boolean(req.body.marketingConsent)]
      );
    } else memoryDB.profiles[shop] = profile;
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/support', async (req, res) => {
  try {
    const shop = safeShop(req.body.shop || req.query.shop);
    const category = String(req.body.category || 'OTHER').toUpperCase();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();
    const allowed = new Set(['TECHNICAL', 'SETUP', 'FEATURE', 'PAYMENT', 'COMPLAINT', 'OTHER']);
    if (!allowed.has(category)) return res.status(400).json({ success: false, message: 'Geçersiz destek kategorisi.' });
    if (subject.length < 3 || subject.length > 120) return res.status(400).json({ success: false, message: 'Konu 3–120 karakter olmalı.' });
    if (message.length < 10 || message.length > 3000) return res.status(400).json({ success: false, message: 'Mesaj 10–3000 karakter olmalı.' });

    let profile = memoryDB.profiles[shop] || null;
    if (pool) {
      const result = await pool.query('SELECT store_name, contact_name, email, phone, role FROM merchant_profiles WHERE shop_domain = $1', [shop]);
      if (result.rows.length) profile = {
        storeName: result.rows[0].store_name,
        contactName: result.rows[0].contact_name,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        role: result.rows[0].role
      };
    }
    if (!profile?.email) return res.status(400).json({ success: false, message: 'Destek talebi göndermeden önce Profilim alanından e-posta adresinizi kaydedin.' });

    const ticket = { ticketNumber: ticketNumber(), shop, category, subject, message };
    let delivered = false;
    try { delivered = await deliverSupportEmail(ticket, profile); } catch (mailError) { console.error('Support mail:', mailError.message); }

    if (pool) {
      await pool.query(
        `INSERT INTO support_tickets (ticket_number, shop_domain, category, subject, message, response_email, email_delivered)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [ticket.ticketNumber, shop, category, subject, message, profile.email, delivered]
      );
    } else memoryDB.supportTickets.push({ ...ticket, responseEmail: profile.email, delivered, createdAt: new Date().toISOString() });

    res.json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      emailDelivered: delivered,
      message: delivered ? 'Destek talebi iletildi.' : 'Destek talebi kaydedildi; e-posta servisi yapılandırıldığında ayrıca iletilecek.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/storefront/badges', async (req, res) => {
  try {
    const shop = safeShop(req.query.shop);
    const settings = await loadSettings(shop);
    const catalogState = await loadCatalog(shop);
    const overrides = await loadOverrides(shop);
    const categories = rankedCategories(catalogState.catalog, settings.published, overrides);
    const productBadges = {};
    const maxRank = Number(settings.published?.ranking?.maxRank || 3);
    for (const category of categories) {
      for (const product of category.products) {
        if (product.hidden || product.rank > maxRank) continue;
        const replace = (text) => String(text || '')
          .replaceAll('{rank}', String(product.rank))
          .replaceAll('{category}', category.name)
          .replaceAll('{product}', product.name)
          .replaceAll('{sales}', String(product.sales || 0));
        productBadges[product.id] = {
          productId: product.id,
          productName: product.name,
          categoryId: category.id,
          categoryName: category.name,
          rank: product.rank,
          salesCount: product.sales,
          badgeText: replace(settings.published.texts?.productText || 'En Çok Satan {rank}. Ürün'),
          pdpPrefix: replace(settings.published.texts?.pdpPrefixText || '{category} Kategorisinde'),
          pdpBadgeText: replace(settings.published.texts?.pdpBadgeText || 'En Çok Satan {rank}. Ürün')
        };
      }
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ success: true, config: settings.published, products: productBadges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/webhooks/order', (req, res) => {
  const shop = (() => { try { return safeShop(req.query.shop || req.body?.shop || 'thegoatz'); } catch { return 'thegoatz'; } })();
  res.json({ success: true });
  setTimeout(() => syncIkasStoreData(shop).catch(() => {}), 10);
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-v3.html')));

async function start() {
  try {
    await ensureSchema();
    console.log('[DB] Şema hazır.');
  } catch (error) {
    console.error('[DB] Şema oluşturulamadı:', error.message);
  }
  app.listen(PORT, () => console.log(`[Kategori Yıldızı] Running at http://localhost:${PORT}`));
}

start();
