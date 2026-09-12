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
    parsed.query = `query { listProduct(pagination: { page: ${page}, limit: 100 }) { data { id name categories { id name } variants { id } } } }`;
  } else if (query.includes('listOrder')) {
    operation = 'listOrder';
    parsed.query = `query { listOrder(pagination: { page: ${page}, limit: 100 }) { data { id orderedAt cancelledAt orderLineItems { quantity finalPrice variant { id } } } } }`;
  }

  return operation ? { operation, body: JSON.stringify(parsed) } : null;
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

async function waitForVariantMap(timeoutMs = 2500) {
  const started = Date.now();
  while (!variantToProduct.size && Date.now() - started < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
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
      for (const variant of product?.variants || []) {
        if (variant?.id && product?.id) variantToProduct.set(String(variant.id), String(product.id));
      }
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
    let operation = null;
    let nextInit = init;

    if (isGraph && typeof input === 'string') {
      const adapted = adaptGraphQuery(init?.body?.toString?.() || '');
      if (adapted) {
        operation = adapted.operation;
        nextInit = { ...init, body: adapted.body };
      }
    }

    const request = typeof input === 'string' ? null : new Request(nextUrl, input);
    const response = typeof input === 'string'
      ? await nativeFetch(nextUrl, nextInit)
      : await nativeFetch(request, init);

    if (isGraph && !response.ok) {
      try {
        const errorBody = await response.clone().text();
        console.error(`[ikas GraphQL ${response.status}] ${operation || 'unknown'}: ${errorBody.slice(0, 4000)}`);
      } catch (error) {
        console.error('[ikas GraphQL] hata gövdesi okunamadı:', error.message);
      }
    }

    if (isGraph && operation) return adaptGraphResponse(response, operation);
    return response;
  };
}

require('./server.js');
