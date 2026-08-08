'use client';
import { useEffect } from 'react';

const DIRECT = 'https://event-api.info1703.workers.dev';
const PROXY   = '/api-proxy';

// Intercepts ALL fetch calls site-wide and rewrites workers.dev → /api-proxy
// on production domains, avoiding ERR_SSL_PROTOCOL_ERROR in blocked countries.
export default function ApiProxyInterceptor() {
  useEffect(() => {
    const host = window.location.hostname;
    const useProxy = host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.pages.dev');
    if (!useProxy) return;

    const original = window.fetch.bind(window);
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.startsWith(DIRECT)) {
        input = PROXY + input.slice(DIRECT.length);
      } else if (input instanceof Request && input.url.startsWith(DIRECT)) {
        input = new Request(PROXY + input.url.slice(DIRECT.length), input);
      }
      return original(input, init);
    };

    return () => { window.fetch = original; };
  }, []);

  return null;
}
