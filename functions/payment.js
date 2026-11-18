// functions/payment.js
// /payment → صفحة «تفاصيل الدفع» المُدارة من الصفحات الثابتة (DB)
// لا يخدم أي ملف ثابت؛ يتحقق من وجود صفحة slug=payment ثم يقدّم صفحة /terms/
const API = 'https://event-api.info1703.workers.dev';

export async function onRequest(context) {
  const { request, env, next } = context;
  const res = await next();
  if (res.status !== 404 || request.method !== 'GET') return res;

  try {
    const r = await fetch(`${API}/api/pages/payment`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return res;
    const j = await r.json();
    if (!j || !j.success || !j.data) return res;

    const url = new URL(request.url);
    const target = new URL('/terms/', url.origin);
    return env.ASSETS.fetch(new Request(target.toString(), { method: 'GET', headers: request.headers }));
  } catch {
    return res;
  }
}
