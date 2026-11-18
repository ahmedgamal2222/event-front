// functions/payment.js
// /payment → إعادة توجيه دائم إلى الرابط الرسمي /{event-slug}/payment
const API = 'https://event-api.info1703.workers.dev';

export async function onRequest(context) {
  const { request, next } = context;
  const res = await next();
  if (res.status !== 404 || request.method !== 'GET') return res;

  try {
    const pageRes = await fetch(`${API}/api/pages/payment`, { headers: { Accept: 'application/json' } });
    if (!pageRes.ok) return res;
    const pageJson = await pageRes.json();
    if (!pageJson || !pageJson.success || !pageJson.data) return res;

    const eventsRes = await fetch(`${API}/api/events`, { headers: { Accept: 'application/json' } });
    const eventsJson = await eventsRes.json().catch(() => null);
    const events = eventsJson?.data || [];
    const ev = events.find(e => Number(e.id) === Number(pageJson.data.event_id)) || events[0];
    if (!ev?.slug) return res;

    const url = new URL(request.url);
    return Response.redirect(`${url.origin}/${ev.slug}/payment`, 301);
  } catch {
    return res;
  }
}
