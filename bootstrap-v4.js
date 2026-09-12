const { Pool } = require('pg');
const nativeFetch = global.fetch;

let tokenPool = null;
if (process.env.DATABASE_URL) {
  tokenPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
}

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

    const request = typeof input === 'string' ? null : new Request(nextUrl, input);
    const response = typeof input === 'string'
      ? await nativeFetch(nextUrl, init)
      : await nativeFetch(request, init);

    if (nextUrl.includes('/api/v2/admin/graphql') && !response.ok) {
      try {
        const errorBody = await response.clone().text();
        let operation = 'unknown';
        const rawBody = init?.body?.toString?.() || (request ? await request.clone().text().catch(() => '') : '');
        try {
          const parsed = JSON.parse(rawBody || '{}');
          const q = String(parsed.query || '');
          operation = q.includes('listCategory') ? 'listCategory' : q.includes('listProduct') ? 'listProduct' : q.includes('listOrder') ? 'listOrder' : 'unknown';
        } catch (_) {}
        console.error(`[ikas GraphQL ${response.status}] ${operation}: ${errorBody.slice(0, 4000)}`);
      } catch (error) {
        console.error('[ikas GraphQL] hata gövdesi okunamadı:', error.message);
      }
    }

    return response;
  };
}

require('./server.js');
