const { Pool } = require('pg');
const nativeFetch = global.fetch;

let tokenPool = null;
if (process.env.DATABASE_URL) {
  tokenPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
}

const variantToProduct = new Map();

async function getStoredToken(shop) {
  if (!tokenPool || !shop) return null;
  try {
    const result = await tokenPool.query(
      'SELECT access_token, token_expires_at FROM stores WHERE shop_domain = $1 LIMIT 1',
      [shop]
    );
    const row = result.rows[0];
    if (!row?.access_token) return null;
    if (row.token_expires_at && new Date(row.token_expires_at).getTime() <= Date.now() + 60000) return null;
    return row.access_token;
  } catch (error) {
    console.error('[ikas OAuth] stored token lookup failed:', error.message);
    return null;
  }
}

function pageFromQuery(query) {
  const match = String(query || '').match(/page\s*:\s*(\d+)/i);
  return Math.max(1, Number(match?.[1] || 1));
}

function productQuery(page, rich = true) {
  if (!rich) {
    return `query { listProduct(pagination: { page: ${page}, limit: 100 }) { data { id name categories { id name } variants { id } } } }`;
  }
  return `query { listProduct(pagination: { page: ${page}, limit: 100 }) { data { id name categories { id name } images { id fileName order } variants { id prices { sellPrice discountPrice } stocks { stockCount } } } } }`;
}

function adaptGraphQuery(bodyText) {
  let parsed;
  try { parsed = JSON.parse(bodyText || '{}'); } catch { return null; }
  const query = String(parsed.query || '');
  if (!query) return null;

  const page = pageFromQuery(query);
  let operation = null;

  if (query.includes('listCategory')) {
    operation = 'listCategory';
    parsed.query = 'query { listCategory { id name } }';
  } else if (query.includes('listProduct')) {
    operation = 'listProduct';
    parsed.query = productQuery(page, true);
  } else if (query.includes('listOrder')) {
    operation = 'listOrder';
    parsed.query = `query { listOrder(pagination: { page: ${page}, limit: 100 }) { data { id orderedAt cancelledAt orderLineItems { quantity finalPrice variant { id } } } } }`;
  }

  return operation ? { operation, page, parsed, body: JSON.stringify(parsed) } : null;
}

function jsonResponseLike(response, body) {
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function waitForVariantMap(timeoutMs = 3000) {
  const started = Date.now();
  while (!variantToProduct.size && Date.now() - started < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

function firstPrice(variant) {
  const prices = Array.isArray(variant?.prices) ? variant.prices : [];
  const price = prices.find(p => Number.isFinite(Number(p?.sellPrice))) || prices[0];
  return price || null;
}

function stockCount(variant) {
  const stocks = Array.isArray(variant?.stocks) ? variant.stocks : [];
  if (!stocks.length) return null;
  return stocks.reduce((sum, stock) => sum + (Number(stock?.stockCount) || 0), 0);
}

function imageUrl(image) {
  const fileName = String(image?.fileName || '').trim();
  if (!fileName) return '';
  if (/^https?:\/\//i.test(fileName)) return fileName;
  return `https://cdn.myikas.com/images/${fileName.replace(/^\/+/, '')}`;
}

async function adaptGraphResponse(response, operation) {
  if (!response.ok || !operation) return response;

  let body;
  try { body = await response.clone().json(); } catch { return response; }
  if (!body?.data) return response;

  if (operation === 'listCategory') {
    const raw = body.data.listCategory;
    const rows = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    body.data.listCategory = { data: rows };
    return jsonResponseLike(response, body);
  }

  if (operation === 'listProduct') {
    const rows = Array.isArray(body.data?.listProduct?.data) ? body.data.listProduct.data : [];
    for (const product of rows) {
      product.categoryIds = (product.categories || []).map(category => category?.id).filter(Boolean);
      const orderedImages = [...(product.images || [])].sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
      const url = imageUrl(orderedImages[0]);
      if (url) product.mainImage = { url };

      let basePrice = null;
      for (const variant of product?.variants || []) {
        if (variant?.id && product?.id) variantToProduct.set(String(variant.id), String(product.id));
        const price = firstPrice(variant);
        if (price) {
          variant.price = {
            sellPrice: Number(price.sellPrice || 0),
            discountPrice: Number(price.discountPrice || 0)
          };
          if (basePrice == null && Number.isFinite(Number(price.sellPrice))) basePrice = Number(price.sellPrice);
        }
        const count = stockCount(variant);
        if (count != null) variant.stock = { stockCount: count };
      }
      if (basePrice != null) product.basePrice = basePrice;
    }
    return jsonResponseLike(response, body);
  }

  if (operation === 'listOrder') {
    await waitForVariantMap();
    const rows = Array.isArray(body.data?.listOrder?.data) ? body.data.listOrder.data : [];
    for (const order of rows) {
      order.orderLineItems = (order.orderLineItems || []).map(item => {
        const quantity = Math.max(1, Number(item?.quantity || 1));
        const finalPrice = Number(item?.finalPrice || 0);
        const variantId = item?.variant?.id ? String(item.variant.id) : '';
        const productId = variantToProduct.get(variantId) || null;
        return {
          ...item,
          productId,
          price: Number.isFinite(finalPrice) ? finalPrice / quantity : 0
        };
      });
    }
    return jsonResponseLike(response, body);
  }

  return response;
}

async function graphFetchWithProductFallback(url, init, adapted) {
  let response = await nativeFetch(url, init);
  if (adapted?.operation !== 'listProduct' || response.ok) return response;

  const errorBody = await response.clone().text().catch(() => '');
  console.warn(`[ikas GraphQL ${response.status}] listProduct rich query fallback: ${errorBody.slice(0, 1800)}`);

  const fallbackParsed = { ...adapted.parsed, query: productQuery(adapted.page, false) };
  return nativeFetch(url, { ...init, body: JSON.stringify(fallbackParsed) });
}

if (typeof nativeFetch === 'function') {
  global.fetch = async function ikasEndpointCompat(input, init) {
    const raw = typeof input === 'string' ? input : input?.url;
    if (!raw) return nativeFetch(input, init);

    let nextUrl = raw;

    const tokenMatch = raw.match(/^https:\/\/([a-z0-9-]+)\.myikas\.com\/api\/admin\/oauth\/token(?:\?.*)?$/i);
    if (tokenMatch) {
      const bodyText = init?.body?.toString?.() || '';
      const params = new URLSearchParams(bodyText);
      const grantType = params.get('grant_type');

      if (grantType === 'client_credentials') {
        const stored = await getStoredToken(tokenMatch[1].toLowerCase());
        if (stored) {
          console.log(`[ikas OAuth] ${tokenMatch[1]} için kayıtlı OAuth token kullanılıyor.`);
          return new Response(JSON.stringify({ access_token: stored, token_type: 'Bearer', expires_in: 3600 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.warn(`[ikas OAuth] ${tokenMatch[1]} için kayıtlı OAuth token yok; yeniden yetkilendirme gerekli.`);
      }
    }

    nextUrl = nextUrl.replace(
      'https://api.myikas.com/api/v1/admin/graphql',
      'https://api.myikas.com/api/v2/admin/graphql'
    );

    const isGraph = nextUrl.includes('/api/v2/admin/graphql');
    let adapted = null;
    let nextInit = init;

    if (isGraph && typeof input === 'string') {
      adapted = adaptGraphQuery(init?.body?.toString?.() || '');
      if (adapted) nextInit = { ...init, body: adapted.body };
    }

    const request = typeof input === 'string' ? null : new Request(nextUrl, input);
    let response;
    if (typeof input === 'string') {
      response = isGraph
        ? await graphFetchWithProductFallback(nextUrl, nextInit, adapted)
        : await nativeFetch(nextUrl, nextInit);
    } else {
      response = await nativeFetch(request, init);
    }

    if (isGraph && !response.ok) {
      try {
        const errorBody = await response.clone().text();
        console.error(`[ikas GraphQL ${response.status}] ${adapted?.operation || 'unknown'}: ${errorBody.slice(0, 4000)}`);
      } catch (error) {
        console.error('[ikas GraphQL] hata gövdesi okunamadı:', error.message);
      }
    }

    if (isGraph && adapted?.operation) return adaptGraphResponse(response, adapted.operation);
    return response;
  };
}

require('./server.js');

let backgroundSyncRunning = false;
async function syncConnectedStores() {
  if (!tokenPool || backgroundSyncRunning) return;
  backgroundSyncRunning = true;
  try {
    const result = await tokenPool.query('SELECT shop_domain FROM stores WHERE access_token IS NOT NULL ORDER BY updated_at DESC');
    const port = process.env.PORT || 3000;
    for (const row of result.rows) {
      const shop = String(row.shop_domain || '').trim().toLowerCase();
      if (!shop) continue;
      try {
        const response = await nativeFetch(`http://127.0.0.1:${port}/api/admin/rankings/sync?shop=${encodeURIComponent(shop)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop })
        });
        if (response.ok) console.log(`[ikas Auto Sync] ${shop} güncellendi.`);
        else console.warn(`[ikas Auto Sync] ${shop} başarısız (${response.status}).`);
      } catch (error) {
        console.warn(`[ikas Auto Sync] ${shop} isteği başarısız: ${error.message}`);
      }
    }
  } catch (error) {
    console.warn('[ikas Auto Sync] mağazalar okunamadı:', error.message);
  } finally {
    backgroundSyncRunning = false;
  }
}

setTimeout(syncConnectedStores, 4500);
setInterval(syncConnectedStores, 15 * 60 * 1000);
