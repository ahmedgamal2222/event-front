// functions/f/[slug].js
// روابط الاستمارات المستقلة: /f/{slug} → يقدّم صفحة /forms/ التي تقرأ الـ slug من المسار
export async function onRequest(context) {
  const { request, env, next } = context;
  const res = await next();
  if (res.status !== 404 || request.method !== 'GET') return res;

  const url = new URL(request.url);
  const target = new URL('/forms/', url.origin);
  return env.ASSETS.fetch(new Request(target.toString(), { method: 'GET', headers: request.headers }));
}
