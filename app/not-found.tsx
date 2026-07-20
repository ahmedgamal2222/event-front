'use client';
/**
 * Smart 404 page — Cloudflare Pages serves this for any URL without a pre-built file.
 * If the path looks like an event slug, it fetches and renders the event.
 * Otherwise shows a proper Arabic 404 page.
 */
import { useState, useEffect } from 'react';
import EventLandingClient from './[slug]/Client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

export default function NotFound() {
  const [state, setState] = useState<'loading' | 'event' | 'notfound'>('loading');
  const [slug, setSlug] = useState('');
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Extract slug from URL path — remove leading/trailing slashes
    const path = window.location.pathname.replace(/^\/|\/$/g, '');

    // Ignore non-event paths (admin, archive, blog, etc.)
    const systemPaths = ['admin', 'archive', 'blog', 'terms', 'assign', ''];
    if (!path || systemPaths.some(p => path === p || path.startsWith(p + '/'))) {
      setState('notfound');
      return;
    }

    setSlug(path);

    // Try to fetch this event from API
    fetch(`${API_BASE}/api/events/${path}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setEventName(data.data.name_ar || data.data.name || path);
          setState('event');
        } else {
          setState('notfound');
        }
      })
      .catch(() => setState('notfound'));
  }, []);

  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0818',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        direction: 'rtl', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⟳</div>
          <p>جاري التحميل...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (state === 'event') {
    // Render the full event landing page for this slug
    return <EventLandingClient slug={slug} />;
  }

  // Proper 404 page
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0818',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      direction: 'rtl', fontFamily: 'system-ui, sans-serif', padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🌌</div>
        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
          404 — الصفحة غير موجودة
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '2rem' }}>
          الرابط الذي تبحث عنه غير موجود، أو قد يكون الحدث لم يُنشر بعد.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/"
            style={{
              background: '#6C63FF', color: 'white', textDecoration: 'none',
              padding: '0.65rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.95rem',
            }}>
            🏠 الصفحة الرئيسية
          </a>
          <a href="/archive"
            style={{
              background: 'rgba(108,99,255,0.15)', color: '#818cf8', textDecoration: 'none',
              padding: '0.65rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.95rem',
              border: '1px solid rgba(108,99,255,0.3)',
            }}>
            🗂 جميع الأحداث
          </a>
        </div>
      </div>
    </div>
  );
}
