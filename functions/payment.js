// functions/payment.js
// رابط مختصر لصفحة تفاصيل الدفع: /payment → /templates/payment.html
export async function onRequest(context) {
  const { request, env, next } = context;
  const res = await next();
  if (res.status !== 404 || request.method !== 'GET') return res;

  const url = new URL(request.url);
  const target = new URL('/templates/payment.html', url.origin);
  return env.ASSETS.fetch(new Request(target.toString(), { method: 'GET', headers: request.headers }));
}
