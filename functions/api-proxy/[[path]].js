const TARGET = 'https://event-api.info1703.workers.dev';

export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path ? `/${Array.isArray(params.path) ? params.path.join('/') : params.path}` : '';
  const url = new URL(request.url);
  const targetUrl = `${TARGET}${path}${url.search}`;

  // Forward the request with original method, headers, and body
  const proxyReq = new Request(targetUrl, {
    method: request.method,
    headers: (() => {
      const h = new Headers(request.headers);
      h.set('host', new URL(TARGET).host);
      return h;
    })(),
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'follow',
  });

  const res = await fetch(proxyReq);

  // Forward response with CORS headers
  const resHeaders = new Headers(res.headers);
  resHeaders.set('Access-Control-Allow-Origin', '*');
  resHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  resHeaders.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control');

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cache-Control',
      'Access-Control-Max-Age': '86400',
    },
  });
}
