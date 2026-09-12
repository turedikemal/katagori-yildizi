const nativeFetch = global.fetch;

if (typeof nativeFetch === 'function') {
  global.fetch = function ikasEndpointCompat(input, init) {
    const raw = typeof input === 'string' ? input : input?.url;
    if (!raw) return nativeFetch(input, init);

    let nextUrl = raw;

    // ikas private/admin app token endpoint is global, not shop-specific.
    nextUrl = nextUrl.replace(
      /^https:\/\/[a-z0-9-]+\.myikas\.com\/api\/admin\/oauth\/token(?:\?.*)?$/i,
      'https://api.myikas.com/api/admin/oauth/token'
    );

    // Current Admin GraphQL endpoint.
    nextUrl = nextUrl.replace(
      'https://api.myikas.com/api/v1/admin/graphql',
      'https://api.myikas.com/api/v2/admin/graphql'
    );

    if (typeof input === 'string') return nativeFetch(nextUrl, init);
    return nativeFetch(new Request(nextUrl, input), init);
  };
}

require('./server.js');
