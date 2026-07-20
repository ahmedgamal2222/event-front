# Environment Setup for Cloudflare Pages

## Required Environment Variables

### For Local Development
Create a `.env.local` file in the project root:
```
NEXT_PUBLIC_API_URL=https://event-api.info1703.workers.dev
NEXT_PUBLIC_EVENT_SLUG=
```

### For Cloudflare Pages Production

1. **Log in** to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Pages**
3. Select your project (`event-web`)
4. Go to **Settings** → **Environment variables**
5. Click **Add variable** and set:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://event-api.info1703.workers.dev` |
| `NEXT_PUBLIC_EVENT_SLUG` |

**Important:** The `NEXT_PUBLIC_` prefix means these variables are exposed to the browser (public).

## If Variables Not Set

- Frontend will fall back to default API URL: `https://event-api.info1703.workers.dev`
- Console warning will appear: `⚠️ NEXT_PUBLIC_API_URL not set, using default API endpoint`

## Redeploy After Changes

After updating environment variables in Cloudflare Pages:
1. Trigger a new build/deployment (git push or manual redeploy)
2. Clear browser cache or use incognito mode
3. Verify API requests in browser DevTools Network tab
