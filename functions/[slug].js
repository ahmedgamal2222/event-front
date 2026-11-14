// functions/[slug].js
// روابط مباشرة للصفحات الثابتة: /{slug} → يقدّم صفحة /terms/ نفسها
// مع تمرير الـ slug عبر المسار (تقرأه الصفحة من pathname) — دون التأثير على صفحات الفعاليات.
const API = 'https://event-api.info1703.workers.dev';

export async function onRequest(context) {
  const { request, params, env, next } = context;

  // دع أي ملف/صفحة موجودة (صفحات الفعاليات، blog، admin …) تُخدم كما هي
  const assetResponse = await next();
  if (assetResponse.status !== 404 || request.method !== 'GET') return assetResponse;

  const raw = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  let slug = '';
  try { slug = raw ? decodeURIComponent(raw) : ''; } catch { slug = raw || ''; }
  if (!slug || slug.includes('.')) return assetResponse;

  try {
    const res = await fetch(`${API}/api/pages/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return assetResponse;
    const json = await res.json();
    if (!json || !json.success || !json.data) return assetResponse;

    const url = new URL(request.url);
    const target = new URL('/terms/', url.origin);
    const rewrite = new Request(target.toString(), { method: 'GET', headers: request.headers });
    return env.ASSETS.fetch(rewrite);
  } catch {
    return assetResponse;
  }
}
