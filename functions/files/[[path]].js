const TARGET = 'https://event-api.info1703.workers.dev';

// Serves https://s3syria.com/files/* by proxying the file from R2 via the API.
// Files are uploaded through the Admin "الملفات العامة" tab so the public link
// works exactly as: https://s3syria.com/files/{filename}
export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path ? `/${Array.isArray(params.path) ? params.path.join('/') : params.path}` : '';
  const url = new URL(request.url);
  const targetUrl = `${TARGET}/files${path}${url.search}`;

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
  const resHeaders = new Headers(res.headers);
  resHeaders.set('Access-Control-Allow-Origin', '*');
  resHeaders.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  resHeaders.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: resHeaders });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}