// functions/[event]/[form].js
// روابط الاستمارات: /{event-slug}/{form-slug} → صفحة /forms/
// وروابط الصفحات الثابتة: /{event-slug}/{page-slug} → صفحة /terms/
const API = 'https://event-api.info1703.workers.dev';

export async function onRequest(context) {
  const { request, params, env, next } = context;

  const assetResponse = await next();
  if (assetResponse.status !== 404 || request.method !== 'GET') return assetResponse;

  const evSlug = Array.isArray(params.event) ? params.event[0] : params.event;
  const slug = Array.isArray(params.form) ? params.form[0] : params.form;
  if (!evSlug || !slug || String(slug).includes('.')) return assetResponse;

  try {
    const evRes = await fetch(`${API}/api/events/${encodeURIComponent(evSlug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!evRes.ok) return assetResponse;
    const ev = await evRes.json();
    if (!ev || !ev.success || !ev.data) return assetResponse;

    // 1) استمارة مستقلة
    const formRes = await fetch(`${API}/api/forms/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (formRes.ok) {
      const form = await formRes.json();
      if (form && form.success && form.data && Number(form.data.event_id) === Number(ev.data.id)) {
        const url = new URL(request.url);
        const target = new URL('/forms/', url.origin);
        return env.ASSETS.fetch(new Request(target.toString(), { method: 'GET', headers: request.headers }));
      }
    }

    // 2) صفحة ثابتة بنفس المسار (مثل /{event-slug}/payment)
    const pageRes = await fetch(`${API}/api/pages/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (pageRes.ok) {
      const page = await pageRes.json();
      if (page && page.success && page.data && Number(page.data.event_id) === Number(ev.data.id)) {
        const url = new URL(request.url);
        const target = new URL('/terms/', url.origin);
        return env.ASSETS.fetch(new Request(target.toString(), { method: 'GET', headers: request.headers }));
      }
    }

    return assetResponse;
  } catch {
    return assetResponse;
  }
}
