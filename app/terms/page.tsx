'use client';
// app/terms/page.tsx - Terms & Privacy page
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import PixelInjector from '../components/PixelInjector';
import EmbeddedRegistrationForm from '../components/EmbeddedRegistrationForm';
import TallyEmbed from '../components/TallyEmbed';
import CompetitionPage from '../components/CompetitionPage';
import { apiFetch } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
const EVENT_ID = Number(process.env.NEXT_PUBLIC_EVENT_ID || 1);

// ─── لوحة ألوان داكنة صريحة للصفحات الثابتة (واضحة ومقروءة) ─────────────────
const DARK_PAGE = {
  bg: '#070c16',
  bgAlt: '#0a1120',
  card: 'rgba(255,255,255,0.035)',
  border: 'rgba(45,212,191,0.22)',
  text: '#e8eefc',
  muted: '#9fb0c9',
  heading: '#ffffff',
  accent: '#5eead4',
  accentSoft: 'rgba(45,212,191,0.10)',
};

const DARK_STYLES = `
  .sp-dark{color:${DARK_PAGE.text};font-size:1.04rem;line-height:2;font-family:Cairo,Tajawal,system-ui,-apple-system,'Segoe UI',sans-serif}
  .sp-dark *{color:${DARK_PAGE.text} !important;font-family:inherit}
  .sp-dark h1,.sp-dark h2,.sp-dark h3,.sp-dark h4,.sp-dark h5,.sp-dark strong,.sp-dark b{color:${DARK_PAGE.heading} !important}
  .sp-dark h1{font-size:1.9rem;font-weight:900;margin:0 0 1rem}
  .sp-dark h2{font-size:1.45rem;font-weight:800;margin:1.8rem 0 .8rem;border-bottom:1px solid ${DARK_PAGE.border};padding-bottom:.45rem}
  .sp-dark h3{font-size:1.2rem;font-weight:700;margin:1.3rem 0 .5rem;color:${DARK_PAGE.accent} !important}
  .sp-dark p,.sp-dark li{font-size:1.04rem;line-height:2;margin-bottom:.85rem}
  .sp-dark a{color:${DARK_PAGE.accent} !important;text-decoration:underline}
  .sp-dark ul,.sp-dark ol{padding-right:1.5rem;margin-bottom:1rem}
  .sp-dark li{margin-bottom:.4rem}
  .sp-dark img{max-width:100%;height:auto;border-radius:12px;margin:1rem 0}
  .sp-dark hr{border:none;border-top:1px solid rgba(148,163,184,.28);margin:1.6rem 0}
  .sp-dark table{width:100%;border-collapse:collapse;margin:1rem 0}
  .sp-dark td,.sp-dark th{border:1px solid rgba(148,163,184,.25);padding:.6rem .7rem;text-align:right}
  .sp-dark blockquote{border-right:4px solid ${DARK_PAGE.accent};background:${DARK_PAGE.accentSoft} !important;padding:.85rem 1rem;border-radius:8px;margin:1rem 0}
  .sp-dark [style*="background:#fff"],.sp-dark [style*="background: #fff"],.sp-dark [style*="background:white"],.sp-dark [style*="background: white"]{background:rgba(255,255,255,0.05) !important}
  .sp-dark [style*="color:#000"],.sp-dark [style*="color: #000"],.sp-dark [style*="color:black"]{color:${DARK_PAGE.text} !important}
  .sp-dark iframe{max-width:100%;border-radius:10px}
  @media(max-width:640px){.sp-dark p,.sp-dark li{font-size:1rem;line-height:1.9}.sp-wrap{padding:1rem !important}}
`;
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
  const pathname = usePathname();
  const tab = searchParams?.get('tab') || 'terms';
  // الصفحات الثابتة تُخدم أيضًا على رابط مباشر /{slug} (عبر Pages Function)
  const pathSlug = (() => {
    const segs = (pathname || '').split('/').filter(Boolean);
    if (segs.length !== 1) return null;
    const first = segs[0];
    if (['terms', 'blog', 'archive', 'admin', 'events', 'api-proxy'].includes(first)) return null;
    try { return decodeURIComponent(first); } catch { return first; }
  })();
  const pageSlug = searchParams?.get('page') || pathSlug;
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
      // Load custom static page (عبر lib/api لاستخدام البروكسي على النطاق الرسمي)
      apiFetch<any>(`/api/events/${EVENT_ID}/pages/${encodeURIComponent(pageSlug)}`)
        .then((data: any) => { if (data.data) setStaticPage(data.data); })
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

  useEffect(() => {
    if (!staticPage) return;
    const html = `${staticPage.content_ar || ''}${staticPage.content || ''}`;
    if (!html.includes('data-tally-src')) return; // لا يوجد Tally ملصوق داخل المحتوى

    const init = () => {
      const frames = document.querySelectorAll<HTMLIFrameElement>('.sp-dark iframe[data-tally-src]');
      frames.forEach(f => {
        if (!f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-tally-src') || '');
        f.style.background = 'transparent';
      });
      try { (window as any).Tally?.loadEmbeds?.(); } catch {}
    };

    init();
    let script = document.querySelector<HTMLScriptElement>('script[src="https://tally.so/widgets/embed.js"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://tally.so/widgets/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => { script?.removeEventListener('load', init); };
  }, [staticPage]);

  const active = tab === 'privacy' ? 'privacy' : 'terms';
  const tabStyle = (t: string) => ({
    padding: '0.5rem 1.25rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
    background: active === t ? btnPrimary : `${hexToRgba(primary, 0.1)}`, color: active === t ? '#ffffff' : textMuted, textDecoration: 'none', display: 'inline-block',
  } as React.CSSProperties);

  // Render custom static page (dark, readable, direct URL friendly)
  if (pageSlug) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${DARK_PAGE.bg} 0%, ${DARK_PAGE.bgAlt} 100%)`, color: DARK_PAGE.text, fontFamily: 'Cairo,Tajawal,system-ui,-apple-system,Segoe UI,sans-serif', direction: 'rtl' }}>
        <style>{DARK_STYLES}</style>
        <PixelInjector eventId={EVENT_ID} />
        <div style={{ background: 'rgba(45,212,191,0.06)', borderBottom: `1px solid ${DARK_PAGE.border}`, padding: '1.1rem 1.5rem' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <a href="/" style={{ color: DARK_PAGE.accent, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>← الصفحة الرئيسية</a>
            <span style={{ color: DARK_PAGE.muted, fontSize: '0.78rem' }}>صفحة معلومات</span>
          </div>
        </div>
        <div className="sp-wrap" style={{ maxWidth: staticPage?.template === 'competition' ? '100%' : 860, margin: '0 auto', padding: staticPage?.template === 'competition' ? 0 : '2.25rem 1.5rem 5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: DARK_PAGE.muted }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: 36, height: 36, border: `3px solid ${DARK_PAGE.accent}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !staticPage ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: DARK_PAGE.muted }}>
              <p>الصفحة غير موجودة</p>
              <a href="/" style={{ color: DARK_PAGE.accent, marginTop: '1rem', display: 'inline-block' }}>← العودة للرئيسية</a>
            </div>
          ) : staticPage.template === 'competition' ? (
            <CompetitionPage
              tallyUrl={staticPage.tally_url || ''}
              eventId={EVENT_ID}
              eventName={staticPage.title_ar || 'قمة الشركات الناشئة السورية'}
            />
          ) : (
            <div style={{ background: DARK_PAGE.card, border: `1px solid ${DARK_PAGE.border}`, borderRadius: '1.1rem', padding: '2rem' }}>
              <h1 style={{ fontSize: '1.95rem', fontWeight: 900, color: DARK_PAGE.heading, margin: '0 0 1.5rem', borderBottom: `1px solid ${DARK_PAGE.border}`, paddingBottom: '0.9rem', lineHeight: 1.5 }}>
                {staticPage.title_ar || staticPage.title}
              </h1>
              {(staticPage.content_ar || staticPage.content) && (
                <div className="tc sp-dark" dangerouslySetInnerHTML={{ __html: staticPage.content_ar || staticPage.content || '' }} />
              )}

              {/* نموذج Tally مضمّن (بخلفية شفافة وارتفاع تلقائي) */}
              {staticPage.tally_url ? (
                <div style={{ marginTop: (staticPage.content_ar || staticPage.content) ? '2rem' : 0 }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: DARK_PAGE.heading, margin: '0 0 1rem' }}>📝 استمارة التسجيل</h2>
                  <TallyEmbed url={staticPage.tally_url} title={staticPage.title_ar || 'استمارة التسجيل'} />
                </div>
              ) : Number(staticPage.embed_form) === 1 ? (
                <div style={{ marginTop: (staticPage.content_ar || staticPage.content) ? '2rem' : 0 }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: DARK_PAGE.heading, margin: '0 0 1rem' }}>📝 استمارة التسجيل</h2>
                  <EmbeddedRegistrationForm eventId={EVENT_ID} primaryColor={btnPrimary2} />
                </div>
              ) : null}
            </div>
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
          {!pageSlug && (
            <>
              <a href="/terms?tab=terms" style={tabStyle('terms')}>📋 الشروط والأحكام</a>
              <a href="/terms?tab=privacy" style={tabStyle('privacy')}>🔒 سياسة الخصوصية</a>
            </>
          )}
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
