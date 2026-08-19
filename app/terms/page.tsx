'use client';
// app/terms/page.tsx - Terms & Privacy page
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PixelInjector from '../components/PixelInjector';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
const EVENT_ID = Number(process.env.NEXT_PUBLIC_EVENT_ID || 1);

// ─── Theme helpers (ألوان الثيم تطابق صفحة المدونات) ───────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return String(hex);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// تطبيق ألوان الثيم على متغيرات CSS العامة (نفس صفحة المدونات)
function applyThemeColors(colors: Record<string, string | number> = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const vars: Record<string, string> = {
    '--primary': String(colors.primary ?? '#14b8a6'),
    '--primary-dark': String(colors.primary_dark ?? '#0f766e'),
    '--accent': String(colors.accent ?? '#D4AF37'),
    '--bg-dark': String(colors.bg_dark ?? '#052e33'),
    '--bg-card': String(colors.bg_card ?? '#0b4248'),
    '--text': String(colors.text ?? '#e6f7f5'),
    '--text-muted': String(colors.text_muted ?? '#7fb8b1'),
    '--heading': String(colors.heading ?? '#ffffff'),
    '--btn-primary': String(colors.btn_primary_bg ?? '#0f766e'),
    '--btn-primary2': String(colors.btn_primary_bg2 ?? '#0d9488'),
    '--link-hover': String(colors.link_hover ?? '#0f766e'),
    '--gradient-from': String(colors.gradient_text_from ?? '#2dd4bf'),
    '--gradient-to': String(colors.gradient_text_to ?? '#D4AF37'),
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// تحميل ألوان الثيم من API وتطبيقها (نفس منطق صفحة المدونات)
function useThemeColors() {
  const [themeColors, setThemeColors] = useState<Record<string, string | number>>({});
  useEffect(() => {
    applyThemeColors(themeColors);
  }, [themeColors]);
  useEffect(() => {
    let active = true;
    const loadTheme = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events/${EVENT_ID}`, { cache: 'no-store' });
        const data = await res.json();
        if (data?.data?.site_config) {
          try {
            const sc = JSON.parse(data.data.site_config);
            if (sc.theme_colors && active) setThemeColors(sc.theme_colors);
          } catch {}
        }
      } catch {}
    };
    loadTheme();
    return () => { active = false; };
  }, []);
  return themeColors;
}

function TermsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'terms';
  const pageSlug = searchParams?.get('page');
  const [terms, setTerms] = useState<{ terms_content?: string; privacy_content?: string } | null>(null);
  const [staticPage, setStaticPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ألوان الثيم (نفس صفحة المدونات)
  const themeColors = useThemeColors();
  const primary = String(themeColors.primary || '#14b8a6');
  const bgDark = String(themeColors.bg_dark || '#052e33');
  const bgCard = String(themeColors.bg_card || '#0b4248');
  const text = String(themeColors.text || '#e6f7f5');
  const textMuted = String(themeColors.text_muted || '#7fb8b1');
  const heading = String(themeColors.heading || '#ffffff');
  const btnPrimary = String(themeColors.btn_primary_bg || '#0f766e');
  const btnPrimary2 = String(themeColors.btn_primary_bg2 || '#0d9488');
  const link = String(themeColors.link_hover || '#0f766e');
  const chipColor = String(themeColors.gradient_text_from || '#2dd4bf');

  // أنماط محتوى الشروط/الخصوصية (تتوافق مع ألوان الثيم)
  const STYLES = `
    .tc h2{color:${heading};font-size:1.4rem;font-weight:700;border-bottom:1px solid ${hexToRgba(primary, 0.25)};padding-bottom:.4rem;margin:1.5rem 0 .75rem}
    .tc h3{color:${chipColor};font-size:1.1rem;font-weight:700;margin:1.2rem 0 .5rem}
    .tc p{color:${text};line-height:1.9;margin-bottom:1rem}
    .tc ul,.tc ol{color:${text};padding-right:1.5rem;margin-bottom:1rem}
    .tc li{margin-bottom:.4rem;line-height:1.7}
    .tc strong{color:${heading}}
    .tc a{color:${primary};text-decoration:underline}
    .tc hr{border:none;border-top:1px solid ${hexToRgba(primary, 0.25)};margin:1.5rem 0}
  `;

  useEffect(() => {
    if (pageSlug) {
      // Load custom static page
      fetch(`${API_BASE}/api/events/${EVENT_ID}/pages/${pageSlug}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => { if (data.data) setStaticPage(data.data); })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    fetch(`${API_BASE}/api/events/${EVENT_ID}/terms`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (data.data) setTerms(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, pageSlug]);

  const active = tab === 'privacy' ? 'privacy' : 'terms';
  const tabStyle = (t: string) => ({
    padding: '0.5rem 1.25rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
    background: active === t ? btnPrimary : `${hexToRgba(primary, 0.1)}`, color: active === t ? '#ffffff' : textMuted, textDecoration: 'none', display: 'inline-block',
  } as React.CSSProperties);

  // Render custom static page
  if (pageSlug) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text)', fontFamily: 'Cairo,sans-serif', direction: 'rtl' }}>
        <PixelInjector eventId={EVENT_ID} />
        <div style={{ background: `${hexToRgba(primary, 0.06)}`, borderBottom: `1px solid ${hexToRgba(primary, 0.2)}`, padding: '1.5rem' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <a href="/" style={{ color: link, textDecoration: 'none', fontSize: '0.88rem' }}>← الصفحة الرئيسية</a>
          </div>
        </div>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: textMuted }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: 36, height: 36, border: `3px solid ${btnPrimary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !staticPage ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: textMuted }}>
              <p>الصفحة غير موجودة</p>
              <a href="/" style={{ color: link, marginTop: '1rem', display: 'inline-block' }}>← العودة للرئيسية</a>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: heading, marginBottom: '2rem', borderBottom: `1px solid ${hexToRgba(primary, 0.2)}`, paddingBottom: '1rem' }}>
                {staticPage.title_ar || staticPage.title}
              </h1>
              <style>{STYLES}</style>
              <div className="tc" dangerouslySetInnerHTML={{ __html: staticPage.content_ar || staticPage.content || '' }} />
            </>
          )}
        </div>
      </div>
    );
  }


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text)', fontFamily: 'Cairo,sans-serif', direction: 'rtl' }}>
      <PixelInjector eventId={EVENT_ID} />
      <div style={{ background: `${hexToRgba(primary, 0.06)}`, borderBottom: `1px solid ${hexToRgba(primary, 0.2)}`, padding: '1.5rem' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <a href="/" style={{ color: link, textDecoration: 'none', fontSize: '0.88rem' }}>← الصفحة الرئيسية</a>
        </div>
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <a href="/terms?tab=terms" style={tabStyle('terms')}>📋 الشروط والأحكام</a>
          <a href="/terms?tab=privacy" style={tabStyle('privacy')}>🔒 سياسة الخصوصية</a>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: textMuted }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 36, height: 36, border: `3px solid ${btnPrimary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : !(active === 'terms' ? terms?.terms_content : terms?.privacy_content) ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: textMuted }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
            <p>لم يتم إضافة هذا المحتوى بعد</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: heading, marginBottom: '2rem', borderBottom: `1px solid ${hexToRgba(primary, 0.2)}`, paddingBottom: '1rem' }}>
              {active === 'terms' ? 'الشروط والأحكام' : 'سياسة الخصوصية'}
            </h1>
            <style>{STYLES}</style>
            <div className="tc" dangerouslySetInnerHTML={{ __html: active === 'terms' ? (terms?.terms_content || '') : (terms?.privacy_content || '') }} />
          </>
        )}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #94a3b8)' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 40, height: 40, border: '3px solid var(--primary, #6C63FF)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <TermsContent />
    </Suspense>
  );
}
