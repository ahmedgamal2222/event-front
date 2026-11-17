// functions/[event]/[form].js
// روابط الاستمارات: /{event-slug}/{form-slug} → يقدّم صفحة /forms/ (تقرأ الـ slug من المسار)
// لا يعمل إلا إذا كان الشريط الأول حدثًا حقيقيًا والثاني استمارة تابعة لنفس الحدث.
const API = 'https://event-api.info1703.workers.dev';

export async function onRequest(context) {
  const { request, params, env, next } = context;

  const assetResponse = await next();
  if (assetResponse.status !== 404 || request.method !== 'GET') return assetResponse;

  const evSlug = Array.isArray(params.event) ? params.event[0] : params.event;
  const formSlug = Array.isArray(params.form) ? params.form[0] : params.form;
  if (!evSlug || !formSlug || String(formSlug).includes('.')) return assetResponse;

  try {
    const evRes = await fetch(`${API}/api/events/${encodeURIComponent(evSlug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!evRes.ok) return assetResponse;
    const ev = await evRes.json();
    if (!ev || !ev.success || !ev.data) return assetResponse;

    const formRes = await fetch(`${API}/api/forms/${encodeURIComponent(formSlug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!formRes.ok) return assetResponse;
    const form = await formRes.json();
    if (!form || !form.success || !form.data) return assetResponse;
    if (Number(form.data.event_id) !== Number(ev.data.id)) return assetResponse;

    const url = new URL(request.url);
    const target = new URL('/forms/', url.origin);
    return env.ASSETS.fetch(new Request(target.toString(), { method: 'GET', headers: request.headers }));
  } catch {
    return assetResponse;
  }
}
